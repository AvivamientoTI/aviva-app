import { useState } from 'react';
import {
    Container, Title, Text, Stack, Group, Paper, SimpleGrid,
    ThemeIcon, Button, TextInput, Textarea, ActionIcon,
    Badge, Loader, Center, Box, Modal, Divider
} from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import {
    IconCalendarEvent, IconPlus, IconTrash, IconMapPin,
    IconClock, IconCheck, IconCalendarOff
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agendaService, type AgendaEvento } from '../../services/agendaService';
import { usePermissions } from '../../hooks/usePermissions';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

type FormData = {
    titulo: string;
    descripcion: string;
    fecha: Date | null;
    hora: string;
    lugar: string;
};

const emptyForm: FormData = { titulo: '', descripcion: '', fecha: null, hora: '', lugar: '' };

export default function Agenda() {
    const permissions = usePermissions();
    const canWrite = permissions.isSystemAdmin;
    const queryClient = useQueryClient();
    const [modalOpened, { open, close }] = useDisclosure(false);
    const [form, setForm] = useState<FormData>(emptyForm);

    const { data: eventos = [], isLoading } = useQuery({
        queryKey: ['agenda_eventos'],
        queryFn: agendaService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: () => agendaService.create({
            titulo: form.titulo,
            descripcion: form.descripcion || null,
            fecha: dayjs(form.fecha).format('YYYY-MM-DD'),
            hora: form.hora || null,
            lugar: form.lugar || null,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda_eventos'] });
            notifications.show({ title: '¡Evento creado!', message: 'El evento fue agregado a la agenda.', color: 'teal', icon: <IconCheck size={18} /> });
            setForm(emptyForm);
            close();
        },
        onError: () => {
            notifications.show({ title: 'Error', message: 'No se pudo crear el evento.', color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => agendaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda_eventos'] });
            notifications.show({ title: 'Eliminado', message: 'Evento eliminado de la agenda.', color: 'blue' });
        },
    });

    const handleSubmit = () => {
        if (!form.titulo.trim() || !form.fecha) {
            notifications.show({ title: 'Campos requeridos', message: 'El título y la fecha son obligatorios.', color: 'yellow' });
            return;
        }
        createMutation.mutate();
    };

    const today = dayjs().startOf('day');
    const upcoming = eventos.filter(e => !dayjs(e.fecha).isBefore(today, 'day'));
    const past = eventos.filter(e => dayjs(e.fecha).isBefore(today, 'day'));

    const renderEvento = (e: AgendaEvento) => {
        const isPast = dayjs(e.fecha).isBefore(dayjs(), 'day');
        return (
            <Paper key={e.id} p="lg" radius="xl" withBorder className="glass-card" style={{ opacity: isPast ? 0.7 : 1 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="md" align="flex-start" wrap="nowrap" style={{ flex: 1 }}>
                        <ThemeIcon size={48} radius="xl" variant="light" color={isPast ? 'gray' : 'gold'} style={{ flexShrink: 0 }}>
                            <IconCalendarEvent size={24} />
                        </ThemeIcon>
                        <Stack gap={4} style={{ flex: 1 }}>
                            <Group gap="sm" align="center">
                                <Text fw={800} size="md">{e.titulo}</Text>
                                {!isPast && <Badge color="teal" variant="dot" size="sm">Próximo</Badge>}
                            </Group>
                            {e.descripcion && <Text size="sm" c="dimmed" fw={500}>{e.descripcion}</Text>}
                            <Group gap="lg" mt={4}>
                                <Group gap="xs">
                                    <IconCalendarEvent size={14} color="var(--mantine-color-gold-6)" />
                                    <Text size="xs" fw={700} c="gold.7">
                                        {dayjs(e.fecha).format('dddd D [de] MMMM YYYY')}
                                    </Text>
                                </Group>
                                {e.hora && (
                                    <Group gap="xs">
                                        <IconClock size={14} color="var(--mantine-color-dimmed)" />
                                        <Text size="xs" fw={600} c="dimmed">{e.hora.slice(0, 5)}</Text>
                                    </Group>
                                )}
                                {e.lugar && (
                                    <Group gap="xs">
                                        <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
                                        <Text size="xs" fw={600} c="dimmed">{e.lugar}</Text>
                                    </Group>
                                )}
                            </Group>
                        </Stack>
                    </Group>
                    {canWrite && (
                        <ActionIcon
                            color="red" variant="subtle" radius="md"
                            onClick={() => { if (confirm('¿Eliminar este evento?')) deleteMutation.mutate(e.id); }}
                            loading={deleteMutation.isPending}
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    )}
                </Group>
            </Paper>
        );
    };

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.4rem', letterSpacing: '-0.02em' }}>
                            Agenda 📅
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Eventos y actividades de la iglesia</Text>
                    </Stack>
                    {canWrite && (
                        <Button
                            leftSection={<IconPlus size={18} />}
                            radius="xl" size="md"
                            variant="gradient"
                            gradient={{ from: 'orange.6', to: 'yellow.5', deg: 135 }}
                            onClick={open}
                        >
                            Nuevo Evento
                        </Button>
                    )}
                </Group>

                {isLoading ? (
                    <Center py="xl"><Loader color="gold" type="dots" /></Center>
                ) : eventos.length === 0 ? (
                    <Paper p="xl" radius="xl" withBorder style={{ borderStyle: 'dashed' }}>
                        <Center py="xl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gold">
                                    <IconCalendarOff size={30} />
                                </ThemeIcon>
                                <Text fw={700} c="dimmed">No hay eventos en la agenda</Text>
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <Stack gap="xl">
                        {upcoming.length > 0 && (
                            <Stack gap="md">
                                <Group gap="sm">
                                    <Text fw={800} size="sm" tt="uppercase" style={{ letterSpacing: '0.08em' }} c="dimmed">Próximos eventos</Text>
                                    <Badge color="teal" variant="light" size="sm">{upcoming.length}</Badge>
                                </Group>
                                {upcoming.map(renderEvento)}
                            </Stack>
                        )}

                        {past.length > 0 && (
                            <Stack gap="md">
                                <Divider />
                                <Group gap="sm">
                                    <Text fw={800} size="sm" tt="uppercase" style={{ letterSpacing: '0.08em' }} c="dimmed">Eventos pasados</Text>
                                    <Badge color="gray" variant="light" size="sm">{past.length}</Badge>
                                </Group>
                                {past.map(renderEvento)}
                            </Stack>
                        )}
                    </Stack>
                )}
            </Stack>

            <Modal
                opened={modalOpened}
                onClose={close}
                title={<Text fw={800} size="lg">Nuevo Evento</Text>}
                radius="xl"
                size="md"
                centered
            >
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Nombre del evento"
                        value={form.titulo}
                        onChange={e => setForm({ ...form, titulo: e.target.value })}
                        radius="md"
                        required
                    />
                    <Textarea
                        label="Descripción"
                        placeholder="Detalles del evento (opcional)"
                        value={form.descripcion}
                        onChange={e => setForm({ ...form, descripcion: e.target.value })}
                        radius="md"
                        autosize
                        minRows={2}
                    />
                    <SimpleGrid cols={2}>
                        <DatePickerInput
                            label="Fecha"
                            placeholder="Seleccionar"
                            value={form.fecha}
                            onChange={val => setForm({ ...form, fecha: val as Date | null })}
                            radius="md"
                            required
                            leftSection={<IconCalendarEvent size={16} />}
                        />
                        <TimeInput
                            label="Hora (opcional)"
                            value={form.hora}
                            onChange={e => setForm({ ...form, hora: e.target.value })}
                            radius="md"
                            leftSection={<IconClock size={16} />}
                        />
                    </SimpleGrid>
                    <TextInput
                        label="Lugar (opcional)"
                        placeholder="Ubicación del evento"
                        value={form.lugar}
                        onChange={e => setForm({ ...form, lugar: e.target.value })}
                        radius="md"
                        leftSection={<IconMapPin size={16} />}
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" radius="xl" onClick={close}>Cancelar</Button>
                        <Button
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: 'orange.6', to: 'yellow.5', deg: 135 }}
                            onClick={handleSubmit}
                            loading={createMutation.isPending}
                            leftSection={<IconPlus size={16} />}
                        >
                            Crear Evento
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
