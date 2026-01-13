import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { suspensionService, type Suspension } from '../../services/suspensionService';
import { useUser } from '../../contexts/UserContext';
import {
    Container,
    Title,
    Card,
    Group,
    Stack,
    Select,
    Button,
    Table,
    Text,
    Badge,
    ActionIcon,
    LoadingOverlay,
    TextInput,
    Box,
    ThemeIcon,
    SimpleGrid
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconBan, IconCalendar, IconUser, IconTrash, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export const SuspensionManager = () => {
    const { userMemberships } = useUser();

    // Check local permission
    const isAuthorized = userMemberships.some(m => {
        const deptName = m.departamento?.nombre || '';
        const role = m.rol_jerarquico?.toLowerCase() || '';
        return deptName === 'Servidores' &&
            ['líder', 'lider', 'sublíder', 'sublider'].includes(role);
    });

    const [suspensions, setSuspensions] = useState<Suspension[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        usuario_id: '',
        motivo: ''
    });
    const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);

    useEffect(() => {
        if (isAuthorized) {
            loadData();
        }
    }, [isAuthorized]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [suspData, usersData] = await Promise.all([
                suspensionService.getAllSuspensions(),
                supabase.from('usuarios').select('id, nombre, apellido').order('apellido')
            ]);

            setSuspensions(suspData);
            if (usersData.data) {
                setUsers(usersData.data);
            }
        } catch (err) {
            console.error(err);
            notifications.show({
                title: 'Error',
                message: 'No se pudieron cargar los datos',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.usuario_id || !dates[0] || !dates[1] || !formData.motivo) {
            notifications.show({
                title: 'Campos incompletos',
                message: 'Por favor completa todos los campos requeridos',
                color: 'yellow'
            });
            return;
        }

        setSubmitting(true);
        try {
            await suspensionService.create({
                usuario_id: Number(formData.usuario_id),
                fecha_inicio: dayjs(dates[0]).format('YYYY-MM-DD'),
                fecha_fin: dayjs(dates[1]).format('YYYY-MM-DD'),
                motivo: formData.motivo
            });

            notifications.show({
                title: 'Éxito',
                message: 'Suspensión registrada correctamente',
                color: 'green',
                icon: <IconCheck size={18} />
            });

            // Reset form and reload
            setFormData({ usuario_id: '', motivo: '' });
            setDates([null, null]);
            await loadData();
        } catch (err) {
            console.error(err);
            notifications.show({
                title: 'Error',
                message: 'No se pudo crear la suspensión',
                color: 'red'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEndSuspension = async (id: number) => {
        if (!confirm('¿Estás seguro de finalizar esta suspensión prematuramente?')) return;
        try {
            await suspensionService.endSuspension(id);
            notifications.show({
                title: 'Actualizado',
                message: 'Suspensión finalizada correctamente',
                color: 'blue'
            });
            await loadData();
        } catch (err) {
            console.error(err);
            notifications.show({
                title: 'Error',
                message: 'Error al finalizar la suspensión',
                color: 'red'
            });
        }
    };

    if (!isAuthorized) {
        return (
            <Container p="xl">
                <Text c="red" ta="center" size="lg" fw={700}>
                    <IconAlertCircle style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                    No tienes permisos para ver esta sección.
                </Text>
            </Container>
        );
    }

    const userOptions = users.map(u => ({
        value: String(u.id),
        label: `${u.apellido}, ${u.nombre}`
    }));

    return (
        <Container size="xl" py="lg" className="animate-fade-in">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={2} style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 800,
                            letterSpacing: '-0.03em'
                        }}>
                            Gestión de <Text span c="red.7" inherit>Suspensiones</Text>
                        </Title>
                        <Text c="dimmed" size="sm" mt={4}>
                            Administra las restricciones temporales de servicio para los miembros.
                        </Text>
                    </div>
                </Group>

                <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
                    {/* Formulario de Creación */}
                    <Card withBorder radius="md" p="xl" style={{
                        height: 'fit-content',
                        position: 'relative',
                        overflow: 'hidden',
                        borderColor: 'var(--mantine-color-red-2)'
                    }}>
                        <LoadingOverlay visible={submitting} />
                        <Box style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            opacity: 0.05,
                            transform: 'rotate(15deg)',
                            zIndex: 0
                        }}>
                            <IconBan size={180} color="var(--mantine-color-red-9)" />
                        </Box>

                        <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                            <Group gap="xs">
                                <ThemeIcon color="red" variant="light" size="lg" radius="md">
                                    <IconBan size={20} />
                                </ThemeIcon>
                                <Text fw={700} size="lg">Nueva Suspensión</Text>
                            </Group>

                            <Select
                                label="Usuario"
                                placeholder="Seleccionar servidor..."
                                data={userOptions}
                                searchable
                                leftSection={<IconUser size={16} />}
                                value={formData.usuario_id}
                                onChange={(val) => setFormData({ ...formData, usuario_id: val || '' })}
                                required
                            />

                            <DatePickerInput
                                type="range"
                                label="Período de Suspensión"
                                placeholder="Selecciona fecha inicio y fin"
                                leftSection={<IconCalendar size={16} />}
                                value={dates}
                                onChange={setDates}
                                minDate={new Date()}
                                required
                            />

                            <TextInput
                                label="Motivo"
                                placeholder="Razón de la suspensión"
                                value={formData.motivo}
                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                required
                            />

                            <Button
                                onClick={handleSubmit as any}
                                fullWidth
                                color="red"
                                mt="md"
                                leftSection={<IconBan size={18} />}
                            >
                                Aplicar Suspensión
                            </Button>
                        </Stack>
                    </Card>

                    {/* Lista de Suspensiones */}
                    <Card withBorder radius="md" style={{ gridColumn: 'span 2' }}>
                        <Table.ScrollContainer minWidth={500}>
                            <Table verticalSpacing="md" striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Usuario</Table.Th>
                                        <Table.Th>Motivo</Table.Th>
                                        <Table.Th>Período</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {loading ? (
                                        <Table.Tr>
                                            <Table.Td colSpan={5} align="center" py="xl">
                                                <Text c="dimmed">Cargando datos...</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : suspensions.length === 0 ? (
                                        <Table.Tr>
                                            <Table.Td colSpan={5} align="center" py="xl">
                                                <Stack align="center" gap="xs" opacity={0.6}>
                                                    <IconCheck size={40} color="gray" />
                                                    <Text>No hay suspensiones registradas</Text>
                                                </Stack>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : (
                                        suspensions.map(s => {
                                            const today = dayjs().startOf('day');
                                            const end = dayjs(s.fecha_fin);
                                            const isActive = end.isSame(today) || end.isAfter(today);

                                            return (
                                                <Table.Tr key={s.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                                    <Table.Td>
                                                        <Group gap="sm">
                                                            <ThemeIcon color="gray" variant="light" radius="xl">
                                                                <IconUser size={14} />
                                                            </ThemeIcon>
                                                            <Stack gap={0}>
                                                                <Text size="sm" fw={500} c={isActive ? undefined : 'dimmed'}>
                                                                    {s.usuario?.apellido}, {s.usuario?.nombre}
                                                                </Text>
                                                            </Stack>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c="dimmed">{s.motivo}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group gap={4}>
                                                            <Text size="sm" fw={500}>
                                                                {dayjs(s.fecha_inicio).format('DD MMM')}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">→</Text>
                                                            <Text size="sm" fw={500}>
                                                                {dayjs(s.fecha_fin).format('DD MMM YYYY')}
                                                            </Text>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            color={isActive ? 'red' : 'gray'}
                                                            variant={isActive ? 'light' : 'outline'}
                                                        >
                                                            {isActive ? 'Activa' : 'Finalizada'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {isActive && (
                                                            <ActionIcon
                                                                color="red"
                                                                variant="subtle"
                                                                onClick={() => handleEndSuspension(s.id)}
                                                                title="Finalizar anticipadamente"
                                                            >
                                                                <IconTrash size={18} />
                                                            </ActionIcon>
                                                        )}
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </SimpleGrid>
            </Stack>
        </Container>
    );
};
