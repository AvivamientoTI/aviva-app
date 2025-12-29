import { supabase } from './supabaseClient';
import dayjs from 'dayjs';

export interface MonthlyStats {
    totalServices: number;
    teamAttendanceAvg: number;
    totalMembers: number;
    activeMembers: number;
}

export interface MemberImpact {
    usuario_id: number;
    nombre: string;
    apellido: string;
    asistencias: number;
    porcentaje: number;
    tendencia: 'upswing' | 'steady' | 'downswing';
}

export interface ServiceDetail {
    id: number;
    fecha: string;
    tipo_servicio: string;
    asistentes: number;
    ausentes: number;
}

export const impactReportService = {
    /**
     * Obtiene los datos agregados para el reporte mensual
     */
    async getMonthlyData(deptId: number, month: number, year: number) {
        // 1. Obtener días de servicio del mes
        const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
        const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');

        const { data: services, error: servicesError } = await supabase
            .from('configuracion_dia')
            .select(`
                id,
                fecha,
                tipo_servicio,
                roles_cabecera!inner (
                    departamento_id
                )
            `)
            .eq('roles_cabecera.departamento_id', deptId)
            .gte('fecha', startOfMonth)
            .lte('fecha', endOfMonth)
            .order('fecha', { ascending: true });

        if (servicesError) throw servicesError;

        if (!services || services.length === 0) {
            return { stats: null, members: [], services: [] };
        }

        const serviceIds = services.map(s => s.id);

        // 2. Obtener asistencias de esos servicios
        const { data: asistencias, error: attendanceError } = await supabase
            .from('asistencias')
            .select(`
                usuario_id,
                estado,
                configuracion_dia_id,
                usuario:usuarios (nombre, apellido)
            `)
            .in('configuracion_dia_id', serviceIds);

        if (attendanceError) throw attendanceError;

        // 3. Obtener todos los miembros del departamento para calcular el 0% de los que no asistieron nunca
        const { data: membership, error: membershipError } = await supabase
            .from('membresias')
            .select(`
                usuario_id,
                usuario:usuarios (nombre, apellido)
            `)
            .eq('departamento_id', deptId);

        if (membershipError) throw membershipError;

        // 4. Procesar estadísticas
        const totalServices = services.length;
        const memberStats = new Map<number, { nombre: string; apellido: string; asistio: number }>();

        // Inicializar con todos los miembros
        membership?.forEach(m => {
            memberStats.set(m.usuario_id, {
                nombre: m.usuario.nombre,
                apellido: m.usuario.apellido,
                asistio: 0
            });
        });

        const serviceBreakdown: ServiceDetail[] = services.map(s => ({
            id: s.id,
            fecha: s.fecha,
            tipo_servicio: s.tipo_servicio,
            asistentes: 0,
            ausentes: 0
        }));

        asistencias?.forEach(a => {
            if (a.estado === 'Asistió') {
                const ms = memberStats.get(a.usuario_id);
                if (ms) ms.asistio++;

                const sb = serviceBreakdown.find(s => s.id === a.configuracion_dia_id);
                if (sb) sb.asistentes++;
            } else {
                const sb = serviceBreakdown.find(s => s.id === a.configuracion_dia_id);
                if (sb) sb.ausentes++;
            }
        });

        const members: MemberImpact[] = Array.from(memberStats.entries()).map(([id, stats]) => ({
            usuario_id: id,
            nombre: stats.nombre,
            apellido: stats.apellido,
            asistencias: stats.asistio,
            porcentaje: Math.round((stats.asistio / totalServices) * 100),
            tendencia: 'steady' // Simplicado por ahora
        })).sort((a, b) => b.porcentaje - a.porcentaje);

        const totalAttendancePoints = members.reduce((acc, m) => acc + m.porcentaje, 0);
        const teamAttendanceAvg = members.length > 0 ? Math.round(totalAttendancePoints / members.length) : 0;

        const stats: MonthlyStats = {
            totalServices,
            teamAttendanceAvg,
            totalMembers: members.length,
            activeMembers: members.filter(m => m.porcentaje > 0).length
        };

        return { stats, members, services: serviceBreakdown };
    }
};
