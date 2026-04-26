import { supabase } from './supabaseClient';

export interface AgendaEvento {
    id: number;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    hora: string | null;
    lugar: string | null;
    creado_por: string | null;
    created_at: string;
}

export const agendaService = {
    async getAll(): Promise<AgendaEvento[]> {
        const { data, error } = await supabase
            .from('agenda_eventos')
            .select('*')
            .order('fecha', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    async create(evento: Omit<AgendaEvento, 'id' | 'created_at' | 'creado_por'>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('agenda_eventos').insert({
            ...evento,
            creado_por: user?.id,
        });
        if (error) throw error;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase.from('agenda_eventos').delete().eq('id', id);
        if (error) throw error;
    },

    async getUnseenForUser(userId: string): Promise<AgendaEvento[]> {
        const { data, error } = await supabase
            .from('agenda_eventos')
            .select('*, agenda_eventos_vistos!left(id)')
            .is('agenda_eventos_vistos.id', null)
            .order('fecha', { ascending: true });
        if (error) throw error;

        // Filter out events already seen by this user
        const { data: seen } = await supabase
            .from('agenda_eventos_vistos')
            .select('evento_id')
            .eq('usuario_id', userId);

        const seenIds = new Set((seen ?? []).map(s => s.evento_id));
        return (data ?? []).filter(e => !seenIds.has(e.id));
    },

    async markAsSeen(eventoId: number, userId: string): Promise<void> {
        await supabase.from('agenda_eventos_vistos').upsert({
            evento_id: eventoId,
            usuario_id: userId,
        }, { onConflict: 'evento_id,usuario_id' });
    },

    async markAllAsSeen(userId: string): Promise<void> {
        const eventos = await this.getUnseenForUser(userId);
        if (eventos.length === 0) return;
        await supabase.from('agenda_eventos_vistos').upsert(
            eventos.map(e => ({ evento_id: e.id, usuario_id: userId })),
            { onConflict: 'evento_id,usuario_id' }
        );
    },
};
