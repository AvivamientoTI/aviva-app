import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);
import type { StatsData } from '../types';
import type { Database } from '../types/database.types';

type AttendanceWithRelations = Database['public']['Tables']['asistencias']['Row'] & {
  configuracion_dia: {
    fecha: string;
    roles_cabecera: {
      departamento_id: number;
    }[];
  };
};

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
   * Obtiene el conteo total de próximos servicios para un usuario
   */
  async fetchUpcomingCount(userId: number): Promise<number> {
    const { count, error } = await supabase
      .from('asignaciones')
      .select('id, configuracion_dia!inner(fecha)', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .gte('configuracion_dia.fecha', dayjs().format('YYYY-MM-DD'));

    if (error) throw error;
    return count || 0;
  },

  /**
   * Obtiene el rol mensual completo de un usuario específico
   */
  async fetchMonthlyUserRole(userId: number, month: number, year: number): Promise<any[]> {
    const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');

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
      .gte('configuracion_dia.fecha', startOfMonth)
      .lte('configuracion_dia.fecha', endOfMonth)
      .order('configuracion_dia(fecha)', { ascending: true });

    if (error) throw error;
    return data as any[] || [];
  },

  async fetchAttendanceStats(deptId: number, range: 'YTD' | number = 2): Promise<StatsData> {
    const startDate = range === 'YTD'
      ? dayjs().startOf('year').format('YYYY-MM-DD')
      : dayjs().subtract(range, 'month').startOf('month').format('YYYY-MM-DD');

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
    return this.processAttendanceData(data || []);
  },

  async fetchUserAttendanceStats(userId: number, deptId: number, range: 'YTD' | number = 2): Promise<StatsData> {
    const startDate = range === 'YTD'
      ? dayjs().startOf('year').format('YYYY-MM-DD')
      : dayjs().subtract(range, 'month').startOf('month').format('YYYY-MM-DD');

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
      .eq('usuario_id', userId)
      .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
      .gte('configuracion_dia.fecha', startDate);

    if (error) throw error;
    return this.processAttendanceData(data || []);
  },

  processAttendanceData(data: any[]): StatsData {
    const rawData = data as unknown as AttendanceWithRelations[];
    
    // Inicializar sumario
    const summary = {
      total: rawData.length,
      asistio: 0,
      faltoConAviso: 0,
      faltoSinAviso: 0,
    };
    
    const byMonth: Record<string, MonthlyStat> = {};
    const lastMonthStr = dayjs().subtract(1, 'month').format('MMM YYYY');

    for (let i = 0; i < rawData.length; i++) {
        const r = rawData[i];
        const status = r.estado;
        
        // Actualizar sumario
        if (status === 'Asistió') summary.asistio++;
        else if (status === 'Faltó con Aviso') summary.faltoConAviso++;
        else if (status === 'Faltó sin Aviso') summary.faltoSinAviso++;
        
        // Actualizar por mes
        const date = dayjs(r.configuracion_dia.fecha);
        const monthKey = date.format('MMM YYYY');
        
        if (!byMonth[monthKey]) {
            byMonth[monthKey] = { month: monthKey, asistio: 0, faltas: 0 };
        }
        
        if (status === 'Asistió') {
            byMonth[monthKey].asistio++;
        } else {
            byMonth[monthKey].faltas++;
        }
    }

    const stats: StatsData = {
      summary,
      byMonth
    };

    (stats as any).lastMonthSummary = byMonth[lastMonthStr] || { month: lastMonthStr, asistio: 0, faltas: 0 };

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

    (data as unknown as AttendanceWithRelations[]).forEach((r) => {
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

    (data as unknown as AttendanceWithRelations[])?.forEach((r) => {
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
