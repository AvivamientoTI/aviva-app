import { supabase } from './supabaseClient';
import dayjs from 'dayjs';

export const analyticsService = {
    /**
     * Obtiene los próximos servicios para un usuario específico
     */
    async fetchUpcomingServices(userId) {
        const { data, error } = await supabase
            .from('asignaciones')
            .select(`
        id,
        configuracion_dia!inner (
          fecha,
          tipo_servicio,
          color_uniforme
        ),
        posicion:posiciones_departamento (nombre)
      `)
            .eq('usuario_id', userId)
            .gte('configuracion_dia.fecha', dayjs().format('YYYY-MM-DD'))
            .order('configuracion_dia(fecha)', { ascending: true })
            .limit(5);

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene estadísticas de asistencia para un departamento en un rango de fechas
     */
    async fetchAttendanceStats(deptId, months = 1) {
        const startDate = dayjs().subtract(months, 'month').startOf('month').format('YYYY-MM-DD');

        const { data, error } = await supabase
            .from('asistencias')
            .select(`
        estado,
        configuracion_dia!inner (
          fecha,
          roles_cabecera!inner (
            departamento_id
          )
        )
      `)
            .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
            .gte('configuracion_dia.fecha', startDate);

        if (error) throw error;

        // Procesar datos para gráficos
        const stats = {
            summary: {
                total: data.length,
                asistio: data.filter(r => r.estado === 'Asistió').length,
                faltoConAviso: data.filter(r => r.estado === 'Faltó con Aviso').length,
                faltoSinAviso: data.filter(r => r.estado === 'Faltó sin Aviso').length,
            },
            byMonth: {}
        };

        data.forEach(r => {
            const month = dayjs(r.configuracion_dia.fecha).format('MMM YYYY');
            if (!stats.byMonth[month]) {
                stats.byMonth[month] = { month, asistio: 0, faltas: 0 };
            }
            if (r.estado === 'Asistió') stats.byMonth[month].asistio++;
            else stats.byMonth[month].faltas++;
        });

        return stats;
    }
};
