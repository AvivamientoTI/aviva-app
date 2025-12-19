import { supabase } from './supabaseClient';

export const assignmentsService = {
  /**
   * Obtiene asignaciones por departamento con todos los datos relacionados
   */
  async fetchByDepartment(deptId) {
    console.log('🔎 assignmentsService.fetchByDepartment - deptId:', deptId, 'tipo:', typeof deptId);

    // Primero verificar si hay asignaciones en general
    const { data: allData } = await supabase.from('asignaciones').select('id').limit(5);
    console.log('🔍 Total asignaciones en BD:', allData?.length || 0);

    const { data, error } = await supabase
      .from('asignaciones')
      .select(`
        id,
        usuario_id,
        usuario:usuarios (nombre, apellido),
        posicion:posiciones_departamento (nombre),
        configuracion_dia!inner (
          fecha,
          tipo_servicio,
          color_uniforme,
          encargado:usuarios!configuracion_dia_encargado_id_fkey (nombre, apellido),
          roles_cabecera!inner (
            departamento_id
          )
        )
      `)
      .eq('configuracion_dia.roles_cabecera.departamento_id', Number(deptId));

    console.log('📊 Query result - data:', data?.length || 0, 'error:', error);
    if (data && data.length > 0) {
      console.log('📋 Primera asignación:', data[0]);
    }

    if (error) throw error;
    return data;
  },

  /**
   * Elimina una asignación por ID
   */
  async delete(assignmentId) {
    const { error } = await supabase
      .from('asignaciones')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
  },

  /**
   * Intercambia el usuario asignado en una asignación
   */
  async swap(assignmentId, newUserId) {
    const { error } = await supabase
      .from('asignaciones')
      .update({ usuario_id: newUserId })
      .eq('id', assignmentId);

    if (error) throw error;
  },

  /**
   * Obtiene todos los usuarios asignados en una fecha específica (en todos los departamentos)
   */
  async fetchUsersByDate(fecha) {
    // Consulta más robusta: empezar por configuración del día
    const { data: configs, error } = await supabase
      .from('configuracion_dia')
      .select(`
        asignaciones (
          usuario_id,
          usuario:usuarios (id, nombre, apellido)
        )
      `)
      .eq('fecha', fecha);

    if (error) throw error;

    // Aplanar las asignaciones de todas las configuraciones encontradas (varios departamentos)
    const allAssignments = [];
    if (configs) {
      configs.forEach(c => {
        if (c.asignaciones) {
          allAssignments.push(...c.asignaciones);
        }
      });
    }

    return allAssignments;
  },

  /**
   * Obtiene todas las asignaciones de un mes y año específicos para todos los departamentos
   */
  async fetchAllByMonth(month, year) {
    const { data, error } = await supabase
      .from('asignaciones')
      .select(`
        usuario_id,
        configuracion_dia!inner (
          fecha,
          roles_cabecera!inner (
            departamento_id,
            departamento:departamentos (nombre)
          )
        )
      `)
      .eq('configuracion_dia.roles_cabecera.mes', month)
      .eq('configuracion_dia.roles_cabecera.anio', year);

    if (error) throw error;
    return data || [];
  }
};
