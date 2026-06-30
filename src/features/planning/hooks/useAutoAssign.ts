import { useState } from 'react';
import dayjs from 'dayjs';
import { supabase } from '../../../services/supabaseClient';
import { getUsersNotAssignedOnDate } from '../../../utils/exclusionLogic';
import { suspensionService } from '../../../services/suspensionService';
import {
    loadServidorRestricciones,
    resolverUniformeRequerido,
    evaluarBloqueoServidor,
    gruposDeUsuario,
    TIPO_SEMANA_ADORACION,
    type ServidorRuntime,
    type SlotContext,
} from '../../../services/servidorRestriccionesService';
import type { Position, PublicUser } from '../../../types';

interface ServiceDateConfig {
    type: string;
    uniform: string;
    encargado_id?: string | number | null;
    encargado_2_id?: string | number | null;
    positionQuotas: Record<string, number>;
}

interface SavedConfig {
    id: string | number;
    fecha: string;
    serviceIndex?: number;
}

interface DraftAssignment {
    configuracion_dia_id: string | number;
    usuario_id: string | number;
    usuario: PublicUser;
    posicion_id: string | number;
    posicion: Position;
    aiMetadata: {
        reasons: string[];
        usageInPlan: number;
    };
}

interface AutoAssignResult {
    assignments: DraftAssignment[];
    diagnostics: {
        deptUsersFound: number;
        datesProcessed: number;
        details: string[];
    };
}

interface UserWithMetadata extends PublicUser {
    roles: string[];
    isExternalLeader: boolean;
    isInternalLeader: boolean;
    totalServedCount: number;
}

interface MembershipQueryResponse {
    usuario_id: number;
    rol_jerarquico: string;
    usuario: PublicUser;
}

interface OtherMembershipResponse {
    usuario_id: number;
    departamento_id: number;
    rol_jerarquico: string;
}

