import { supabase } from './supabaseClient';

export const assignmentsService = {
    /**
     * Obtiene asignaciones por departamento con todos los datos relacionados
     */
    async fetchByDepartment(deptId: number | string): Promise<any[]> {
        // 1. Obtener todos los ids de cabecera del departamento
        const { data: cabeceras, error: errorCab } = await supabase
            .from('roles_cabecera')
            .select('id')
            .eq('departamento_id', Number(deptId));

        if (errorCab) throw errorCab;

        if (!cabeceras || cabeceras.length === 0) {
            return [];
        }

        const cabeceraIds = cabeceras.map(c => c.id);

        // Consultar configuracion_dia para obtener sus ids
        const { data: configsDia, error: errorConfigs } = await supabase
            .from('configuracion_dia')
            .select('id, fecha, rol_cabecera_id')
            .in('rol_cabecera_id', cabeceraIds);

        if (errorConfigs) {
            console.error('[assignmentsService] Error consultando configuracion_dia:', errorConfigs);
            return [];
        }

        if (!configsDia || configsDia.length === 0) {
            return [];
        }

        const configDiaIds = configsDia.map(cd => cd.id);

        // 2. Traer asignaciones filtrando por configuracion_dia_id
        const { data, error } = await supabase
            .from('asignaciones')
            .select(`
        id,
        usuario_id,
        usuario:usuarios (nombre, apellido),
        posicion:posiciones_departamento (nombre, genero_requerido, orden),
        configuracion_dia!inner (
          fecha,
          tipo_servicio,
          color_uniforme,
          encargado:usuarios!configuracion_dia_encargado_id_fkey (id, nombre, apellido),
          roles_cabecera!inner (
            departamento_id
          )
        )
      `)
            .in('configuracion_dia_id', configDiaIds);

        if (error) throw error;

        return data as any[] || [];
    },

    /**
     * Elimina una asignación por ID
     */
    async delete(assignmentId: number | string): Promise<void> {
        const { error } = await supabase
            .from('asignaciones')
            .delete()
            .eq('id', Number(assignmentId));

        if (error) throw error;
    },

    /**
     * Intercambia el usuario asignado en una asignación
     */
    async swap(assignmentId: number | string, newUserId: number | string): Promise<void> {
        const { error } = await supabase
            .from('asignaciones')
            .update({ usuario_id: Number(newUserId) })
            .eq('id', Number(assignmentId));

        if (error) throw error;
    },

    /**
     * Obtiene todos los usuarios asignados en una fecha específica (en todos los departamentos)
     */
    async fetchUsersByDate(fecha: string): Promise<any[]> {
        const { data, error } = await supabase.rpc('get_blocked_users', {
            p_date: fecha
        });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene todas las asignaciones de un mes y año específicos para todos los departamentos
     */
    async fetchAllByMonth(month: number, year: number): Promise<any[]> {
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
