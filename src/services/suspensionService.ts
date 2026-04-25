import dayjs from 'dayjs';
import { supabase } from './supabaseClient';

export interface Suspension {
    id: number;
    usuario_id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    tipo: 'suspension' | 'inactivo';
    motivo?: string;
    created_by?: string;
    created_at?: string;
    usuario?: {
        nombre: string;
        apellido: string;
    };
}

export const suspensionService = {
    /**
     * Crea una nueva suspensión
     */
    async create(suspension: Omit<Suspension, 'id' | 'created_at' | 'created_by' | 'usuario'>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('suspensiones')
            .insert({ ...suspension, created_by: user?.id ?? null });

        if (error) throw error;
    },

    /**
     * Obtiene las suspensiones activas (fecha_fin >= hoy)
     */
    async getActiveSuspensions(): Promise<Suspension[]> {
        const today = dayjs().format('YYYY-MM-DD');

        const { data, error } = await supabase
            .from('suspensiones')
            .select(`
                *,
                usuario:usuarios (nombre, apellido)
            `)
            .or(`fecha_fin.gte.${today},fecha_fin.is.null`)
            .order('fecha_inicio', { ascending: false });

        if (error) throw error;
        return data as Suspension[] || [];
    },

    /**
     * Obtiene todas las suspensiones (histórico)
     */
    async getAllSuspensions(): Promise<Suspension[]> {
        const { data, error } = await supabase
            .from('suspensiones')
            .select(`
                *,
                usuario:usuarios (nombre, apellido)
            `)
            .order('fecha_inicio', { ascending: false });

        if (error) throw error;
        return data as Suspension[] || [];
    },

    /**
     * Finaliza una suspensión prematuramente (actualizando fecha_fin a ayer)
     * Proceso atómico mediante RPC.
     */
    async endSuspension(id: number): Promise<void> {
        const { error } = await supabase
            .rpc('end_suspension', { p_suspension_id: id });

        if (error) throw error;
    },

    /**
     * Elimina una suspensión
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('suspensiones')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Verifica si un usuario está suspendido en una fecha específica
     */
    async isUserSuspended(userId: number, date: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('suspensiones')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', userId)
            .lte('fecha_inicio', date)
            .or(`fecha_fin.gte.${date},fecha_fin.is.null`);

        if (error) throw error;
        return (count || 0) > 0;
    }
};