export const useAutoAssign = (selectedDept: string | number | null) => {
    const [loading, setLoading] = useState(false);

    const generateAssignments = async (
        savedConfigs: SavedConfig[],
        serviceConfigs: Record<string, ServiceDateConfig[]>,
        positions: Position[]
    ): Promise<AutoAssignResult> => {
        setLoading(true);
        try {
            // 1. Fetch department users and info
            const { data: deptInfo } = await supabase.from('departamentos').select('nombre').eq('id', Number(selectedDept)).single();
            const deptNombre = deptInfo?.nombre?.toLowerCase() || '';
            const isSecurity = deptNombre.includes('seguridad');
            const isIntercesion = deptNombre.includes('intercesi');
            const allowsRepeatedServers = isIntercesion || deptNombre.includes('producci');

            const { data: mData } = await supabase
                .from('membresias')
                .select('usuario_id, rol_jerarquico, usuario:usuarios(*)')
                .eq('departamento_id', Number(selectedDept)) as { data: MembershipQueryResponse[] | null };

            if (!mData || mData.length === 0) {
                console.warn("No memberships found for dept:", selectedDept);
                return { assignments: [], diagnostics: { deptUsersFound: 0, datesProcessed: 0, details: [] } };
            }

            const userIds = mData.map(m => m.usuario_id);

            // 2. Fetch ALL memberships for these users to find external leadership roles
            const { data: allM } = await supabase
                .from('membresias')
                .select('usuario_id, departamento_id, rol_jerarquico')
                .in('usuario_id', userIds) as { data: OtherMembershipResponse[] | null };

            const normalize = (str: string | null | undefined) => str?.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || '';

            // 3. Process users and identify internal/external roles
            const usersMap: Record<string, UserWithMetadata> = {};
            mData.forEach(m => {
                if (!m.usuario) return;
                const uid = String(m.usuario.id);
                const internalRole = normalize(m.rol_jerarquico);
                if (!usersMap[uid]) {
                    usersMap[uid] = {
                        ...m.usuario,
                        roles: [],
                        isExternalLeader: false,
                        isInternalLeader: ['lider', 'sublider', 'encargado', 'liderazgo'].includes(internalRole),
                        totalServedCount: 0
                    };
                }
                usersMap[uid].roles.push(internalRole);
            });

            // Flag users who are leaders/subleaders in other departments
            (allM || []).forEach(m => {
                const uid = String(m.usuario_id);
                if (usersMap[uid] && Number(m.departamento_id) !== Number(selectedDept)) {
                    const role = normalize(m.rol_jerarquico);
                    if (['lider', 'sublider'].includes(role)) {
                        usersMap[uid].isExternalLeader = true;
                    }
                }
            });

            const deptUsers = Object.values(usersMap);

            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            const { data: recentAssignments } = await supabase
                .from('asignaciones')
                .select('usuario_id, configuracion_dia(fecha)')
                .gte('configuracion_dia.fecha', lastMonth.toISOString().slice(0, 10)) as { data: { usuario_id: number; configuracion_dia: { fecha: string } }[] | null };

            const recentCount: Record<string, number> = {};
            if (recentAssignments) {
                recentAssignments.forEach(a => {
                    const uid = String(a.usuario_id);
                    recentCount[uid] = (recentCount[uid] || 0) + 1;
                    if (usersMap[uid]) {
                        usersMap[uid].totalServedCount = (usersMap[uid].totalServedCount || 0) + 1;
                    }
                });
            }

            // 4. Fetch Suspension Data
            const allSuspensions = await suspensionService.getAllSuspensions();

            // ─── 3-PASS ASSIGNMENT STRATEGY ──────────────────────────────────
            const assignments: DraftAssignment[] = [];
            const configsSorted = [...savedConfigs].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
            const planUsageCount: Record<string, number> = {};

            // 5. Restricciones de Servidores (solo aplican al departamento Servidores, id 2)
            const isServidores = Number(selectedDept) === 2;
            const restrData = isServidores ? await loadServidorRestricciones() : null;

            // Historial extendido (6 meses) para frecuencia y topes mensuales
            const lastServed: Record<string, string> = {};       // último servicio conocido (incl. plan)
            const monthTotal: Record<string, number> = {};       // asignaciones del mes objetivo
            const monthDom: Record<string, number> = {};
            const monthWeek: Record<string, number> = {};
            const conteoGruposPorDia: Record<string, Map<number, number>> = {};
            if (isServidores && configsSorted.length > 0) {
                const ref = dayjs(configsSorted[0].fecha);
                const monthStart = ref.startOf('month').format('YYYY-MM-DD');
                const monthEnd = ref.endOf('month').format('YYYY-MM-DD');
                const sixMonthsAgo = ref.subtract(6, 'month').format('YYYY-MM-DD');
                const { data: extHistory } = await supabase
                    .from('asignaciones')
                    .select('usuario_id, configuracion_dia!inner(fecha)')
                    .gte('configuracion_dia.fecha', sixMonthsAgo) as { data: { usuario_id: number; configuracion_dia: { fecha: string } }[] | null };
                (extHistory || []).forEach(h => {
                    const uid = String(h.usuario_id);
                    const f = h.configuracion_dia.fecha;
                    if (!lastServed[uid] || f > lastServed[uid]) lastServed[uid] = f;
                    if (f >= monthStart && f <= monthEnd) {
                        monthTotal[uid] = (monthTotal[uid] || 0) + 1;
                        if (dayjs(f).day() === 0) monthDom[uid] = (monthDom[uid] || 0) + 1;
                        else monthWeek[uid] = (monthWeek[uid] || 0) + 1;
                    }
                });
            }

            const passes = [
                { name: 'Leadership', predicate: (p: Position) => p.nombre.toLowerCase().includes('encargado') },
                { name: 'Gender Restricted', predicate: (p: Position) => !!p.genero_requerido && p.genero_requerido !== 'A' },
                { name: 'General', predicate: () => true }
            ];

            const assignedPositions = new Set<string>(); 

            for (const pass of passes) {
                for (const config of configsSorted) {
                    const dateStr = config.fecha;
                    const sIdx = config.serviceIndex || 0;
                    const dayConfigs = serviceConfigs[dateStr] || [];
                    const serviceConfig = dayConfigs[sIdx];
                    if (!serviceConfig) continue;

                    let eligibleUsers = allowsRepeatedServers
                        ? deptUsers
                        : await getUsersNotAssignedOnDate(
                            dateStr,
                            deptUsers,
                            undefined,
                            isSecurity ? sIdx : undefined
                        );
                    eligibleUsers = eligibleUsers.filter(u => u.activo !== false);

                    const suspendedIds = allSuspensions
                        .filter(s => s.fecha_inicio <= dateStr && (!s.fecha_fin || s.fecha_fin >= dateStr))
                        .map(s => String(s.usuario_id));
                    
                    eligibleUsers = eligibleUsers.filter(u => !suspendedIds.includes(String(u.id)));

                    // Contexto del slot para el motor de restricciones (solo Servidores)
                    const diaSemana = dayjs(dateStr).day();
                    const slotCtxBase = restrData ? {
                        fecha: dateStr,
                        diaSemana,
                        esDomingo: diaSemana === 0,
                        esSemanaAdoracion: (serviceConfig.type || '') === TIPO_SEMANA_ADORACION,
                        uniformeRequeridoId: resolverUniformeRequerido(serviceConfig.uniform, restrData),
                    } : null;

                    for (const pos of positions) {
                        if (!pass.predicate(pos)) continue;

                        const ctx: SlotContext | null = slotCtxBase ? { ...slotCtxBase, posicionId: Number(pos.id) } : null;
                        const quota = serviceConfig.positionQuotas[pos.id] || 0;
                        for (let q = 0; q < quota; q++) {
                            const slotKey = `${config.id}-${pos.id}-${q}`;
                            if (assignedPositions.has(slotKey)) continue;

                            const candidates = eligibleUsers.filter(u => {
                                if (!allowsRepeatedServers && assignments.some(a => String(a.configuracion_dia_id) === String(config.id) && String(a.usuario_id) === String(u.id))) return false;
                                const reqGen = String(pos.genero_requerido || 'A').toUpperCase();
                                if (reqGen !== 'A' && String(u.genero).toUpperCase() !== reqGen) return false;
                                if (pass.name === 'Leadership' && !(usersMap[String(u.id)]?.isInternalLeader)) return false;
                                // Filtro duro de restricciones de Servidores
                                if (restrData && ctx) {
                                    const uid = String(u.id);
                                    // Tope global: cada servidor sirve a lo sumo 1 vez al mes (encargados exentos)
                                    if (!usersMap[uid]?.isInternalLeader && (monthTotal[uid] || 0) >= 1) return false;
                                    const rt: ServidorRuntime = {
                                        esLiderExterno: !!usersMap[uid]?.isExternalLeader,
                                        ultimoServicio: lastServed[uid] || null,
                                        asignacionesMes: monthTotal[uid] || 0,
                                        asignacionesMesDomingo: monthDom[uid] || 0,
                                        asignacionesMesEntreSemana: monthWeek[uid] || 0,
                                        conteoGruposEseDia: conteoGruposPorDia[dateStr] || (conteoGruposPorDia[dateStr] = new Map<number, number>()),
                                    };
                                    if (evaluarBloqueoServidor(Number(u.id), ctx, restrData, rt).bloqueado) return false;
                                }
                                return true;
                            });

                            if (candidates.length === 0) continue;

                            // Co-asignación (preferente): IDs ya asignados en este servicio
                            const sameConfigIds = new Set(
                                assignments.filter(a => String(a.configuracion_dia_id) === String(config.id)).map(a => String(a.usuario_id))
                            );
                            const tienePareja = (uid: string) => {
                                const parejas = restrData?.coasignacionParejas.get(Number(uid));
                                if (!parejas) return false;
                                for (const p of parejas) if (sameConfigIds.has(String(p))) return true;
                                return false;
                            };

                            // Scoring
                            candidates.sort((u1, u2) => {
                                const uid1 = String(u1.id);
                                const uid2 = String(u2.id);
                                let s1 = 0;
                                let s2 = 0;

                                s1 -= (recentCount[uid1] || 0) * 20;
                                s2 -= (recentCount[uid2] || 0) * 20;
                                s1 -= (planUsageCount[uid1] || 0) * 50;
                                s2 -= (planUsageCount[uid2] || 0) * 50;

                                // Penalizar líderes de otros departamentos para darles menor prioridad
                                if (usersMap[uid1]?.isExternalLeader) s1 -= 40;
                                if (usersMap[uid2]?.isExternalLeader) s2 -= 40;

                                // Preferir co-asignación: si su pareja ya sirve en este servicio
                                if (tienePareja(uid1)) s1 += 60;
                                if (tienePareja(uid2)) s2 += 60;

                                if (pass.name === 'General') {
                                    const team = assignments.filter(a => String(a.configuracion_dia_id) === String(config.id));
                                    const hasVeteran = team.some(a => (usersMap[String(a.usuario_id)]?.totalServedCount || 0) > 10);
                                    const hasNew = team.some(a => (usersMap[String(a.usuario_id)]?.totalServedCount || 0) < 3);

                                    if (!hasVeteran && (usersMap[uid1]?.totalServedCount || 0) > 10) s1 += 30;
                                    if (!hasVeteran && (usersMap[uid2]?.totalServedCount || 0) > 10) s2 += 30;
                                    if (!hasNew && (usersMap[uid1]?.totalServedCount || 0) < 3) s1 += 20;
                                    if (!hasNew && (usersMap[uid2]?.totalServedCount || 0) < 3) s2 += 20;
                                }

                                return s2 - s1;
                            });

                            const selected = candidates[0];
                            const reasons = [];
                            if (pass.name === 'Leadership') reasons.push('Líder necesario');
                            if (pass.name === 'Gender Restricted') reasons.push('Restricción de género');
                            const totalSrv = usersMap[String(selected.id)]?.totalServedCount || 0;
                            if (totalSrv > 10) reasons.push('Aporta experiencia');
                            if (totalSrv < 3) reasons.push('Integración de nuevo');
                            if ((recentCount[String(selected.id)] || 0) === 0) reasons.push('Equidad: No ha servido');
                            if (!usersMap[String(selected.id)]?.isExternalLeader) reasons.push('Sin liderazgo externo');

                            assignments.push({
                                configuracion_dia_id: config.id,
                                usuario_id: selected.id,
                                usuario: selected,
                                posicion_id: pos.id,
                                posicion: pos,
                                aiMetadata: {
                                    reasons,
                                    usageInPlan: planUsageCount[String(selected.id)] || 0
                                }
                            });
                            
                            assignedPositions.add(slotKey);
                            planUsageCount[String(selected.id)] = (planUsageCount[String(selected.id)] || 0) + 1;

                            // Actualizar estado del motor de restricciones
                            if (restrData) {
                                const sid = String(selected.id);
                                monthTotal[sid] = (monthTotal[sid] || 0) + 1;
                                if (diaSemana === 0) monthDom[sid] = (monthDom[sid] || 0) + 1;
                                else monthWeek[sid] = (monthWeek[sid] || 0) + 1;
                                if (!lastServed[sid] || dateStr > lastServed[sid]) lastServed[sid] = dateStr;
                                const conteo = conteoGruposPorDia[dateStr] || (conteoGruposPorDia[dateStr] = new Map<number, number>());
                                gruposDeUsuario(Number(selected.id), restrData).forEach(gid => conteo.set(gid, (conteo.get(gid) || 0) + 1));
                            }
                        }
                    }
                }
            }

            return { assignments, diagnostics: { deptUsersFound: deptUsers.length, datesProcessed: configsSorted.length, details: [] } };
        } catch (error) {
            console.error('Error generating assignments:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { generateAssignments, loading };
};
