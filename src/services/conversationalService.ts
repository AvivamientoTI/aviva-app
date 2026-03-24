import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ATTENDANCE_STATES } from '../constants/attendance';

dayjs.locale('es');

export interface AiResponse {
    type: 'text' | 'chart' | 'list';
    message: string;
    data?: any; // Start strict, but keep flexible for list data
    chartType?: 'bar' | 'donut';
    chartData?: { name: string; value: number; color: string }[];
}

// Simple Levenshtein implementation for local fuzzy matching
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const findBestIntent = (query: string, intents: Record<string, string[]>): string | null => {
    const words = query.toLowerCase().split(' ');
    let bestIntent = null;
    let minDist = 3; // Tolerance threshold

    for (const [intent, keywords] of Object.entries(intents)) {
        for (const keyword of keywords) {
            // Check direct inclusion first (fast path)
            if (query.toLowerCase().includes(keyword)) return intent;

            // Check fuzzy
            for (const word of words) {
                if (word.length < 4) continue; // Skip short words
                const dist = levenshtein(word, keyword);
                if (dist < minDist && dist <= keyword.length / 2) { // Ensure relative closeness
                    bestIntent = intent;
                    minDist = dist;
                }
            }
        }
    }
    return bestIntent;
};

const parseDateContext = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('hoy')) return dayjs().format('YYYY-MM-DD');
    if (q.includes('ayer')) return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    if (q.includes('semana pasada')) return dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
    if (q.includes('mes pasado') || q.includes('ultimo mes')) return dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    if (q.includes('este mes')) return dayjs().startOf('month').format('YYYY-MM-DD');
    if (q.includes('trimestre')) return dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');

    // Default to 2 months ago if no specific context
    return dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD');
};

