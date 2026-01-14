import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);
import type { StatsData } from '../types';

export const analyticsService = {
  /**
   * Obtiene los próximos servicios para un usuario específico
   */
  async fetchUpcomingServices(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('asignaciones')
      .select(`
        id,
        configuracion_dia!inner (
          fecha,
          tipo_servicio,
          color_uniforme
        ),
        posicion:posiciones_departamento (
          nombre,
          departamento:departamentos ( nombre )
        )
      `)
      .eq('usuario_id', userId)
      .gte('configuracion_dia.fecha', dayjs().format('YYYY-MM-DD'))
      .order('configuracion_dia(fecha)', { ascending: true })
      .limit(5);

    if (error) throw error;
    return data as any[] || [];
  },

  /**
   * Obtiene estadísticas de asistencia para un departamento en un rango de fechas
   */
  async fetchAttendanceStats(deptId: number, months: number = 2): Promise<StatsData> {
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

    const rawData = data as any[] || [];

    // Procesar datos para gráficos
    const stats: StatsData = {
      summary: {
        total: rawData.length,
        asistio: rawData.filter(r => r.estado === 'Asistió').length,
        faltoConAviso: rawData.filter(r => r.estado === 'Faltó con Aviso').length,
        faltoSinAviso: rawData.filter(r => r.estado === 'Faltó sin Aviso').length,
      },
      byMonth: {}
    };

    rawData.forEach(r => {
      const month = dayjs(r.configuracion_dia.fecha).format('MMM YYYY');
      if (!stats.byMonth[month]) {
        stats.byMonth[month] = { month, asistio: 0, faltas: 0 };
      }
      if (r.estado === 'Asistió') stats.byMonth[month].asistio++;
      else stats.byMonth[month].faltas++;
    });

    return stats;
  },

  /**
   * Obtiene estadísticas semanales (últimas 12 semanas) para gráficos de tendencia
   */
  async fetchWeeklyStats(deptId: number): Promise<any[]> {
    const startDate = dayjs().subtract(12, 'weeks').startOf('week').format('YYYY-MM-DD');

    // 1. Obtener todas las asistencias en el rango
    const { data } = await supabase
      .from('asistencias')
      .select(`
            estado,
            configuracion_dia!inner (
                fecha,
                roles_cabecera!inner ( departamento_id )
            )
        `)
      .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
      .gte('configuracion_dia.fecha', startDate)
      .order('configuracion_dia(fecha)', { ascending: true });

    if (!data) return [];

    // 2. Agrupar por semana
    const weeklyData: Record<string, { weekStart: string, present: number, absent: number, total: number }> = {};

    data.forEach((r: any) => {
      const date = dayjs(r.configuracion_dia.fecha);
      const weekLabel = `Semana ${date.week()} (${date.format('DD/MM')})`;

      if (!weeklyData[weekLabel]) {
        weeklyData[weekLabel] = { weekStart: weekLabel, present: 0, absent: 0, total: 0 };
      }

      weeklyData[weekLabel].total++;
      if (r.estado === 'Asistió') weeklyData[weekLabel].present++;
      else weeklyData[weekLabel].absent++;
    });

    return Object.values(weeklyData).map(w => ({
      ...w,
      rate: w.total > 0 ? Math.round((w.present / w.total) * 100) : 0
    }));
  },

  /**
   * Obtiene estadísticas anuales comparativas y heatmap
   */
  async fetchAnnualStats(deptId: number): Promise<any> {
    const thisYearStart = dayjs().startOf('year').format('YYYY-MM-DD');

    // Stats del año actual
    const { data } = await supabase
      .from('asistencias')
      .select(`
            estado,
            configuracion_dia!inner ( fecha, roles_cabecera!inner(departamento_id) )
        `)
      .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
      .gte('configuracion_dia.fecha', thisYearStart);

    const heatmap: Record<string, number> = {};
    let totalServices = 0;

    data?.forEach((r: any) => {
      const date = r.configuracion_dia.fecha; // YYYY-MM-DD
      if (r.estado === 'Asistió') {
        heatmap[date] = (heatmap[date] || 0) + 1;
        totalServices++;
      }
    });

    // Transformar para visualización de Heatmap (Calendar)
    const heatmapData = Object.entries(heatmap).map(([date, count]) => ({ date, count }));

    return {
      year: dayjs().year(),
      totalServices,
      uniqueDates: Object.keys(heatmap).length,
      heatmapData
    };
  }
};
