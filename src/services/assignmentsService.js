import { supabase } from './supabaseClient';

export const assignmentsService = {
  /**
   * Obtiene asignaciones por departamento con todos los datos relacionados
   */
  async fetchByDepartment(deptId) {
    // 1. Obtener todos los ids de cabecera del departamento
    const { data: cabeceras, error: errorCab } = await supabase
      .from('roles_cabecera')
      .select('id')
      .eq('departamento_id', Number(deptId));
    if (errorCab) throw errorCab;
    if (!cabeceras || cabeceras.length === 0) {
      console.warn('[assignmentsService] No se encontraron cabeceraIds para el departamento', deptId);
      return [];
    }
    const cabeceraIds = cabeceras.map(c => c.id);
    console.log('[assignmentsService] cabeceraIds para departamento', deptId, ':', cabeceraIds);

    // Consultar configuracion_dia para obtener sus ids
    const { data: configsDia, error: errorConfigs } = await supabase
      .from('configuracion_dia')
      .select('id, fecha, rol_cabecera_id')
      .in('rol_cabecera_id', cabeceraIds);
    if (errorConfigs) {
      console.error('[assignmentsService] Error consultando configuracion_dia:', errorConfigs);
      return [];
    }
    console.log('[assignmentsService] configuracion_dia encontrados:', configsDia);
    if (!configsDia || configsDia.length === 0) {
      console.warn('[assignmentsService] No hay configuracion_dia para los cabeceraIds', cabeceraIds);
      return [];
    }
    const configDiaIds = configsDia.map(cd => cd.id);
    console.log('[assignmentsService] configDiaIds usados para filtrar asignaciones:', configDiaIds);

    // 2. Traer asignaciones filtrando por configuracion_dia_id
    const { data, error } = await supabase
      .from('asignaciones')
      .select(`
        id,
        usuario_id,
        usuario:usuarios (nombre, apellido),
        posicion:posiciones_departamento (nombre, genero_requerido),
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
      .in('configuracion_dia_id', configDiaIds);

    if (error) throw error;
    console.log('[assignmentsService] Resultado asignaciones:', data);
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
