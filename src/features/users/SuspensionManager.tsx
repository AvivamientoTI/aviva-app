import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { suspensionService, type Suspension } from '../../services/suspensionService';
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
    Center,
    Avatar,
    Loader,
    Alert,
    Box,
    ActionIcon,
    Tabs
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
    IconBan,
    IconUserOff
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

type FormData = {
    usuario_id: string | null;
    fecha_inicio: Date | null;
    fecha_fin: Date | null;
};

export default function SuspensionManager() {
    const permissions = usePermissions();
    const canWrite = permissions.isSystemAdmin;
    const isAuthorized = canWrite || permissions.isLiderOrSublider || permissions.isLiderOrSubliderServidores;

    const [suspensions, setSuspensions] = useState<Suspension[]>([]);
    const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingSuspension, setSubmittingSuspension] = useState(false);
    const [submittingInactivo, setSubmittingInactivo] = useState(false);

    const [suspensionForm, setSuspensionForm] = useState<FormData>({
        usuario_id: null, fecha_inicio: null, fecha_fin: null
    });

    const [inactivoForm, setInactivoForm] = useState<FormData>({
        usuario_id: null, fecha_inicio: null, fecha_fin: null
    });

    useEffect(() => {
        if (isAuthorized) loadData();
    }, [isAuthorized]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [suspData, usersData] = await Promise.all([
                suspensionService.getAllSuspensions(),
                supabase.from('usuarios').select('id, nombre, apellido').order('nombre')
            ]);
            setSuspensions(suspData);
            if (usersData.data) {
                setUsers(usersData.data.map(u => ({
                    value: String(u.id),
                    label: `${u.nombre} ${u.apellido}`
                })));
            }
        } catch (err) {
            console.error(err);
            notifications.show({ title: 'Error', message: 'No se pudieron cargar los datos', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (tipo: 'suspension' | 'inactivo') => {
        const form = tipo === 'suspension' ? suspensionForm : inactivoForm;
        const setSubmitting = tipo === 'suspension' ? setSubmittingSuspension : setSubmittingInactivo;
        const resetForm = tipo === 'suspension' ? setSuspensionForm : setInactivoForm;

        if (!form.usuario_id || !form.fecha_inicio) {
            notifications.show({ title: 'Campos incompletos', message: 'Completa los campos requeridos', color: 'yellow' });
            return;
        }

        setSubmitting(true);
        try {
            await suspensionService.create({
                usuario_id: Number(form.usuario_id),
                fecha_inicio: dayjs(form.fecha_inicio).format('YYYY-MM-DD'),
                fecha_fin: form.fecha_fin ? dayjs(form.fecha_fin).format('YYYY-MM-DD') : null,
                tipo,
            } as any);

            notifications.show({
                title: '¡Éxito!',
                message: tipo === 'suspension' ? 'Suspensión registrada correctamente' : 'Inactividad registrada correctamente',
                color: 'green',
                icon: <IconCheck size={18} />
            });

            resetForm({ usuario_id: null, fecha_inicio: null, fecha_fin: null });
            await loadData();
        } catch (err) {
            notifications.show({ title: 'Error', message: 'No se pudo registrar el registro', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
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

    const suspensionRecords = suspensions.filter(s => s.tipo === 'suspension');
    const inactivoRecords = suspensions.filter(s => s.tipo === 'inactivo');

    const renderForm = (tipo: 'suspension' | 'inactivo') => {
        const form = tipo === 'suspension' ? suspensionForm : inactivoForm;
        const setForm = tipo === 'suspension' ? setSuspensionForm : setInactivoForm;
        const submitting = tipo === 'suspension' ? submittingSuspension : submittingInactivo;
        const isSuspension = tipo === 'suspension';

        return (
            <Paper p="xl" radius="xl" withBorder className="glass-card">
                <LoadingOverlay visible={submitting} overlayProps={{ radius: 'xl', blur: 2 }} />
                <Stack gap="md">
                    <Group gap="sm">
                        <ThemeIcon color={isSuspension ? 'red' : 'orange'} variant="light" size="lg" radius="md">
                            {isSuspension ? <IconScale size={20} /> : <IconUserOff size={20} />}
                        </ThemeIcon>
                        <Text fw={800} size="lg">{isSuspension ? 'Registrar Suspensión' : 'Registrar Inactividad'}</Text>
                    </Group>

                    <Select
                        label="Servidor"
                        placeholder="Busca al servidor..."
                        data={users}
                        value={form.usuario_id}
                        onChange={(val) => setForm({ ...form, usuario_id: val })}
                        searchable
                        radius="md"
                        leftSection={<IconUser size={18} />}
                    />

                    <Group grow>
                        <DatePickerInput
                            label="Fecha Inicio"
                            placeholder="Seleccionar"
                            value={form.fecha_inicio}
                            onChange={(val) => setForm({ ...form, fecha_inicio: val as Date | null, fecha_fin: null })}
                            radius="md"
                            leftSection={<IconCalendar size={18} />}
                        />
                        <DatePickerInput
                            label={`Fecha Fin ${!isSuspension ? '(dejar vacío = indefinido)' : ''}`}
                            placeholder={form.fecha_inicio ? 'Seleccionar' : '— Primero elige fecha inicio —'}
                            value={form.fecha_fin}
                            onChange={(val) => setForm({ ...form, fecha_fin: val as Date | null })}
                            radius="md"
                            leftSection={<IconCalendar size={18} />}
                            disabled={!form.fecha_inicio}
                            minDate={form.fecha_inicio || undefined}
                        />
                    </Group>

                    <Button
                        fullWidth size="md" radius="xl"
                        color={isSuspension ? 'red' : 'orange'}
                        leftSection={isSuspension ? <IconBan size={18} /> : <IconUserOff size={18} />}
                        style={{ marginTop: '8px' }}
                        onClick={() => handleSubmit(tipo)}
                        loading={submitting}
                    >
                        {isSuspension ? 'Aplicar Suspensión' : 'Registrar Inactividad'}
                    </Button>
                </Stack>
            </Paper>
        );
    };

    const renderHistory = (records: Suspension[], color: string) => (
        <Paper p={0} radius="xl" withBorder className="glass-card" style={{ overflow: 'hidden' }}>
            <Box p="xl" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                    <Group gap="sm">
                        <ThemeIcon color="gold" variant="light" size="lg" radius="md">
                            <IconHistory size={20} />
                        </ThemeIcon>
                        <Text fw={800} size="lg">Historial</Text>
                    </Group>
                    <Badge variant="dot" color={color} size="lg" radius="sm">{records.length} registros</Badge>
                </Group>
            </Box>
            <Table.ScrollContainer minWidth={420}>
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
                        ) : records.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={4}>
                                    <Center py="xl">
                                        <Stack align="center" gap="xs" opacity={0.5}>
                                            <IconCheck size={40} />
                                            <Text fw={600}>Sin registros</Text>
                                        </Stack>
                                    </Center>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            records.map(s => {
                                const today = dayjs().startOf('day');
                                const end = s.fecha_fin ? dayjs(s.fecha_fin).endOf('day') : null;
                                const isActive = !end || end.isAfter(today) || end.isSame(today);
                                return (
                                    <Table.Tr key={s.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                        <Table.Td style={{ paddingLeft: '24px' }}>
                                            <Group gap="sm">
                                                <Avatar radius="lg" color={color} size="sm">
                                                    {s.usuario?.nombre[0]}{s.usuario?.apellido[0]}
                                                </Avatar>
                                                <Text size="sm" fw={800}>{s.usuario?.nombre} {s.usuario?.apellido}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={0}>
                                                <Text size="xs" fw={700}>{dayjs(s.fecha_inicio).format('DD/MM/YY')} al</Text>
                                                <Text size="xs" fw={700}>{s.fecha_fin ? dayjs(s.fecha_fin).format('DD/MM/YY') : 'Indefinido'}</Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={isActive ? color : 'gray'} variant={isActive ? 'filled' : 'light'} radius="sm" size="sm">
                                                {isActive ? 'Activo' : 'Expirado'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ paddingRight: '24px' }}>
                                            {canWrite && (
                                                <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(s.id)} radius="md">
                                                    <IconTrash size={16} />
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
        </Paper>
    );

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
                            Suspensiones e Inactividad
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Gestión de suspensiones y registro de servidores inactivos</Text>
                    </Stack>
                </Group>

                <Tabs defaultValue="suspensiones" radius="xl">
                    <Tabs.List mb="xl">
                        <Tabs.Tab value="suspensiones" leftSection={<IconScale size={16} />} styles={{ tab: { fontWeight: 700 } }}>
                            Suspensiones
                        </Tabs.Tab>
                        <Tabs.Tab value="inactivos" leftSection={<IconUserOff size={16} />} styles={{ tab: { fontWeight: 700 } }}>
                            Inactividad
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="suspensiones">
                        <SimpleGrid cols={{ base: 1, md: canWrite ? 2 : 1 }} spacing="xl">
                            {canWrite && renderForm('suspension')}
                            {renderHistory(suspensionRecords, 'red')}
                        </SimpleGrid>
                    </Tabs.Panel>

                    <Tabs.Panel value="inactivos">
                        <SimpleGrid cols={{ base: 1, md: canWrite ? 2 : 1 }} spacing="xl">
                            {canWrite && renderForm('inactivo')}
                            {renderHistory(inactivoRecords, 'orange')}
                        </SimpleGrid>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
