import { useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { getUsersNotAssignedOnDate } from '../../../utils/exclusionLogic';
import { suspensionService } from '../../../services/suspensionService';
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

// Servidores que sirven cada 3 meses — reciben menor prioridad en el algoritmo
const QUARTERLY_SERVERS = new Set([
    'alejandro melendez',
    'andrea callimore',
    'omar salazar',
    'jeinnel newball',
    'priscila clarke',
    'andre arias',
    'cinthya marin',
    'deykell taylor',
    'diandra wilson',
    'marla brack',
    'dunia lopez',
    'elena zuniga',
    'floribeth zuniga',
    'hillary ramirez',
    'holiber hall',
    'jairon arias',
    'jerrylin lemones',
    'joislin newball',
    'kenisha galagarza',
    'marco murillo',
    'merielen somarribas',
    'natalia solano',
    'yasling rodriguez',
    'tanasha daviey',
    'jose funes',
]);

const normalizeForQuarterly = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const isQuarterlyServer = (user: PublicUser) => {
    const fullName = normalizeForQuarterly(`${user.nombre} ${user.apellido}`);
    return QUARTERLY_SERVERS.has(fullName);
};

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

                    let eligibleUsers = isIntercesion
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

                    for (const pos of positions) {
                        if (!pass.predicate(pos)) continue;
                        
                        const quota = serviceConfig.positionQuotas[pos.id] || 0;
                        for (let q = 0; q < quota; q++) {
                            const slotKey = `${config.id}-${pos.id}-${q}`;
                            if (assignedPositions.has(slotKey)) continue;

                            let candidates = eligibleUsers.filter(u => {
                                if (!isIntercesion && assignments.some(a => String(a.configuracion_dia_id) === String(config.id) && String(a.usuario_id) === String(u.id))) return false;
                                const reqGen = String(pos.genero_requerido || 'A').toUpperCase();
                                if (reqGen !== 'A' && String(u.genero).toUpperCase() !== reqGen) return false;
                                if (pass.name === 'Leadership' && !(usersMap[String(u.id)]?.isInternalLeader)) return false;
                                return true;
                            });

                            if (candidates.length === 0) continue;

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

                                // Penalizar servidores trimestrales — sirven cada 3 meses
                                if (isQuarterlyServer(u1)) s1 -= 100;
                                if (isQuarterlyServer(u2)) s2 -= 100;

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
                            if (isQuarterlyServer(selected)) reasons.push('Servidor trimestral (baja prioridad)');

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
