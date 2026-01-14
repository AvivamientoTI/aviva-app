import { supabase } from './supabaseClient';

export interface Suspension {
    id: number;
    usuario_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string;
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
        const { error } = await supabase
            .from('suspensiones')
            .insert(suspension);

        if (error) throw error;
    },

    /**
     * Obtiene las suspensiones activas (fecha_fin >= hoy)
     */
    async getActiveSuspensions(): Promise<Suspension[]> {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('suspensiones')
            .select(`
                *,
                usuario:usuarios (nombre, apellido)
            `)
            .gte('fecha_fin', today)
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
     * O elimina el registro si se prefiere. Por ahora actualizamos fecha.
     */
    async endSuspension(id: number): Promise<void> {
        // First, get the suspension details to check start date
        const { data: suspension, error: fetchError } = await supabase
            .from('suspensiones')
            .select('fecha_inicio')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (!suspension) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // If suspension starts today or in Future (>= today's calculated yesterday),
        // we can't set end_date = yesterday because end >= start constraint.
        // Logic: 
        // If start > yesterday => Start is Today or Future. 
        // Action: DELETE (Cancel entirely)
        // If start <= yesterday => Start is Yesterday or Past.
        // Action: UPDATE end_date = yesterday (Shorten it)

        if (suspension.fecha_inicio > yesterdayStr) {
            // Delete it
            const { error } = await supabase
                .from('suspensiones')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } else {
            // Shorten it
            const { error } = await supabase
                .from('suspensiones')
                .update({ fecha_fin: yesterdayStr })
                .eq('id', id);

            if (error) throw error;
        }
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
            .gte('fecha_fin', date);

        if (error) throw error;
        return (count || 0) > 0;
    }
};
