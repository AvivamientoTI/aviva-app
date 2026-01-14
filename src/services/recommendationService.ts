import { supabase } from './supabaseClient';
import { suspensionService } from './suspensionService';
import dayjs from 'dayjs';
import type { PublicUser } from '../types';

export interface ScoredCandidate extends PublicUser {
    score: number;
    matchReasons: string[];
    lastServedDate?: string;
    roles: string[];
}

export const recommendationService = {
    async getRecommendations(
        date: string,
        departmentId: number,
        positionRequiresGender: 'M' | 'F' | null = null,
        positionRequiresLeadership: boolean = false
    ): Promise<ScoredCandidate[]> {
        console.log(`🤖 AI Recommendation Engine: Finding candidates for Dept ${departmentId} on ${date}`);

        // 1. Fetch all department members with their roles
        const { data: members, error: membersError } = await supabase
            .from('membresias')
            .select(`
                usuario_id, 
                rol_jerarquico, 
                usuario:usuarios (id, nombre, apellido, genero)
            `)
            .eq('departamento_id', departmentId);

        if (membersError) throw membersError;
        if (!members) return [];

        // 2. Fetch active suspensions for this date
        const allSuspensions = await suspensionService.getAllSuspensions();
        const suspendedUserIds = new Set(
            allSuspensions
                .filter(s => s.fecha_inicio <= date && s.fecha_fin >= date)
                .map(s => s.usuario_id)
        );

        // 3. Fetch users already assigned on this date (in ANY department)
        const { data: busyAssignments, error: busyError } = await supabase
            .from('asignaciones')
            .select('usuario_id, configuracion_dia!inner(fecha)')
            .eq('configuracion_dia.fecha', date);

        if (busyError) throw busyError;
        const busyUserIds = new Set(busyAssignments?.map(a => a.usuario_id));

        // 4. Fetch last assignment date for each user (for fairness scoring)
        // Optimization: Look back 3 months
        const threeMonthsAgo = dayjs().subtract(3, 'months').format('YYYY-MM-DD');
        const { data: history } = await supabase
            .from('asignaciones')
            .select('usuario_id, configuracion_dia!inner(fecha)')
            .gte('configuracion_dia.fecha', threeMonthsAgo)
            .order('configuracion_dia(fecha)', { ascending: false });

        const lastServiceMap: Record<number, string> = {};
        history?.forEach((h: any) => {
            if (!lastServiceMap[h.usuario_id]) {
                lastServiceMap[h.usuario_id] = h.configuracion_dia.fecha;
            }
        });

        // 5. Filter & Score
        const candidates: ScoredCandidate[] = [];

        for (const m of members) {
            const user = m.usuario;
            if (!user) continue;

            // --- HARD FILTERS ---
            if (suspendedUserIds.has(user.id)) continue; // Suspended
            if (busyUserIds.has(user.id)) continue; // Already working today
            if (positionRequiresGender && user.genero !== positionRequiresGender) continue; // Wrong gender

            // --- SCORING ---
            let score = 100;
            const reasons: string[] = [];
            const role = m.rol_jerarquico?.toLowerCase() || 'servidor';

            // Factor A: Leadership for Leadership positions
            if (positionRequiresLeadership) {
                if (['lider', 'líder', 'sublider', 'sublíder', 'encargado'].includes(role)) {
                    score += 30;
                    reasons.push('Tiene rango de liderazgo');
                } else {
                    score -= 50; // Penalty for non-leaders in leader slots
                }
            } else {
                // If normal position, slight preference for non-leaders to save leaders for their slots? 
                // Or maybe neutral. Let's keep it neutral but boost regular servers slightly for fairness
            }

            // Factor B: Fairness (Time since last service)
            const lastDate = lastServiceMap[user.id];
            if (!lastDate) {
                score += 25; // Hasn't served in 3 months! High priority.
                reasons.push('No ha servido recientemente');
            } else {
                const daysSince = dayjs(date).diff(dayjs(lastDate), 'day');
                if (daysSince > 30) {
                    score += 15;
                    reasons.push(`Último servicio hace ${Math.floor(daysSince / 7)} semanas`);
                } else if (daysSince < 7) {
                    score -= 30; // Burnout protection
                    reasons.push('Sirvió hace menos de una semana');
                }
            }

            // Factor C: Role Bonus
            // Give a tiny bonus to leaders just because they are reliable usually
            if (['lider', 'líder'].includes(role)) {
                score += 5;
            }

            // Construct Candidate
            candidates.push({
                ...user,
                score: Math.max(0, Math.min(100, score)), // Clamp 0-100 (or allow >100 for super matches)
                matchReasons: reasons,
                lastServedDate: lastDate,
                roles: [role]
            });
        }

        // Sort by Score Descending
        return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
    }
};
