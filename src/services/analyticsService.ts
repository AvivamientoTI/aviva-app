import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);
import type { StatsData, MonthlyStat, ChurnRiskUser, GlobalDeptHealth, DemographicData, PunctualityStat } from '../types';
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
    const { data: trendData, error } = await supabase
      .rpc('get_weekly_attendance_trend', { p_dept_id: deptId, p_weeks: 12 });

    if (error) throw error;
    if (!trendData) return [];

    return trendData.map((w: any) => {
      const present = Number(w.present);
      const total = Number(w.total);
      const date = dayjs(w.week_start_date);
      return {
        weekStart: `Semana ${date.week()} (${date.format('DD/MM')})`,
        present,
        absent: Number(w.absent),
        total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  },
  /**
   * Obtiene estadísticas anuales para el heatmap
   */
  async fetchAnnualStats(deptId: number): Promise<any> {
    const startOfYear = dayjs().startOf('year').format('YYYY-MM-DD');

    const { data: heatmapData, error } = await supabase
      .rpc('get_annual_attendance_heatmap', { 
        p_dept_id: deptId, 
        p_start_date: startOfYear 
      });

    if (error) throw error;

    let totalServices = 0;
    const formattedHeatmap = (heatmapData || []).map((r: any) => {
      const count = Number(r.asistencias);
      totalServices += count;
      return {
        date: r.fecha,
        count
      };
    });

    return {
      year: dayjs().year(),
      totalServices,
      uniqueDates: heatmapData?.length || 0,
      heatmapData: formattedHeatmap
    };
  },

  /**
   * Detecta servidores con riesgo de baja (consecutivas faltas en las últimas semanas)
   */
  async fetchChurnRisk(deptId: number): Promise<ChurnRiskUser[]> {
    const { data: riskData, error } = await supabase
      .rpc('get_churn_risk', { p_dept_id: deptId, p_weeks: 4 });

    if (error) throw error;
    if (!riskData) return [];

    return riskData.map((u: any) => {
      const asistencias = Number(u.asistencias);
      const faltas = Number(u.faltas);
      const total = asistencias + faltas;
      const riskScore = total > 0 ? (faltas / total) * 100 : 0;
      
      return {
        id: Number(u.id),
        nombre: u.nombre,
        apellido: u.apellido,
        asistencias,
        faltas,
        riskScore: Math.round(riskScore)
      };
    })
    .filter((u: any) => u.riskScore >= 50 && (u.asistencias + u.faltas) >= 2)
    .sort((a: any, b: any) => b.riskScore - a.riskScore);
  },

  /**
   * Obtiene la salud global de todos los departamentos
   */
  async fetchGlobalStats(): Promise<GlobalDeptHealth[]> {
    const last3Months = dayjs().subtract(3, 'months').format('YYYY-MM-DD');

    const { data: depts } = await supabase.from('departamentos').select('id, nombre, color_hex');
    const { data: statsMap, error } = await supabase
        .rpc('get_global_attendance_health', { p_start_date: last3Months });

    if (!depts) return [];
    if (error) throw error;

    const statsByDept = new Map((statsMap as any[])?.map(s => [s.departamento_id, s]));

    return depts.map(d => {
      const stats = statsByDept.get(d.id) || { total: 0, present: 0, active_servers: 0 };
      const total = Number(stats.total) || 0;
      const present = Number(stats.present) || 0;
      return {
        id: d.id,
        nombre: d.nombre,
        totalServers: Number(stats.active_servers) || 0,
        attendanceRate: total > 0 
          ? Math.round((present / total) * 100) 
          : 0,
        color: d.color_hex || '#3b82f6'
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  },

  /**
   * Obtiene tendencias de puntualidad
   */
  async fetchPunctualityTrends(deptId: number): Promise<PunctualityStat[]> {
    const { data: attendance } = await supabase
      .from('asistencias')
      .select(`
        hora_registro,
        configuracion_dia!inner(roles_cabecera!inner(departamento_id))
      `)
      .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
      .eq('estado', 'Asistió')
      .not('hora_registro', 'is', null)
      .order('hora_registro', { ascending: false })
      .limit(100);

    const stats = {
      'Temprano': 0,
      'A tiempo': 0,
      'Tarde': 0
    };

    attendance?.forEach((r: any) => {
      if (!r.hora_registro) return;
      
      const hour = dayjs(r.hora_registro).hour();
      const minute = dayjs(r.hora_registro).minute();
      
      // Lógica simplificada: Antes de las 08:50 es temprano, hasta 09:05 a tiempo, luego tarde.
      // En una app real esto dependería de la hora del servicio configurada.
      if (hour < 8 || (hour === 8 && minute < 50)) stats['Temprano']++;
      else if (hour === 8 || (hour === 9 && minute <= 5)) stats['A tiempo']++;
      else stats['Tarde']++;
    });

    return Object.entries(stats).map(([label, count]) => ({ label, count }));
  },

  /**
   * Obtiene la distribución demográfica de un departamento o global
   */
  async fetchDemographicDist(deptId?: number): Promise<DemographicData> {
    let query = supabase.from('usuarios').select('genero, fecha_nacimiento, membresias(departamento_id)');
    
    if (deptId) {
      // Nota: Si se requiere filtrar por depto, idealmente usar una join o el RPC si es complejo
      // Por simplicidad aquí filtramos todos y luego procesamos o usamos la membresía
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats: DemographicData = {
      gender: { male: 0, female: 0 },
      ageRanges: { '13-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 }
    };

    data.forEach((u: any) => {
      // Filtrar por depto si se pasó
      if (deptId && !u.membresias?.some((m: any) => m.departamento_id === deptId)) return;

      if (u.genero === 'M') stats.gender.male++;
      else if (u.genero === 'F') stats.gender.female++;

      if (u.fecha_nacimiento) {
        const age = dayjs().diff(dayjs(u.fecha_nacimiento), 'year');
        if (age < 18) stats.ageRanges['13-17']++;
        else if (age <= 25) stats.ageRanges['18-25']++;
        else if (age <= 35) stats.ageRanges['26-35']++;
        else if (age <= 50) stats.ageRanges['36-50']++;
        else stats.ageRanges['51+']++;
      }
    });

    return stats;
  }
};
