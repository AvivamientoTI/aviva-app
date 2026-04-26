import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCalendarEvent } from '@tabler/icons-react';
import { createElement } from 'react';
import { agendaService } from '../services/agendaService';
import { supabase } from '../services/supabaseClient';

export function useAgendaNotification() {
    const notified = useRef(false);

    useEffect(() => {
        if (notified.current) return;

        async function check() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const unseen = await agendaService.getUnseenForUser(user.id);
            if (unseen.length === 0) return;

            notified.current = true;

            notifications.show({
                id: 'agenda-nuevos-eventos',
                title: unseen.length === 1 ? '📅 Nuevo evento en la agenda' : `📅 ${unseen.length} nuevos eventos en la agenda`,
                message: unseen.length === 1
                    ? `"${unseen[0].titulo}" ha sido añadido a la agenda.`
                    : `Se han añadido ${unseen.length} eventos a la agenda. Revísalos en la sección Agenda.`,
                color: 'gold',
                autoClose: 8000,
                icon: createElement(IconCalendarEvent, { size: 20 }),
            });

            await agendaService.markAllAsSeen(user.id);
        }

        check();
    }, []);
}