export const conversationalService = {
    async processQuery(query: string, departmentId: number): Promise<AiResponse> {
        const intents = {
            attendance_summary: ['asistencia', 'resumen', 'comportamiento', 'rendimiento'],
            top_servers: ['top', 'mejor', 'ranking', 'mas sirven', 'destacados'],
            absentees: ['falta', 'ausencia', 'faltaron', 'inasistencia', 'fallando'],
            upcoming_events: ['proximo', 'evento', 'agenda', 'futuro', 'servicio'],
            specific_user: ['como va', 'informe de', 'datos de', 'status de', 'perfil de'],
            discipline_alerts: ['alerta', 'disciplina', 'faltan mucho', 'amonestar', 'problema']
        };

        const intent = findBestIntent(query, intents);
        const startDate = parseDateContext(query);

        console.log(`🧠 AI Intent: ${intent} | DateContext: ${startDate}`);

        if (intent === 'attendance_summary') return await this.getAttendanceSummary(departmentId, startDate);
        if (intent === 'top_servers') return await this.getTopServers(departmentId, startDate);
        if (intent === 'absentees') return await this.getAbsentees(departmentId, startDate);
        if (intent === 'upcoming_events') return await this.getUpcomingEvents(departmentId);
        if (intent === 'discipline_alerts') return await this.getDisciplineAlerts(departmentId);

        // Special Handling for Specific User Query
        // Try to extract a name if the intent matches OR if we see capitalized words that look like names
        if (intent === 'specific_user' || !intent) {
            // Naive NER (Named Entity Recognition): Look for capitalized words not at start of sentence?
            // Or just check if any remaining words match a user in DB.
            const potentialName = query.split(' ')
                .filter(w => w.length > 3 && !['como', 'resumen', 'dame', 'lista', 'para'].includes(w.toLowerCase()))
                .join(' ');

            if (potentialName.length > 2) {
                const userResponse = await this.getSpecificUserStats(potentialName, departmentId);
                if (userResponse) return userResponse;
            }
        }

        return {
            type: 'text',
            message: 'No estoy seguro de qué necesitas. Prueba: "Resumen de asistencia", "Top servidores" o "¿Cómo va [Nombre]?"'
        };
    },

    // --- HANDLERS ---

    async getAttendanceSummary(deptId: number, startDate: string): Promise<AiResponse> {
        const { data } = await supabase
            .from('asistencias')
            .select('estado, configuracion_dia!inner(fecha, roles_cabecera!inner(departamento_id))')
            .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
            .gte('configuracion_dia.fecha', startDate);

        if (!data || data.length === 0) {
            return { type: 'text', message: `No encontré datos de asistencia desde ${dayjs(startDate).format('DD MMM')}.` };
        }

        const counts = { asistio: 0, falta: 0, justificado: 0 };
        data.forEach((r) => {
            if (r.estado === ATTENDANCE_STATES.ASISTIO) counts.asistio++;
            else if (r.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION) counts.falta++;
            else counts.justificado++;
        });

        return {
            type: 'chart',
            message: `Resumen de asistencia desde ${dayjs(startDate).format('MMMM')}:`,
            chartType: 'donut',
            chartData: [
                { name: 'Asistió', value: counts.asistio, color: 'teal.6' },
                { name: 'Falta', value: counts.falta, color: 'red.6' },
                { name: 'Justif.', value: counts.justificado, color: 'yellow.6' }
            ]
        };
    },

    async getTopServers(deptId: number, startDate: string): Promise<AiResponse> {
        const { data: rawData } = await supabase
            .from('asignaciones')
            .select(`
                usuario:usuarios(nombre, apellido),
                configuracion_dia!inner(
                    roles_cabecera!inner(departamento_id)
                )
            `)
            .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
            .gte('configuracion_dia.fecha', startDate);

        if (!rawData || rawData.length === 0) return { type: 'text', message: 'No hay suficientes datos en este periodo.' };

        const counter: Record<string, number> = {};

        rawData.forEach((a) => {
            const user = a.usuario as unknown as { nombre: string; apellido: string };
            if (user) {
                const name = `${user.nombre} ${user.apellido}`;
                counter[name] = (counter[name] || 0) + 1;
            }
        });

        const sorted = Object.entries(counter)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                value: count,
                color: 'blue.6'
            }));

        return {
            type: 'chart',
            message: `Líderes de servicio desde ${dayjs(startDate).format('MMMM')}:`,
            chartType: 'bar',
            chartData: sorted
        };
    },

    async getAbsentees(deptId: number, startDate: string): Promise<AiResponse> {
        const { data } = await supabase
            .from('asistencias')
            .select(`
                estado,
                usuario:usuarios(nombre, apellido),
                configuracion_dia!inner(
                    fecha,
                    roles_cabecera!inner(departamento_id)
                )
            `)
            .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
            .eq('estado', ATTENDANCE_STATES.SIN_JUSTIFICACION)
            .gte('configuracion_dia.fecha', startDate)
            .order('configuracion_dia(fecha)', { ascending: false })
            .limit(5);

        if (!data || data.length === 0) {
            return { type: 'text', message: `¡Excelente! No hay faltas sin aviso registradas desde ${dayjs(startDate).format('DD MMM')}.` };
        }

        const list = data.map((d: any) => ({
            title: `${d.usuario.nombre} ${d.usuario.apellido}`,
            desc: `Faltó el ${dayjs(d.configuracion_dia.fecha).format('DD MMM')}`,
            icon: 'alert'
        }));

        return {
            type: 'list',
            message: 'Últimas ausencias injustificadas:',
            data: list
        };
    },

    async getUpcomingEvents(deptId: number): Promise<AiResponse> {
        const { data } = await supabase
            .from('configuracion_dia')
            .select(`
                fecha, 
                tipo_servicio, 
                color_uniforme,
                roles_cabecera!inner(departamento_id)
            `)
            .eq('roles_cabecera.departamento_id', deptId)
            .gte('fecha', dayjs().format('YYYY-MM-DD'))
            .order('fecha', { ascending: true })
            .limit(3);

        if (!data || data.length === 0) return { type: 'text', message: 'No hay servicios programados próximamente.' };

        const list = data.map((d: any) => ({
            title: dayjs(d.fecha).format('dddd D [de] MMMM'),
            desc: `${d.tipo_servicio} - ${d.color_uniforme}`,
            icon: 'calendar'
        }));

        return {
            type: 'list',
            message: 'Próximos servicios en calendario:',
            data: list
        };
    },

    async getSpecificUserStats(nameFragment: string, deptId: number): Promise<AiResponse | null> {
        // Use the new postgres RPC with pg_trgm for fuzzy searching
        const { data: users, error } = await supabase
            .rpc('search_users_fuzzy', {
                p_dept_id: deptId,
                p_search_query: nameFragment
            });

        if (error || !users || users.length === 0) return null;
        
        const bestMatch = users[0];

        // Get stats for this user
        // Total stats query
        const { data: statsData } = await supabase
            .from('asistencias')
            .select('estado')
            .eq('usuario_id', bestMatch.id);

        let asistio = 0, falto = 0;
        statsData?.forEach(s => {
            if (s.estado === ATTENDANCE_STATES.ASISTIO) asistio++;
            if (s.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION) falto++;
        });

        return {
            type: 'text',
            message: `Informe de **${bestMatch.nombre} ${bestMatch.apellido}**:
            \n• **Asistencias totales**: ${asistio}
            \n• **Faltas (Global)**: ${falto}
            \n• **Calificación sugerida**: ${falto === 0 ? '⭐⭐⭐⭐⭐' : falto < 3 ? '⭐⭐⭐' : '⭐'}`
        };
    },

    async getDisciplineAlerts(deptId: number): Promise<AiResponse> {
        // Find users with 3 or more UNJUSTIFIED absences in the last 60 days
        const sixtyDaysAgo = dayjs().subtract(60, 'day').format('YYYY-MM-DD');

        const { data } = await supabase
            .from('asistencias')
            .select(`
                usuario:usuarios(nombre, apellido),
                configuracion_dia!inner(fecha, roles_cabecera!inner(departamento_id))
            `)
            .eq('estado', ATTENDANCE_STATES.SIN_JUSTIFICACION)
            .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
            .gte('configuracion_dia.fecha', sixtyDaysAgo);

        if (!data || data.length === 0) {
            return {
                type: 'text',
                message: '✅ **Todo en orden**. No se detectan servidores con patrones de inasistencia crítica en los últimos 60 días.'
            };
        }

        const counts: Record<string, number> = {};
        data.forEach((r: any) => {
            const name = `${r.usuario.nombre} ${r.usuario.apellido}`;
            counts[name] = (counts[name] || 0) + 1;
        });

        const atRisk = Object.entries(counts)
            .filter(([, count]) => count >= 3)
            .map(([name, count]) => ({
                title: name,
                desc: `${count} faltas injustificadas en los últimos 2 meses.`,
                icon: 'alert'
            }));

        if (atRisk.length === 0) {
            return {
                type: 'text',
                message: 'He revisado los datos y **ningún servidor** ha superado el límite de 3 faltas. ¡El equipo va bien!'
            };
        }

        return {
            type: 'list',
            message: '⚠️ **Alerta de Disciplina**: Los siguientes servidores requieren supervisión por inasistencias reiteradas:',
            data: atRisk
        };
    }
};
