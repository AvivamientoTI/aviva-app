import { supabase } from './supabaseClient';
import type { Database } from '../types/database.types';

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
    hora_registro: string | null;
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
    async fetchAttendance(configDiaId: number | string): Promise<any[]> {
        const { data, error } = await supabase
            .from('asistencias')
            .select('id, estado, justificacion, hora_registro, usuario_id, configuracion_dia_id, usuario:usuarios!asistencias_usuario_id_fkey(nombre, apellido)')
            .eq('configuracion_dia_id', Number(configDiaId));

        if (error) throw error;
        return data || [];
    },

    /**
     * Guarda o actualiza los registros de asistencia
     */
    async updateAttendanceRecords(records: (AttendanceInsert & { id?: string | number; tipo_justificacion?: string | null })[]): Promise<void> {
        const { error } = await supabase
            .from('asistencias')
            .upsert(records.map(r => ({
                usuario_id: r.usuario_id,
                configuracion_dia_id: r.configuracion_dia_id,
                estado: r.estado,
                justificacion: r.justificacion,
                tipo_justificacion: r.tipo_justificacion ?? null,
                hora_registro: r.hora_registro,
                registrado_por: r.registrado_por
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
        const { data, error } = await supabase
            .rpc('get_attendance_detailed', {
                p_config_dia_id: configDiaId,
                p_dept_id: deptId
            });

        if (error) throw error;

        return (data || []).map((r: any) => ({
            id: r.asistencia_id || `temp-${r.usuario_id}`,
            configuracion_dia_id: configDiaId,
            usuario_id: r.usuario_id,
            estado: r.estado || null,
            justificacion: r.justificacion || null,
            tipo_justificacion: r.tipo_justificacion || null,
            hora_registro: r.hora_registro || null,
            registrado_por: r.registrado_por || null,
            created_at: null,
            updated_at: null,
            usuario: {
                nombre: r.nombre,
                apellido: r.apellido
            },
            posicion: r.posicion_nombre ? { nombre: r.posicion_nombre } : null
        })) as AttendanceRecordWithDetails[];
    },

    /**
     * Obtiene el historial de asistencia personal de un usuario
     */
    async fetchAttendanceRegistry(configDiaId: number, deptId: number): Promise<any[]> {
        const { data, error } = await supabase
            .rpc('get_attendance_detailed', {
                p_config_dia_id: configDiaId,
                p_dept_id: deptId
            });

        if (error) throw error;

        const registradorIds = [...new Set(
            (data || []).map((r: any) => r.registrado_por).filter(Boolean)
        )];

        let registradoresMap: Record<number, string> = {};
        if (registradorIds.length > 0) {
            const { data: regs } = await supabase
                .from('usuarios')
                .select('id, nombre, apellido')
                .in('id', registradorIds);
            (regs || []).forEach((u: any) => {
                registradoresMap[u.id] = `${u.nombre} ${u.apellido}`;
            });
        }

        return (data || []).map((r: any) => ({
            id: r.asistencia_id || `temp-${r.usuario_id}`,
            usuario_id: r.usuario_id,
            estado: r.estado || null,
            justificacion: r.justificacion || null,
            tipo_justificacion: r.tipo_justificacion || null,
            hora_registro: r.hora_registro || null,
            registrado_por: r.registrado_por || null,
            registrado_por_nombre: r.registrado_por ? (registradoresMap[r.registrado_por] ?? null) : null,
            usuario: { nombre: r.nombre, apellido: r.apellido },
            posicion: r.posicion_nombre ? { nombre: r.posicion_nombre } : null,
        }));
    },

    async fetchPersonalAttendance(usuarioId: number): Promise<any[]> {
        const { data, error } = await supabase
            .from('asistencias')
            .select(`
                id,
                estado,
                justificacion,
                tipo_justificacion,
                created_at,
                configuracion_dia:configuracion_dia_id (
                    fecha,
                    tipo_servicio
                )
            `)
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
