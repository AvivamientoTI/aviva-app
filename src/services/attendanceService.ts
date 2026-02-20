import { supabase } from './supabaseClient';
import type { Database } from '../types/database.types';

export type ServiceDay = Pick<Database['public']['Tables']['configuracion_dia']['Row'], 'id' | 'fecha' | 'tipo_servicio'>;
export type AttendanceRecord = Database['public']['Tables']['asistencias']['Row'];
export type AttendanceInsert = Database['public']['Tables']['asistencias']['Insert'];

export interface DepartmentMember {
    id: number;
    nombre: string;
    apellido: string;
    genero?: string | null;
    roles?: string[];
}

export const attendanceService = {
    /**
     * Obtiene la configuración de días (servicios) para un departamento
     */
    async fetchServiceDays(deptId: number | string): Promise<ServiceDay[]> {
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
            .eq('roles_cabecera.departamento_id', Number(deptId))
            .order('fecha', { ascending: false })
            .limit(10); // Mostrar los últimos 10 servicios por defecto

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene todos los miembros de un departamento
     */
    async fetchDeptMembers(deptId: number | string): Promise<DepartmentMember[]> {
        const { data, error } = await supabase
            .from('membresias')
            .select(`
        usuario_id,
        rol_jerarquico,
        usuario:usuarios (id, nombre, apellido, genero)
      `)
            .eq('departamento_id', Number(deptId));

        if (error) throw error;

        // Agrupar todos los roles de cada usuario en el departamento
        const membersMap = new Map<number, DepartmentMember>();
        const membersData = data || [];

        for (const m of membersData) {
            if (!m.usuario_id || !m.usuario) continue;

            // Ensure TS knows usuario is not array (based on relationship)
            const user = Array.isArray(m.usuario) ? m.usuario[0] : m.usuario;
            if (!user) continue;

            if (!membersMap.has(m.usuario_id)) {
                membersMap.set(m.usuario_id, {
                    id: user.id,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    genero: user.genero,
                    roles: [m.rol_jerarquico ? m.rol_jerarquico.toLowerCase() : '']
                });
            } else {
                // Agregar rol si no está repetido
                const member = membersMap.get(m.usuario_id);
                if (member) {
                    const rol = m.rol_jerarquico ? m.rol_jerarquico.toLowerCase() : '';
                    if (rol && !member.roles?.includes(rol)) {
                        if (!member.roles) member.roles = [];
                        member.roles.push(rol);
                    }
                }
            }
        }

        return Array.from(membersMap.values());
    },

    /**
     * Obtiene los registros de asistencia existentes para un día de servicio
     */
    async fetchAttendance(configDiaId: number | string): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase
            .from('asistencias')
            .select('*')
            .eq('configuracion_dia_id', Number(configDiaId));

        if (error) throw error;
        return data || [];
    },

    /**
     * Guarda o actualiza los registros de asistencia
     */
    async saveAttendance(records: AttendanceInsert[]): Promise<void> {
        const { error } = await supabase
            .from('asistencias')
            .upsert(records, { onConflict: 'configuracion_dia_id, usuario_id' });

        if (error) throw error;
    }
};
