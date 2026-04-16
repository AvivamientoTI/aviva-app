import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { suspensionService, type Suspension } from '../../services/suspensionService';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
    Container,
    Title,
    Group,
    Stack,
    Select,
    Button,
    Table,
    Text,
    Badge,
    LoadingOverlay,
    ThemeIcon,
    SimpleGrid,
    Paper,
    Textarea,
    Center,
    Avatar,
    Loader,
    Alert,
    Box,
    ActionIcon
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
    IconTrash,
    IconScale,
    IconHistory,
    IconCheck,
    IconAlertCircle,
    IconUser,
    IconCalendar,
    IconBan
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export default function SuspensionManager() {
    const { isServidoresAdmin } = useUser();
    const permissions = usePermissions();
    // Acceso: administradores del sistema O líderes/sublíderes de cualquier departamento
    const isAuthorized = isServidoresAdmin()
        || permissions.isSystemAdmin
        || permissions.isLiderOrSubliderServidores;

    const [suspensions, setSuspensions] = useState<Suspension[]>([]);
    const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        usuario_id: '',
        motivo: '',
        fecha_inicio: null as Date | null,
        fecha_fin: null as Date | null
    });

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
                setUsers(usersData.data.map(u => ({
                    value: String(u.id),
                    label: `${u.apellido}, ${u.nombre}`
                })));
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

        if (!formData.usuario_id || !formData.fecha_inicio || !formData.motivo) {
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
                fecha_inicio: dayjs(formData.fecha_inicio).format('YYYY-MM-DD'),
                fecha_fin: formData.fecha_fin ? dayjs(formData.fecha_fin).format('YYYY-MM-DD') : null,
                motivo: formData.motivo
            });

            notifications.show({
                title: '¡Éxito!',
                message: 'Suspensión registrada correctamente',
                color: 'green',
                icon: <IconCheck size={18} />
            });

            setFormData({ usuario_id: '', motivo: '', fecha_inicio: null, fecha_fin: null });
            await loadData();
        } catch (err) {
            console.error(err);
            notifications.show({ title: 'Error', message: 'No se pudo registrar la suspensión', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta suspensión?')) return;
        try {
            await suspensionService.delete(id);
            notifications.show({ title: 'Eliminado', message: 'Registro borrado', color: 'blue' });
            await loadData();
        } catch (err) {
            notifications.show({ title: 'Error', message: 'No se pudo eliminar', color: 'red' });
        }
    };

    if (!isAuthorized) {
        return (
            <Container p="xl">
                <Alert color="red" icon={<IconAlertCircle size={16} />} title="Acceso Denegado">
                    No tienes permisos para esta sección.
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end">
                    <Stack gap={0}>
                        <Title order={1} style={{ 
                            fontFamily: 'Inter, sans-serif', 
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Gestión de Suspensiones ⚖️
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Administración de sanciones y periodos de inactividad</Text>
                    </Stack>
                </Group>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    {/* Form Section */}
                    <Stack gap="lg">
                        <Paper p="xl" radius="xl" withBorder className="glass-card">
                            <LoadingOverlay visible={submitting} overlayProps={{ radius: 'xl', blur: 2 }} />
                            <Stack gap="md">
                                <Group gap="sm">
                                    <ThemeIcon color="red" variant="light" size="lg" radius="md">
                                        <IconScale size={20} />
                                    </ThemeIcon>
                                    <Text fw={800} size="lg">Registrar Nueva Sanción</Text>
                                </Group>

                                <Stack component="form" onSubmit={handleSubmit} gap="md">
                                    <Select
                                        label="Servidor"
                                        placeholder="Busca al servidor..."
                                        data={users}
                                        value={formData.usuario_id}
                                        onChange={(val) => setFormData({ ...formData, usuario_id: val || '' })}
                                        searchable
                                        radius="md"
                                        leftSection={<IconUser size={18} />}
                                    />

                                    <Group grow>
                                        <DatePickerInput
                                            label="Fecha Inicio"
                                            placeholder="Seleccionar"
                                            value={formData.fecha_inicio}
                                            onChange={(val) => setFormData({ ...formData, fecha_inicio: val as Date | null })}
                                            radius="md"
                                            leftSection={<IconCalendar size={18} />}
                                        />
                                        <DatePickerInput
                                            label="Fecha Fin"
                                            placeholder="Seleccionar"
                                            value={formData.fecha_fin}
                                            onChange={(val) => setFormData({ ...formData, fecha_fin: val as Date | null })}
                                            radius="md"
                                            leftSection={<IconCalendar size={18} />}
                                        />
                                    </Group>

                                    <Textarea
                                        label="Motivo o Descripción"
                                        placeholder="Escribe el motivo de la suspensión..."
                                        minRows={3}
                                        value={formData.motivo}
                                        onChange={(e) => setFormData({ ...formData, motivo: e.currentTarget.value })}
                                        radius="md"
                                    />

                                    <Button 
                                        type="submit" 
                                        fullWidth 
                                        size="md" 
                                        radius="xl" 
                                        color="red"
                                        leftSection={<IconBan size={18} />}
                                        style={{ marginTop: '10px' }}
                                    >
                                        Aplicar Suspensión
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>

                        {/* Stats / Info Card */}
                        <Paper p="xl" radius="xl" withBorder className="shell-glass">
                            <Group justify="space-between">
                                <Stack gap={0}>
                                    <Text size="xs" c="dimmed" fw={800} tt="uppercase">Impacto en el Servicio</Text>
                                    <Text fw={800} size="xl">Resumen de Cumplimiento</Text>
                                </Stack>
                                <ThemeIcon size={50} radius="xl" variant="light" color="gold">
                                    <IconHistory size={26} />
                                </ThemeIcon>
                            </Group>
                            <Text size="sm" mt="md" c="dimmed" fw={500}>
                                Las suspensiones afectan directamente la disponibilidad del personal en el calendario. 
                                Asegúrate de registrar periodos justos y bien documentados.
                            </Text>
                        </Paper>
                    </Stack>

                    {/* History Section */}
                    <Paper p={0} radius="xl" withBorder className="glass-card" style={{ overflow: 'hidden' }}>
                        <Box p="xl" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <ThemeIcon color="gold" variant="light" size="lg" radius="md">
                                        <IconHistory size={20} />
                                    </ThemeIcon>
                                    <Text fw={800} size="lg">Historial de Suspensiones</Text>
                                </Group>
                                <Badge variant="dot" color="red" size="lg" radius="sm">Histórico</Badge>
                            </Group>
                        </Box>

                        <Table.ScrollContainer minWidth={500}>
                            <Table verticalSpacing="md" highlightOnHover>
                                <Table.Thead bg="var(--mantine-color-gray-0)">
                                    <Table.Tr>
                                        <Table.Th style={{ paddingLeft: '24px' }}>Servidor</Table.Th>
                                        <Table.Th>Vigencia</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th style={{ paddingRight: '24px' }}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {loading ? (
                                        <Table.Tr><Table.Td colSpan={4}><Center py="xl"><Loader type="dots" color="gold" /></Center></Table.Td></Table.Tr>
                                    ) : suspensions.length === 0 ? (
                                        <Table.Tr>
                                            <Table.Td colSpan={4}>
                                                <Center py="xl">
                                                    <Stack align="center" gap="xs" opacity={0.5}>
                                                        <IconCheck size={40} />
                                                        <Text fw={600}>No hay registros vigentes</Text>
                                                    </Stack>
                                                </Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : (
                                        suspensions.map(s => {
                                            const today = dayjs().startOf('day');
                                            const end = s.fecha_fin ? dayjs(s.fecha_fin).endOf('day') : null;
                                            const isActive = !end || end.isAfter(today) || end.isSame(today);

                                            return (
                                                <Table.Tr key={s.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                                    <Table.Td style={{ paddingLeft: '24px' }}>
                                                        <Group gap="sm">
                                                            <Avatar radius="lg" color="red" size="sm">
                                                                {s.usuario?.nombre[0]}{s.usuario?.apellido[0]}
                                                            </Avatar>
                                                            <Stack gap={0}>
                                                                <Text size="sm" fw={800}>{s.usuario?.apellido}, {s.usuario?.nombre}</Text>
                                                                <Text size="xs" c="dimmed" fw={600} maw={150} truncate="end">{s.motivo}</Text>
                                                            </Stack>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Stack gap={0}>
                                                            <Text size="xs" fw={700}>
                                                                {dayjs(s.fecha_inicio).format('DD/MM/YY')} al
                                                            </Text>
                                                            <Text size="xs" fw={700}>
                                                                {s.fecha_fin ? dayjs(s.fecha_fin).format('DD/MM/YY') : 'Indefinido'}
                                                            </Text>
                                                        </Stack>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge 
                                                            color={isActive ? 'red' : 'gray'} 
                                                            variant={isActive ? 'filled' : 'light'}
                                                            radius="sm"
                                                            size="sm"
                                                        >
                                                            {isActive ? 'Activa' : 'Expirada'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td style={{ paddingRight: '24px' }}>
                                                        <ActionIcon 
                                                            color="red" 
                                                            variant="subtle" 
                                                            onClick={() => handleDelete(s.id)}
                                                            radius="md"
                                                        >
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Paper>
                </SimpleGrid>
            </Stack>
        </Container>
    );
};
