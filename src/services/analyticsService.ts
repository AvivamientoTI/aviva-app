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

  async fetchWeeklyStats(deptId: number): Promise<any[]> {
    const startDate = dayjs().subtract(12, 'week').startOf('week').format('YYYY-MM-DD');

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

    const byWeek: Record<string, { weekStart: string; present: number; absent: number; total: number }> = {};

    for (const r of (data || []) as any[]) {
      const date = dayjs((r.configuracion_dia as any).fecha);
      const weekKey = date.startOf('week').format('YYYY-MM-DD');
      if (!byWeek[weekKey]) {
        byWeek[weekKey] = {
          weekStart: `Sem ${date.week()} (${date.startOf('week').format('DD/MM')})`,
          present: 0,
          absent: 0,
          total: 0
        };
      }
      byWeek[weekKey].total++;
      if (r.estado === 'Asistió') byWeek[weekKey].present++;
      else byWeek[weekKey].absent++;
    }

    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0 }));
  },

  async fetchAnnualStats(deptId: number): Promise<any> {
    const startOfYear = dayjs().startOf('year').format('YYYY-MM-DD');

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
      .gte('configuracion_dia.fecha', startOfYear);

    if (error) throw error;

    const byDate: Record<string, number> = {};
    for (const r of (data || []) as any[]) {
      const fecha = (r.configuracion_dia as any).fecha as string;
      if (r.estado === 'Asistió') {
        byDate[fecha] = (byDate[fecha] || 0) + 1;
      }
    }

    const heatmapData = Object.entries(byDate).map(([date, count]) => ({ date, count }));

    return {
      year: dayjs().year(),
      totalServices: (data || []).filter((r: any) => r.estado === 'Asistió').length,
      uniqueDates: heatmapData.length,
      heatmapData
    };
  },

  async fetchChurnRisk(deptId: number): Promise<ChurnRiskUser[]> {
    const startDate = dayjs().subtract(4, 'week').format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('asistencias')
      .select(`
        usuario_id,
        estado,
        usuario:usuarios (nombre, apellido),
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

    const byUser: Record<string, any> = {};
    for (const r of (data || []) as any[]) {
      const uid = String(r.usuario_id);
      if (!byUser[uid]) {
        byUser[uid] = {
          id: r.usuario_id,
          nombre: (r.usuario as any)?.nombre || '',
          apellido: (r.usuario as any)?.apellido || '',
          asistencias: 0,
          faltas: 0
        };
      }
      if (r.estado === 'Asistió') byUser[uid].asistencias++;
      else byUser[uid].faltas++;
    }

    return Object.values(byUser)
      .map(u => {
        const total = u.asistencias + u.faltas;
        return { ...u, riskScore: total > 0 ? Math.round((u.faltas / total) * 100) : 0 };
      })
      .filter(u => u.riskScore >= 50 && (u.asistencias + u.faltas) >= 2)
      .sort((a, b) => b.riskScore - a.riskScore);
  },

  async fetchGlobalStats(): Promise<GlobalDeptHealth[]> {
    const last3Months = dayjs().subtract(3, 'months').format('YYYY-MM-DD');

    const { data: depts } = await supabase.from('departamentos').select('id, nombre');
    if (!depts) return [];

    const { data, error } = await supabase
      .from('asistencias')
      .select(`
        estado,
        usuario_id,
        configuracion_dia!inner (
          fecha,
          roles_cabecera!inner (
            departamento_id
          )
        )
      `)
      .gte('configuracion_dia.fecha', last3Months);

    if (error) throw error;

    const statsByDept: Record<number, { total: number; present: number; users: Set<string> }> = {};
    for (const r of (data || []) as any[]) {
      const deptId = (r.configuracion_dia as any).roles_cabecera?.[0]?.departamento_id;
      if (!deptId) continue;
      if (!statsByDept[deptId]) statsByDept[deptId] = { total: 0, present: 0, users: new Set() };
      statsByDept[deptId].total++;
      statsByDept[deptId].users.add(String(r.usuario_id));
      if (r.estado === 'Asistió') statsByDept[deptId].present++;
    }

    return depts.map(d => {
      const s = statsByDept[d.id] || { total: 0, present: 0, users: new Set() };
      return {
        id: d.id,
        nombre: d.nombre,
        totalServers: s.users.size,
        attendanceRate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
        color: '#3b82f6'
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  },

  async fetchPunctualityTrends(deptId: number): Promise<PunctualityStat[]> {
    const startDate = dayjs().subtract(3, 'month').format('YYYY-MM-DD');

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

    const counts: Record<string, number> = {};
    for (const r of (data || []) as any[]) {
      const label = r.estado || 'Sin registro';
      counts[label] = (counts[label] || 0) + 1;
    }

    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  },

  async fetchDemographicDist(deptId?: number): Promise<DemographicData> {
    let query = supabase
      .from('usuarios')
      .select('genero, fecha_nacimiento');

    if (deptId) {
      const { data: members } = await supabase
        .from('membresias')
        .select('usuario_id')
        .eq('departamento_id', deptId);
      const ids = (members || []).map(m => m.usuario_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const result: DemographicData = {
      gender: { male: 0, female: 0 },
      ageRanges: { '13-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0 }
    };

    for (const u of (data || []) as any[]) {
      const g = (u.genero || '').toLowerCase();
      if (g === 'masculino' || g === 'm' || g === 'hombre') result.gender.male++;
      else if (g === 'femenino' || g === 'f' || g === 'mujer') result.gender.female++;

      if (u.fecha_nacimiento) {
        const age = dayjs().diff(dayjs(u.fecha_nacimiento), 'year');
        if (age >= 13 && age <= 17) result.ageRanges['13-17']++;
        else if (age >= 18 && age <= 25) result.ageRanges['18-25']++;
        else if (age >= 26 && age <= 35) result.ageRanges['26-35']++;
        else if (age >= 36 && age <= 50) result.ageRanges['36-50']++;
        else if (age > 50) result.ageRanges['51+']++;
      }
    }

    return result;
  }
};
