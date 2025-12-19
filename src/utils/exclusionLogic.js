import { supabase } from '../services/supabaseClient';

/**
 * Fetches users who are NOT assigned to a Priority 1 (General Service) department on the given date.
 * @param {string} date - The date to check (YYYY-MM-DD).
 * @param {Array} allUsers - List of all available users.
 * @returns {Promise<Array>} - List of eligible users.
 */
export const getEligibleUsersForDate = async (date, allUsers, forcePriorityBlock = true) => {
  // 1. Find Priority 1 Departments
  let priorityDeptIds = [];
  if (forcePriorityBlock) {
    const { data: priorityDepts, error: deptError } = await supabase
      .from('departamentos')
      .select('id')
      .eq('prioridad', 1);

    if (deptError) {
      console.error('Error fetching priority departments:', deptError);
      return allUsers;
    }

    priorityDeptIds = priorityDepts.map(d => d.id);
  }

  // If not enforcing priority block or none exist, proceed only with absences
  const checkPriority = forcePriorityBlock && priorityDeptIds.length > 0;

  // 2. Find assignments for Priority 1 departments on this date
  // We need to join asignaciones -> configuracion_dia -> roles_cabecera -> departamentos
  // But Supabase join syntax is a bit specific.
  // Easier: Get configuracion_dia IDs for this date AND priority departments.

  // First, get roles_cabecera for priority depts
  // Actually, we can query configuracion_dia directly if we filter by date, 
  // but we need to know if the parent roles_cabecera belongs to a priority dept.

  let blockedAssignments = [];
  if (checkPriority) {
    const { data, error: assignError } = await supabase
      .from('asignaciones')
      .select(`
        usuario_id,
        configuracion_dia!inner (
          fecha,
          roles_cabecera!inner (
            departamento_id
          )
        )
      `)
      .eq('configuracion_dia.fecha', date)
      .in('configuracion_dia.roles_cabecera.departamento_id', priorityDeptIds);

    if (assignError) {
      console.error('Error fetching blocked assignments:', assignError);
    } else if (data) {
      blockedAssignments = data;
    }
  }

  const blockedUserIds = new Set(blockedAssignments.map(a => a.usuario_id));

  // 3. Find Absences for this date
  const { data: absences, error: absenceError } = await supabase
    .from('ausencias')
    .select('usuario_id')
    .lte('fecha_inicio', date)
    .gte('fecha_fin', date);

  if (absenceError) {
    console.error('Error fetching absences:', absenceError);
  } else if (absences) {
    absences.forEach(a => blockedUserIds.add(a.usuario_id));
  }

  // 4. Filter out blocked users
  return allUsers.filter(user => !blockedUserIds.has(user.id));
};

/**
 * Fetches users who have NO assignments at all on the given date (strict).
 * Uses a Supabase RPC to bypass RLS for global conflict detection.
 */
export const getUsersNotAssignedOnDate = async (date, allUsers) => {
  const blockedIds = new Set();

  try {
    const { data: blockedResults, error } = await supabase.rpc('get_blocked_users', {
      p_date: date
    });

    if (error) throw error;

    if (blockedResults) {
      blockedResults.forEach(row => {
        if (row.usuario_id) {
          blockedIds.add(String(row.usuario_id));
        }
      });
    }
  } catch (err) {
    console.error('❌ [GlobalExclusion] Error fetching blocked users via RPC:', err);
  }

  // Filter out any user who has a global assignment or absence
  return allUsers.filter(u => !blockedIds.has(String(u.id)));
};
