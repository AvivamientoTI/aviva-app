import { supabase } from './supabaseClient';

export const attendanceService = {
    /**
     * Obtiene la configuración de días (servicios) para un departamento
     */
    async fetchServiceDays(deptId) {
        const { data, error } = await supabase
            .from('configuracion_dia')
            .select(`
        id,
        fecha,
        tipo_servicio,
        roles_cabecera!inner (
          departamento_id
        )
      `)
            .eq('roles_cabecera.departamento_id', deptId)
            .order('fecha', { ascending: false })
            .limit(10); // Mostrar los últimos 10 servicios por defecto

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene todos los miembros de un departamento
     */
    async fetchDeptMembers(deptId) {
        const { data, error } = await supabase
            .from('membresias')
            .select(`
        usuario_id,
        rol_jerarquico,
        usuario:usuarios (id, nombre, apellido)
      `)
            .eq('departamento_id', deptId);

        if (error) throw error;

        // De-duplicar por usuario_id por si un usuario tiene múltiples roles en el mismo depto
        const uniqueMembers = [];
        const seenIds = new Set();

        for (const m of data) {
            if (!seenIds.has(m.usuario_id)) {
                seenIds.add(m.usuario_id);
                uniqueMembers.push({
                    id: m.usuario.id,
                    nombre: m.usuario.nombre,
                    apellido: m.usuario.apellido,
                    rol: m.rol_jerarquico
                });
            }
        }

        return uniqueMembers;
    },

    /**
     * Obtiene los registros de asistencia existentes para un día de servicio
     */
    async fetchAttendance(configDiaId) {
        const { data, error } = await supabase
            .from('asistencias')
            .select('*')
            .eq('configuracion_dia_id', configDiaId);

        if (error) throw error;
        return data;
    },

    /**
     * Guarda o actualiza los registros de asistencia
     */
    async saveAttendance(records) {
        const { error } = await supabase
            .from('asistencias')
            .upsert(records, { onConflict: 'configuracion_dia_id, usuario_id' });

        if (error) throw error;
    }
};
