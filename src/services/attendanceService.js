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
        usuario:usuarios (id, nombre, apellido, genero)
      `)
            .eq('departamento_id', deptId);

        if (error) throw error;

        // Agrupar todos los roles de cada usuario en el departamento
        const membersMap = new Map();
        for (const m of data) {
            if (!membersMap.has(m.usuario_id)) {
                membersMap.set(m.usuario_id, {
                    id: m.usuario.id,
                    nombre: m.usuario.nombre,
                    apellido: m.usuario.apellido,
                    genero: m.usuario.genero,
                    roles: [m.rol_jerarquico ? m.rol_jerarquico.toLowerCase() : '']
                });
            } else {
                // Agregar rol si no está repetido
                const member = membersMap.get(m.usuario_id);
                const rol = m.rol_jerarquico ? m.rol_jerarquico.toLowerCase() : '';
                if (rol && !member.roles.includes(rol)) {
                    member.roles.push(rol);
                }
            }
        }

        return Array.from(membersMap.values());
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
