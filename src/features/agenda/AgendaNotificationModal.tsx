import { useEffect, useState, useRef } from 'react';
import { Modal, Stack, Text, Group, ThemeIcon, Button, Badge, Divider, Box } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconMapPin, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { agendaService, type AgendaEvento } from '../../services/agendaService';
import { supabase } from '../../services/supabaseClient';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export function AgendaNotificationModal() {
    const [opened, setOpened] = useState(false);
    const [eventos, setEventos] = useState<AgendaEvento[]>([]);
    const checked = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (checked.current) return;
        checked.current = true;

        async function check() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const unseen = await agendaService.getUnseenForUser(user.id);
            if (unseen.length === 0) return;

            setEventos(unseen);
            setOpened(true);
            await agendaService.markAllAsSeen(user.id);
        }

        check();
    }, []);

    const handleClose = () => setOpened(false);

    const handleVerAgenda = () => {
        setOpened(false);
        navigate('/agenda');
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'orange.6', to: 'yellow.5', deg: 135 }}>
                        <IconCalendarEvent size={18} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text fw={800} size="md">
                            {eventos.length === 1 ? 'Nuevo evento en la agenda' : `${eventos.length} nuevos eventos en la agenda`}
                        </Text>
                        <Text size="xs" c="dimmed" fw={500}>Se han añadido los siguientes eventos</Text>
                    </Stack>
                </Group>
            }
            radius="xl"
            size="md"
            centered
            overlayProps={{ blur: 3 }}
        >
            <Stack gap="sm" mt="xs">
                {eventos.map((e, i) => (
                    <Box key={e.id}>
                        {i > 0 && <Divider mb="sm" />}
                        <Stack gap={6}>
                            <Group gap="xs" align="center">
                                <Text fw={800} size="sm">{e.titulo}</Text>
                                <Badge color="teal" variant="dot" size="sm">Nuevo</Badge>
                            </Group>
                            {e.descripcion && (
                                <Text size="sm" c="dimmed" fw={500}>{e.descripcion}</Text>
                            )}
                            <Group gap="lg">
                                <Group gap="xs">
                                    <IconCalendarEvent size={13} color="var(--mantine-color-gold-6)" />
                                    <Text size="xs" fw={700} c="gold.7">
                                        {dayjs(e.fecha).format('dddd D [de] MMMM YYYY')}
                                    </Text>
                                </Group>
                                {e.hora && (
                                    <Group gap="xs">
                                        <IconClock size={13} color="var(--mantine-color-dimmed)" />
                                        <Text size="xs" fw={600} c="dimmed">{e.hora.slice(0, 5)}</Text>
                                    </Group>
                                )}
                                {e.lugar && (
                                    <Group gap="xs">
                                        <IconMapPin size={13} color="var(--mantine-color-dimmed)" />
                                        <Text size="xs" fw={600} c="dimmed">{e.lugar}</Text>
                                    </Group>
                                )}
                            </Group>
                        </Stack>
                    </Box>
                ))}

                <Group justify="flex-end" mt="md" gap="sm">
                    <Button variant="default" radius="xl" onClick={handleClose} leftSection={<IconCheck size={16} />}>
                        Entendido
                    </Button>
                    <Button
                        radius="xl"
                        variant="gradient"
                        gradient={{ from: 'orange.6', to: 'yellow.5', deg: 135 }}
                        onClick={handleVerAgenda}
                        leftSection={<IconCalendarEvent size={16} />}
                    >
                        Ver Agenda
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
