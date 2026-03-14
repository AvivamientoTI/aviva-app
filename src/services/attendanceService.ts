import { supabase } from './supabaseClient';
import type { Database } from '../types/database.types';
import { ATTENDANCE_STATES } from '../constants/attendance';

export type ServiceDay = Pick<Database['public']['Tables']['configuracion_dia']['Row'], 'id' | 'fecha' | 'tipo_servicio'>;
export type AttendanceRecord = Database['public']['Tables']['asistencias']['Row'];
export type AttendanceInsert = Database['public']['Tables']['asistencias']['Insert'];

export interface AttendanceRecordWithDetails extends AttendanceRecord {
    usuario: {
        nombre: string;
        apellido: string;
    };
    posicion: {
        nombre: string;
    } | null;
    hora_registro?: string | null;
}

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
    async updateAttendanceRecords(records: any[]): Promise<void> {
        // En Supabase, usamos upsert. Necesitamos mappear los campos si es necesario.
        // El componente envía { id, estado, justificacion, hora_registro }
        // Pero la tabla 'asistencias' necesita { id, estado, justificacion, usuario_id, configuracion_dia_id }
        
        // Sin embargo, si el ID es 'temp-xxx', significa que es un INSERT.
        // Y el upsert necesita el usuario_id y configuracion_dia_id para el conflicto.
        
        // Vamos a mejorar el manejador para que sea robusto.


        // La implementación anterior de saveAttendance usaba AttendanceInsert[]
        // Vamos a mantener el nombre updateAttendanceRecords pero con la lógica de upsert
        const { error } = await supabase
            .from('asistencias')
            .upsert(records.map(r => ({
                id: String(r.id).startsWith('temp-') ? undefined : r.id,
                usuario_id: r.usuario_id,
                configuracion_dia_id: r.configuracion_dia_id,
                estado: r.estado,
                justificacion: r.justificacion
            })), { onConflict: 'configuracion_dia_id, usuario_id' });

        if (error) throw error;
    },

    /**
     * Obtiene los servicios de un departamento para una fecha específica
     */
    async fetchServiceDaysByDate(deptId: number | string, date: string): Promise<ServiceDay[]> {
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
            .eq('fecha', date);

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene la asistencia con detalles de usuario y posición
     */
    async fetchAttendanceWithDetails(configDiaId: number, deptId: number): Promise<AttendanceRecordWithDetails[]> {
        // 1. Obtener la asistencia ya registrada
        const { data: existingAttendance, error: attendError } = await supabase
            .from('asistencias')
            .select('*')
            .eq('configuracion_dia_id', configDiaId);

        if (attendError) throw attendError;
        const attendanceMap = new Map(existingAttendance?.map(a => [a.usuario_id, a]));

        // 2. Obtener las asignaciones para este día (para saber las posiciones)
        const { data: assignments, error: assignError } = await supabase
            .from('asignaciones')
            .select(`
                usuario_id,
                posicion_id,
                usuario:usuarios (nombre, apellido),
                posicion:posiciones_departamento (nombre)
            `)
            .eq('configuracion_dia_id', configDiaId);

        if (assignError) throw assignError;
        const assignmentsMap = new Map((assignments || []).map(a => [a.usuario_id, a]));

        let baseUsers: { usuario_id: number; nombre: string; apellido: string; posicion_nombre: string | null }[] = [];

        if (deptId === 2) {
            // Requerimiento especial: Servidores (Todos los miembros)
            const members = await this.fetchDeptMembers(2);
            baseUsers = members.map(m => ({
                usuario_id: m.id,
                nombre: m.nombre,
                apellido: m.apellido,
                posicion_nombre: (assignmentsMap.get(m.id) as any)?.posicion?.nombre || null
            }));
        } else {
            // Comportamiento estándar: Solo asignados
            baseUsers = (assignments || []).map(a => {
                const user = Array.isArray(a.usuario) ? a.usuario[0] : a.usuario;
                const pos = Array.isArray(a.posicion) ? a.posicion[0] : a.posicion;
                return {
                    usuario_id: a.usuario_id || 0,
                    nombre: user?.nombre || 'Desconocido',
                    apellido: user?.apellido || '',
                    posicion_nombre: pos?.nombre || null
                };
            });
        }

        // 3. Combinar todo
        return baseUsers.map(user => {
            const existing = attendanceMap.get(user.usuario_id);
            
            return {
                id: existing?.id || `temp-${user.usuario_id}`,
                configuracion_dia_id: configDiaId,
                usuario_id: user.usuario_id,
                estado: existing?.estado || ATTENDANCE_STATES.ASISTIO,
                justificacion: existing?.justificacion || null,
                registrado_por: existing?.registrado_por || null,
                created_at: existing?.created_at || null,
                updated_at: existing?.updated_at || null,
                usuario: {
                    nombre: user.nombre,
                    apellido: user.apellido
                },
                posicion: user.posicion_nombre ? { nombre: user.posicion_nombre } : null
            } as AttendanceRecordWithDetails;
        });
    }
};
