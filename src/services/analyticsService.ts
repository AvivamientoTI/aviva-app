import { supabase } from './supabaseClient';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);
import type { StatsData, MonthlyStat, ChurnRiskUser, GlobalDeptHealth, DemographicData, PunctualityStat } from '../types';
import type { Database } from '../types/database.types';
import { ATTENDANCE_STATES } from '../constants/attendance';

type AttendanceWithRelations = Database['public']['Tables']['asistencias']['Row'] & {
  configuracion_dia: {
    fecha: string;
    // Relación muchos-a-uno (el FK rol_cabecera_id vive en configuracion_dia):
    // PostgREST la devuelve como objeto, no como array.
    roles_cabecera: {
      departamento_id: number;
    } | null;
  };
};

const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
  count?: number | null;
};

/**
 * PostgREST caps unpaginated selects at ~1000 rows. Departments with months of
 * attendance history routinely exceed that, so aggregation queries must page
 * through the full result set instead of silently truncating it.
 *
 * Si la consulta pide `{ count: 'exact' }`, las páginas restantes se piden en
 * paralelo (2 viajes de red en total); si no, se recorren secuencialmente.
 */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const first = await buildQuery(0, SUPABASE_PAGE_SIZE - 1);
  if (first.error) throw first.error;

  const rows: T[] = [...(first.data || [])];
  if (rows.length < SUPABASE_PAGE_SIZE) return rows;

  if (typeof first.count === 'number') {
    const totalPages = Math.ceil(first.count / SUPABASE_PAGE_SIZE);
    const rest = await Promise.all(
      Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => {
        const from = (i + 1) * SUPABASE_PAGE_SIZE;
        return buildQuery(from, from + SUPABASE_PAGE_SIZE - 1);
      })
    );
    for (const page of rest) {
      if (page.error) throw page.error;
      rows.push(...(page.data || []));
    }
    return rows;
  }

  let from = SUPABASE_PAGE_SIZE;
  while (true) {
    const { data, error } = await buildQuery(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw error;

    const page = data || [];
    rows.push(...page);

    if (page.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

type DeptAttendanceRow = {
  estado: string | null;
  configuracion_dia: {
    fecha: string;
    roles_cabecera: { departamento_id: number } | null;
  };
};

const inFlightDeptRows = new Map<number, Promise<DeptAttendanceRow[]>>();

/**
 * Historial de asistencia del departamento desde la fecha más antigua que
 * necesita cualquier vista (año en curso, 12 semanas o 3 meses). Las vistas
 * Mensual/Anual/Semanal/Puntualidad y el Dashboard lo filtran en memoria, así
 * que las peticiones simultáneas comparten una sola descarga en vez de bajar
 * el mismo historial cada una. Solo se comparte mientras está en vuelo: nada
 * queda en caché, por lo que los datos siempre salen frescos.
 */
function fetchDeptAttendanceRows(deptId: number): Promise<DeptAttendanceRow[]> {
  const inFlight = inFlightDeptRows.get(deptId);
  if (inFlight) return inFlight;

  const candidates = [
    dayjs().startOf('year'),
    dayjs().subtract(12, 'week').startOf('week'),
    dayjs().subtract(3, 'month'),
  ];
  const startDate = candidates
    .reduce((min, d) => (d.isBefore(min) ? d : min))
    .format('YYYY-MM-DD');

  const promise = fetchAllRows<DeptAttendanceRow>((from, to) =>
    supabase
      .from('asistencias')
      .select(`
        estado,
        configuracion_dia!inner (
          fecha,
          roles_cabecera!inner (
            departamento_id
          )
        )
      `, { count: 'exact' })
      .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
      .gte('configuracion_dia.fecha', startDate)
      .order('id', { ascending: true })
      .range(from, to) as unknown as PromiseLike<PageResult<DeptAttendanceRow>>
  ).finally(() => inFlightDeptRows.delete(deptId));

  inFlightDeptRows.set(deptId, promise);
  return promise;
}

function filterRowsFrom(rows: DeptAttendanceRow[], startDate: string): DeptAttendanceRow[] {
  return rows.filter(r => r.configuracion_dia.fecha >= startDate);
}

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

    if (range === 'YTD') {
      const rows = await fetchDeptAttendanceRows(deptId);
      return this.processAttendanceData(filterRowsFrom(rows, startDate));
    }

    const data = await fetchAllRows<any>((from, to) =>
      supabase
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
        .gte('configuracion_dia.fecha', startDate)
        .order('id', { ascending: true })
        .range(from, to)
    );
    return this.processAttendanceData(data);
  },

  async fetchUserAttendanceStats(userId: number, deptId: number, range: 'YTD' | number = 2): Promise<StatsData> {
    const startDate = range === 'YTD'
      ? dayjs().startOf('year').format('YYYY-MM-DD')
      : dayjs().subtract(range, 'month').startOf('month').format('YYYY-MM-DD');

    const data = await fetchAllRows<any>((from, to) =>
      supabase
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
        .gte('configuracion_dia.fecha', startDate)
        .order('id', { ascending: true })
        .range(from, to)
    );
    return this.processAttendanceData(data);
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
    
    const byMonthUnsorted: Record<string, MonthlyStat> = {};
    const sortKeys: Record<string, string> = {};
    const lastMonthStr = dayjs().subtract(1, 'month').format('MMM YYYY');

    for (let i = 0; i < rawData.length; i++) {
        const r = rawData[i];
        const status = r.estado;
        if (!status) continue;

        // Actualizar sumario
        if (status === ATTENDANCE_STATES.ASISTIO) summary.asistio++;
        else if (status === ATTENDANCE_STATES.CON_JUSTIFICACION) summary.faltoConAviso++;
        else if (status === ATTENDANCE_STATES.SIN_JUSTIFICACION) summary.faltoSinAviso++;
        else continue;

        // Actualizar por mes
        const date = dayjs(r.configuracion_dia.fecha);
        const monthKey = date.format('MMM YYYY');

        if (!byMonthUnsorted[monthKey]) {
            byMonthUnsorted[monthKey] = { month: monthKey, asistio: 0, faltas: 0 };
            sortKeys[monthKey] = date.format('YYYY-MM');
        }

        if (status === ATTENDANCE_STATES.ASISTIO) {
            byMonthUnsorted[monthKey].asistio++;
        } else {
            byMonthUnsorted[monthKey].faltas++;
        }
    }

    summary.total = summary.asistio + summary.faltoConAviso + summary.faltoSinAviso;

    // Reconstruir en orden cronológico: rawData ya no llega ordenada por fecha
    // (se pagina por id para no chocar con el límite de filas de PostgREST),
    // así que el orden de inserción original ya no refleja el orden real de los meses.
    const byMonth: Record<string, MonthlyStat> = {};
    for (const monthKey of Object.keys(byMonthUnsorted).sort((a, b) => sortKeys[a].localeCompare(sortKeys[b]))) {
        byMonth[monthKey] = byMonthUnsorted[monthKey];
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
    const data = filterRowsFrom(await fetchDeptAttendanceRows(deptId), startDate);

    const byWeek: Record<string, { weekStart: string; present: number; absent: number; total: number }> = {};

    for (const r of data as any[]) {
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
    const data = filterRowsFrom(await fetchDeptAttendanceRows(deptId), startOfYear);

    const byDate: Record<string, number> = {};
    for (const r of data as any[]) {
      const fecha = (r.configuracion_dia as any).fecha as string;
      if (r.estado === 'Asistió') {
        byDate[fecha] = (byDate[fecha] || 0) + 1;
      }
    }

    const heatmapData = Object.entries(byDate).map(([date, count]) => ({ date, count }));

    return {
      year: dayjs().year(),
      totalServices: data.filter((r: any) => r.estado === 'Asistió').length,
      uniqueDates: heatmapData.length,
      heatmapData
    };
  },

  async fetchChurnRisk(deptId: number): Promise<ChurnRiskUser[]> {
    const startDate = dayjs().subtract(4, 'week').format('YYYY-MM-DD');

    const data = await fetchAllRows<any>((from, to) =>
      supabase
        .from('asistencias')
        .select(`
          usuario_id,
          estado,
          usuario:usuarios!asistencias_usuario_id_fkey (nombre, apellido),
          configuracion_dia!inner (
            fecha,
            roles_cabecera!inner (
              departamento_id
            )
          )
        `)
        .eq('configuracion_dia.roles_cabecera.departamento_id', deptId)
        .gte('configuracion_dia.fecha', startDate)
        .order('id', { ascending: true })
        .range(from, to)
    );

    const byUser: Record<string, any> = {};
    for (const r of data as any[]) {
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

    const data = await fetchAllRows<any>((from, to) =>
      supabase
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
        `, { count: 'exact' })
        .gte('configuracion_dia.fecha', last3Months)
        .order('id', { ascending: true })
        .range(from, to)
    );

    const statsByDept: Record<number, { total: number; present: number; users: Set<string> }> = {};
    for (const r of data as any[]) {
      const deptId = (r.configuracion_dia as any).roles_cabecera?.departamento_id;
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
    const data = filterRowsFrom(await fetchDeptAttendanceRows(deptId), startDate);

    const counts: Record<string, number> = {};
    for (const r of data as any[]) {
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
