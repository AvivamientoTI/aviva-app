import { supabase } from './supabaseClient';
import { suspensionService } from './suspensionService';
import dayjs from 'dayjs';
import {
    SERVIDORES_DEPT_ID,
    TIPO_SEMANA_ADORACION,
    loadServidorRestricciones,
    resolverUniformeRequerido,
    evaluarBloqueoServidor,
    gruposDeUsuario,
    type SlotContext,
    type ServidorRuntime,
} from './servidorRestriccionesService';
import type { PublicUser } from '../types';

const normalizeRole = (s: string | null | undefined) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export interface ScoredCandidate extends PublicUser {
    score: number;
    matchReasons: string[];
    lastServedDate?: string;
    roles: string[];
    isVeteran?: boolean;
    totalServedCount?: number;
}

interface UserQueryResponse {
    id: number;
    nombre: string;
    apellido: string;
    genero: string;
    activo: boolean;
}

interface MemberQueryResponse {
    usuario_id: number;
    rol_jerarquico: string;
    usuario: UserQueryResponse | UserQueryResponse[];
}

export const recommendationService = {
    /**
     * Finds candidates for a specific position, applying hard filters and AI scoring.
     */
    async getRecommendations(
        date: string,
        departmentId: number,
        options: {
            positionRequiresGender?: 'M' | 'F' | null;
            positionRequiresLeadership?: boolean;
            teamComposition?: { veterans: number; regulars: number; new: number };
            positionId?: number | null;
        } = {}
    ): Promise<ScoredCandidate[]> {
        const { positionRequiresGender = null, positionRequiresLeadership = false, teamComposition = null, positionId = null } = options;

        // 1. Fetch department members
        const { data: members, error: membersError } = await supabase
            .from('membresias')
            .select(`
                usuario_id, 
                rol_jerarquico, 
                usuario:usuarios (id, nombre, apellido, genero, activo)
            `)
            .eq('departamento_id', departmentId) as { data: MemberQueryResponse[] | null; error: unknown };

        if (membersError) throw membersError;
        if (!members) return [];

        // 2. Fetch active suspensions & busy users & config
        const [allSuspensions, busyAssignments, serviceConfigs] = await Promise.all([
            suspensionService.getAllSuspensions(),
            supabase
                .from('asignaciones')
                .select('usuario_id, configuracion_dia!inner(fecha)')
                .eq('configuracion_dia.fecha', date),
            supabase
                .from('configuracion_dia')
                .select('turno, tipo_servicio, color_uniforme')
                .eq('fecha', date)
                .limit(1)
        ]);

        const suspendedUserIds = new Set(
            allSuspensions
                .filter(s => s.fecha_inicio <= date && (!s.fecha_fin || s.fecha_fin >= date))
                .map(s => s.usuario_id)
        );
        const busyUserIds = new Set(busyAssignments.data?.map(a => a.usuario_id) || []);

        const turno = serviceConfigs.data?.[0]?.turno || 'Noche';
        const dayOfWeek = dayjs(date).day();

        const { data: blockedAvailability } = await supabase
            .from('horarios_no_disponibilidad')
            .select('usuario_id')
            .eq('dia_semana', dayOfWeek)
            .eq('turno', turno);

        const blockedUserIds = new Set(blockedAvailability?.map(b => b.usuario_id) || []);

        // 3. Experience & History Analysis (Last 6 months)
        const sixMonthsAgo = dayjs().subtract(6, 'months').format('YYYY-MM-DD');
        const { data: history } = await supabase
            .from('asignaciones')
            .select('usuario_id, configuracion_dia!inner(fecha)')
            .gte('configuracion_dia.fecha', sixMonthsAgo)
            .order('configuracion_dia(fecha)', { ascending: false }) as { data: { usuario_id: number; configuracion_dia: { fecha: string } }[] | null };

        const lastServiceMap: Record<number, string> = {};
        const serviceCountMap: Record<number, number> = {};
        const monthTotal: Record<number, number> = {};
        const monthDom: Record<number, number> = {};
        const monthWeek: Record<number, number> = {};
        const monthStart = dayjs(date).startOf('month').format('YYYY-MM-DD');
        const monthEnd = dayjs(date).endOf('month').format('YYYY-MM-DD');

        history?.forEach(h => {
            const uid = h.usuario_id;
            const f = h.configuracion_dia.fecha;
            if (!lastServiceMap[uid]) lastServiceMap[uid] = f;
            serviceCountMap[uid] = (serviceCountMap[uid] || 0) + 1;
            if (f >= monthStart && f <= monthEnd) {
                monthTotal[uid] = (monthTotal[uid] || 0) + 1;
                if (dayjs(f).day() === 0) monthDom[uid] = (monthDom[uid] || 0) + 1;
                else monthWeek[uid] = (monthWeek[uid] || 0) + 1;
            }
        });

        // 3b. Motor de restricciones de Servidores (solo para ese departamento)
        const isServidores = Number(departmentId) === SERVIDORES_DEPT_ID;
        const restrData = isServidores ? await loadServidorRestricciones() : null;
        let slotCtx: SlotContext | null = null;
        const externalLeaders = new Set<number>();
        const gruposCubiertos = new Map<number, number>();
        if (restrData) {
            const cfg = serviceConfigs.data?.[0] as { tipo_servicio?: string; color_uniforme?: string } | undefined;
            slotCtx = {
                fecha: date,
                diaSemana: dayOfWeek,
                esDomingo: dayOfWeek === 0,
                esSemanaAdoracion: (cfg?.tipo_servicio || '') === TIPO_SEMANA_ADORACION,
                uniformeRequeridoId: resolverUniformeRequerido(cfg?.color_uniforme, restrData),
                posicionId: Number(positionId ?? 0),
            };
            // Líderes de otros departamentos (para el bundle de liderazgo externo)
            const memberIds = members.map(m => m.usuario_id);
            const { data: allM } = await supabase
                .from('membresias')
                .select('usuario_id, departamento_id, rol_jerarquico')
                .in('usuario_id', memberIds) as { data: { usuario_id: number; departamento_id: number; rol_jerarquico: string }[] | null };
            (allM || []).forEach(mm => {
                if (Number(mm.departamento_id) !== Number(departmentId) &&
                    ['lider', 'sublider'].includes(normalizeRole(mm.rol_jerarquico))) {
                    externalLeaders.add(mm.usuario_id);
                }
            });
            // Conteo de grupos de incompatibilidad ya cubiertos ese día por los asignados
            busyUserIds.forEach(uid => gruposDeUsuario(uid, restrData).forEach(g => gruposCubiertos.set(g, (gruposCubiertos.get(g) || 0) + 1)));
        }

        // 4. Scoring Logic
        const candidates: ScoredCandidate[] = [];

        for (const m of members) {
            const user = (Array.isArray(m.usuario) ? m.usuario[0] : m.usuario);
            if (!user || user.activo === false) continue;

            // --- HARD FILTERS ---
            if (suspendedUserIds.has(user.id)) continue;
            if (busyUserIds.has(user.id)) continue;
            if (positionRequiresGender && user.genero !== positionRequiresGender) continue;
            if (blockedUserIds.has(user.id)) continue;

            // Restricciones de Servidores (filtro duro)
            if (restrData && slotCtx && positionId != null) {
                const rt: ServidorRuntime = {
                    esLiderExterno: externalLeaders.has(user.id),
                    ultimoServicio: lastServiceMap[user.id] || null,
                    asignacionesMes: monthTotal[user.id] || 0,
                    asignacionesMesDomingo: monthDom[user.id] || 0,
                    asignacionesMesEntreSemana: monthWeek[user.id] || 0,
                    conteoGruposEseDia: gruposCubiertos,
                };
                if (evaluarBloqueoServidor(user.id, slotCtx, restrData, rt).bloqueado) continue;
            }

            // --- AI SCORING ---
            let score = 70; // Base score
            const reasons: string[] = [];
            const role = (m.rol_jerarquico || 'servidor').toLowerCase();
            const totalCount = serviceCountMap[user.id] || 0;
            const isVeteran = totalCount > 12;
            const isNew = totalCount < 3;

            // Factor A: Leadership
            if (positionRequiresLeadership) {
                if (['lider', 'líder', 'sublider', 'sublíder', 'encargado'].some(r => role.includes(r))) {
                    score += 40;
                    reasons.push('Perfil de liderazgo ideal');
                } else {
                    score -= 50; 
                }
            }

            // Factor B: Fairness (Time gap)
            const lastDate = lastServiceMap[user.id];
            if (!lastDate) {
                score += 30;
                reasons.push('Prioridad: No ha servido recientemente');
            } else {
                const daysSince = dayjs(date).diff(dayjs(lastDate), 'day');
                if (daysSince > 25) {
                    score += 20;
                    reasons.push('Buena disponibilidad (descanso suficiente)');
                } else if (daysSince < 7) {
                    score -= 40;
                    reasons.push('Riesgo de agotamiento (sirvió hace poco)');
                }
            }

            // Factor C: Experience Mixing
            if (teamComposition) {
                if (isNew && teamComposition.new === 0) {
                    score += 15;
                    reasons.push('Impulsa integración de nuevos servidores');
                } else if (isVeteran && teamComposition.veterans === 0) {
                    score += 15;
                    reasons.push('Aporta experiencia necesaria al equipo');
                }
            }

            candidates.push({
                ...user,
                score: Math.max(0, Math.min(100, score)),
                matchReasons: reasons,
                lastServedDate: lastDate,
                roles: [role],
                isVeteran,
                totalServedCount: totalCount
            });
        }

        return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
    }
};
