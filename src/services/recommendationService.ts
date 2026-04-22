import { supabase } from './supabaseClient';
import { suspensionService } from './suspensionService';
import dayjs from 'dayjs';
import type { PublicUser } from '../types';

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
        } = {}
    ): Promise<ScoredCandidate[]> {
        const { positionRequiresGender = null, positionRequiresLeadership = false, teamComposition = null } = options;

        // 1. Fetch department members
        const { data: members, error: membersError } = await supabase
            .from('membresias')
            .select(`
                usuario_id, 
                rol_jerarquico, 
                usuario:usuarios (id, nombre, apellido, genero, activo)
            `)
            .eq('departamento_id', departmentId) as { data: MemberQueryResponse[] | null; error: any };

        if (membersError) throw membersError;
        if (!members) return [];

        // 2. Fetch active suspensions & busy users
        const [allSuspensions, busyAssignments] = await Promise.all([
            suspensionService.getAllSuspensions(),
            supabase
                .from('asignaciones')
                .select('usuario_id, configuracion_dia!inner(fecha)')
                .eq('configuracion_dia.fecha', date)
        ]);

        const suspendedUserIds = new Set(
            allSuspensions
                .filter(s => s.fecha_inicio <= date && (!s.fecha_fin || s.fecha_fin >= date))
                .map(s => s.usuario_id)
        );
        const busyUserIds = new Set(busyAssignments.data?.map(a => a.usuario_id) || []);

        // 3. Experience & History Analysis (Last 6 months)
        const sixMonthsAgo = dayjs().subtract(6, 'months').format('YYYY-MM-DD');
        const { data: history } = await supabase
            .from('asignaciones')
            .select('usuario_id, configuracion_dia!inner(fecha)')
            .gte('configuracion_dia.fecha', sixMonthsAgo)
            .order('configuracion_dia(fecha)', { ascending: false }) as { data: { usuario_id: number; configuracion_dia: { fecha: string } }[] | null };

        const lastServiceMap: Record<number, string> = {};
        const serviceCountMap: Record<number, number> = {};
        
        history?.forEach(h => {
            const uid = h.usuario_id;
            if (!lastServiceMap[uid]) lastServiceMap[uid] = h.configuracion_dia.fecha;
            serviceCountMap[uid] = (serviceCountMap[uid] || 0) + 1;
        });

        // 4. Scoring Logic
        const candidates: ScoredCandidate[] = [];

        for (const m of members) {
            const user = (Array.isArray(m.usuario) ? m.usuario[0] : m.usuario);
            if (!user || user.activo === false) continue;

            // --- HARD FILTERS ---
            if (suspendedUserIds.has(user.id)) continue; 
            if (busyUserIds.has(user.id)) continue; 
            if (positionRequiresGender && user.genero !== positionRequiresGender) continue; 

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
