import { useState, useEffect } from 'react';
import {
    Center,
    Container,
    Title,
    Text,
    Select,
    Table,
    Group,
    Stack,
    Button,
    SegmentedControl,
    Loader,
    Alert,
    Paper,
    SimpleGrid,
    ThemeIcon,
    Avatar
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
    IconClipboardCheck,
    IconCalendarEvent,
    IconCheck,
    IconX,
    IconAlertCircle,
    IconUserCheck,
    IconUsersGroup,
    IconChevronRight,
    IconDeviceFloppy
} from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { attendanceService, type ServiceDay, type AttendanceRecordWithDetails } from '../../services/attendanceService';
import { supabase } from '../../services/supabaseClient';
import dayjs from 'dayjs';
import { ATTENDANCE_STATES } from '../../constants/attendance';

export default function AttendanceManager() {
    const { attendanceManagedDepartments } = useUser();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecordWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const permissions = usePermissions();

    useEffect(() => {
        if (selectedDept && selectedDate) {
            fetchData();
        }
    }, [selectedDept, selectedDate]);

    useEffect(() => {
        if (selectedService) {
            fetchAttendanceData();

            // Realtime Sync
            const channel = supabase
                .channel(`attendance:${selectedService}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'asistencias',
                        filter: `configuracion_dia_id=eq.${selectedService}`
                    },
                    (payload: any) => {
                        const newRecord = payload.new as AttendanceRecordWithDetails;
                        if (newRecord) {
                            setAttendance(prev => prev.map(rec => rec.id === newRecord.id ? { ...rec, ...newRecord } : rec));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setAttendance([]);
        }
    }, [selectedService]);

    function handleAttendanceChange(recordId: string | number, newState: string) {
        setAttendance(prev => prev.map(rec =>
            String(rec.id) === String(recordId) ? { ...rec, estado: newState } : rec
        ));
    }

    async function fetchData() {
        setLoading(true);
        try {
            if (!selectedDept || !selectedDate) return;
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const days = await attendanceService.fetchServiceDaysByDate(selectedDept, formattedDate);
            setServiceDays(days);
            if (days.length > 0) {
                setSelectedService(String(days[0].id));
            } else {
                setSelectedService(null);
            }
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error de Datos',
                message: 'No se pudo sincronizar la lista de servicios.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchAttendanceData() {
        setLoading(true);
        try {
            if (!selectedService) {
                setAttendance([]);
                return;
            }
            const data = await attendanceService.fetchAttendanceWithDetails(Number(selectedService), Number(selectedDept));
            setAttendance(data);
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error de Datos',
                message: 'No se pudo cargar la asistencia.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!selectedService || attendance.length === 0) {
            notifications.show({ title: 'Error', message: 'No hay datos para guardar.', color: 'red' });
            return;
        }
        setSaving(true);
        try {
            const recordsToUpdate = attendance.map(rec => ({
                id: rec.id,
                usuario_id: rec.usuario_id,
                configuracion_dia_id: rec.configuracion_dia_id,
                estado: rec.estado,
                justificacion: rec.justificacion || '',
                hora_registro: rec.estado === ATTENDANCE_STATES.ASISTIO && !rec.hora_registro ? new Date().toISOString() : rec.hora_registro
            }));
            await attendanceService.updateAttendanceRecords(recordsToUpdate);
            notifications.show({ title: '¡Éxito!', message: 'Asistencia guardada.', color: 'green' });
            fetchAttendanceData();
        } catch (error: any) {
            notifications.show({ title: 'Error', message: error.message, color: 'red' });
        } finally {
            setSaving(false);
        }
    }

    const filteredDepts = (attendanceManagedDepartments || []).filter(d => permissions.canManageAttendance(d.id));

    useEffect(() => {
        if (!selectedDept && filteredDepts.length > 0) {
            setSelectedDept(String(filteredDepts[0].id));
        }
    }, [filteredDepts, selectedDept]);

    if (!attendanceManagedDepartments) {
        return (
            <Center h={400}>
                <Loader color="gold" size="xl" />
            </Center>
        );
    }

    if (filteredDepts.length === 0 && !permissions.isSystemAdmin) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Sin Acceso" color="red">
                    La gestión de asistencia es exclusiva para el departamento de Servidores.
                </Alert>
            </Container>
        );
    }

    const deptOptions = filteredDepts.map(d => ({ value: String(d.id), label: d.nombre }));
    const serviceOptions = serviceDays.map(d => ({ value: String(d.id), label: d.tipo_servicio }));

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{ 
                            fontFamily: 'Inter, sans-serif', 
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Control de Asistencia ✅
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Registro y seguimiento de puntualidad para servicios</Text>
                    </Stack>
                </Group>

                <Paper p="xl" radius="xl" withBorder className="shell-glass" style={{
                    backgroundColor: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)'
                }}>
                    <Group grow align="flex-end" gap="lg">
                        <Select
                            label="Departamento"
                            placeholder="Selecciona departamento"
                            data={deptOptions}
                            value={selectedDept}
                            onChange={(val) => {
                                setSelectedDept(val);
                                setSelectedService(null);
                            }}
                            radius="md"
                            size="md"
                            leftSection={<IconUsersGroup size={18} color="var(--mantine-color-gold-6)" />}
                        />
                        <DatePickerInput
                            label="Fecha del Servicio"
                            placeholder="Seleccionar fecha"
                            value={selectedDate}
                            onChange={(val) => setSelectedDate(val as Date | null)}
                            radius="md"
                            size="md"
                            leftSection={<IconCalendarEvent size={18} color="var(--mantine-color-gold-6)" />}
                        />
                        <Select
                            label="Servicio / Turno"
                            placeholder="Selecciona servicio"
                            data={serviceOptions.map(opt => ({ 
                                ...opt, 
                                label: opt.label || 'Sin Nombre' 
                            }))}
                            value={selectedService}
                            onChange={setSelectedService}
                            disabled={!selectedDept || !selectedDate}
                            radius="md"
                            size="md"
                            leftSection={<IconChevronRight size={18} color="var(--mantine-color-gold-6)" />}
                        />
                    </Group>
                </Paper>

                {selectedDept && selectedDate && selectedService ? (
                    <Stack gap="xl">
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" fw={800} tt="uppercase">Presentes</Text>
                                        <Text fw={900} size="2.2rem" c="teal.6">
                                            {attendance.filter(a => a.estado === ATTENDANCE_STATES.ASISTIO).length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="teal" variant="light" size="xl" radius="lg">
                                        <IconCheck size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" fw={800} tt="uppercase">Ausentes</Text>
                                        <Text fw={900} size="2.2rem" c="red.6">
                                            {attendance.filter(a => a.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION).length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="red" variant="light" size="xl" radius="lg">
                                        <IconX size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" fw={800} tt="uppercase">Asignados</Text>
                                        <Text fw={900} size="2.2rem">
                                            {attendance.length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="gold" variant="light" size="xl" radius="lg">
                                        <IconUserCheck size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                        </SimpleGrid>

                        <Paper shadow="md" radius="xl" withBorder className="glass-card" style={{
                            backgroundColor: 'var(--mantine-color-body)',
                            overflow: 'hidden'
                        }}>
                            <Table.ScrollContainer minWidth={600}>
                                <Table verticalSpacing="md" highlightOnHover>
                                    <Table.Thead style={{ backgroundColor: 'var(--mantine-color-dark-filled)' }}>
                                        <Table.Tr>
                                            <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '24px' }}>Servidor / Posición</Table.Th>
                                            <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Control de Asistencia</Table.Th>
                                            <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', paddingRight: '24px' }}>Hora</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {loading ? (
                                            <Table.Tr><Table.Td colSpan={3}><Center py="xl"><Loader color="gold" type="dots" /></Center></Table.Td></Table.Tr>
                                        ) : attendance.length > 0 ? (
                                            attendance.map((record) => (
                                                <Table.Tr key={record.id}>
                                                    <Table.Td style={{ paddingLeft: '24px' }}>
                                                        <Group gap="sm">
                                                            <Avatar color="gold" radius="lg" size="md">
                                                                {record.usuario?.nombre[0]}{record.usuario?.apellido[0]}
                                                            </Avatar>
                                                            <Stack gap={0}>
                                                                <Text size="sm" fw={800}>{record.usuario?.nombre} {record.usuario?.apellido}</Text>
                                                                <Text size="xs" c="dimmed" fw={600}>{record.posicion?.nombre || 'General'}</Text>
                                                            </Stack>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Center>
                                                            <SegmentedControl
                                                                value={record.estado}
                                                                onChange={(value) => handleAttendanceChange(record.id, value)}
                                                                data={[
                                                                    { label: 'Presente', value: ATTENDANCE_STATES.ASISTIO },
                                                                    { label: 'Falta', value: ATTENDANCE_STATES.SIN_JUSTIFICACION },
                                                                    { label: 'Justificada', value: ATTENDANCE_STATES.CON_JUSTIFICACION },
                                                                ]}
                                                                color={record.estado === ATTENDANCE_STATES.ASISTIO ? 'teal' : record.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION ? 'red' : 'blue'}
                                                                radius="xl"
                                                                size="sm"
                                                                styles={{
                                                                    root: { backgroundColor: 'var(--mantine-color-gray-1)' },
                                                                    label: { fontWeight: 700 }
                                                                }}
                                                            />
                                                        </Center>
                                                    </Table.Td>
                                                    <Table.Td style={{ paddingRight: '24px' }} align="right">
                                                        <Text size="xs" fw={700} c="dimmed">
                                                            {record.hora_registro ? dayjs(record.hora_registro).format('HH:mm') : '--:--'}
                                                        </Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))
                                        ) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={3}>
                                                    <Center py="xl">
                                                        <Stack align="center" gap="xs" opacity={0.6}>
                                                            <IconAlertCircle size={40} />
                                                            <Text fw={600}>No hay servidores asignados.</Text>
                                                        </Stack>
                                                    </Center>
                                                </Table.Td>
                                            </Table.Tr>
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        </Paper>

                        <Group justify="flex-end">
                            <Button
                                leftSection={<IconDeviceFloppy size={20} />}
                                onClick={handleSave}
                                loading={saving}
                                size="lg"
                                radius="xl"
                                className="btn-premium"
                            >
                                Guardar Asistencia
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Paper p="xl" radius="xl" withBorder style={{ 
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        borderStyle: 'dashed'
                    }}>
                        <Center py="dxl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gold">
                                    <IconClipboardCheck size={30} />
                                </ThemeIcon>
                                <Stack gap={4} align="center">
                                    <Text fw={800} size="lg">Panel de Control de Asistencia</Text>
                                    <Text c="dimmed" maw={400} ta="center" size="sm" fw={500}>
                                        Selecciona un departamento, fecha y servicio para comenzar.
                                    </Text>
                                </Stack>
                            </Stack>
                        </Center>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}
