import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Stack, Group, Paper, Select, Table, Badge,
    Center, Loader, Avatar, SimpleGrid, ThemeIcon, Box, SegmentedControl,
    Divider, Alert
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
    IconClipboardList, IconCalendarEvent, IconChevronRight,
    IconCheck, IconX, IconAlertCircle, IconUsers, IconBuildingCommunity,
    IconFileText
} from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { attendanceService } from '../../services/attendanceService';
import { supabase } from '../../services/supabaseClient';
import { ATTENDANCE_STATES } from '../../constants/attendance';
import dayjs from 'dayjs';

type FilterState = 'todos' | 'ausentes' | 'justificados';

interface RegistryRecord {
    id: string | number;
    usuario_id: number;
    estado: string | null;
    justificacion: string | null;
    hora_registro: string | null;
    registrado_por: number | null;
    registrado_por_nombre: string | null;
    usuario: { nombre: string; apellido: string } | null;
    posicion: { nombre: string } | null;
}

export default function AttendanceRegistry() {
    const { attendanceManagedDepartments, managedDepartments } = useUser();
    const permissions = usePermissions();

    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceDays, setServiceDays] = useState<any[]>([]);
    const [records, setRecords] = useState<RegistryRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<FilterState>('ausentes');

    // All depts the user can see (union of managed + attendance managed)
    const allManagedDepts = (() => {
        if (permissions.isSystemAdmin) return null; // load all from DB
        const map = new Map<number, { id: number; nombre: string }>();
        [...(managedDepartments || []), ...(attendanceManagedDepartments || [])].forEach(d => {
            if (d.id) map.set(d.id, d);
        });
        return Array.from(map.values());
    })();

    const [allDepts, setAllDepts] = useState<{ id: number; nombre: string }[]>([]);

    useEffect(() => {
        if (permissions.isSystemAdmin) {
            supabase.from('departamentos').select('id, nombre').order('nombre')
                .then(({ data }) => { if (data) setAllDepts(data); });
        } else if (allManagedDepts) {
            setAllDepts(allManagedDepts);
        }
    }, [permissions.isSystemAdmin, managedDepartments?.length, attendanceManagedDepartments?.length]);

    useEffect(() => {
        if (!selectedDept && allDepts.length > 0) {
            setSelectedDept(String(allDepts[0].id));
        }
    }, [allDepts]);

    useEffect(() => {
        if (selectedDept && selectedDate) {
            fetchServiceDays();
        }
    }, [selectedDept, selectedDate]);

    useEffect(() => {
        if (selectedService) fetchRecords();
        else setRecords([]);
    }, [selectedService]);

    async function fetchServiceDays() {
        if (!selectedDept || !selectedDate) return;
        const date = dayjs(selectedDate).format('YYYY-MM-DD');
        const days = await attendanceService.fetchServiceDaysByDate(selectedDept, date);
        setServiceDays(days);
        if (days.length > 0) setSelectedService(String(days[0].id));
        else setSelectedService(null);
    }

    async function fetchRecords() {
        if (!selectedService) return;
        setLoading(true);
        try {
            const data = await attendanceService.fetchAttendanceRegistry(
                Number(selectedService),
                Number(selectedDept)
            );
            setRecords(data as RegistryRecord[]);
        } finally {
            setLoading(false);
        }
    }

    const deptOptions = allDepts.map(d => ({ value: String(d.id), label: d.nombre }));
    const serviceOptions = serviceDays.map(d => ({ value: String(d.id), label: d.tipo_servicio || 'Servicio' }));

    const filteredRecords = [...records]
        .sort((a, b) => `${a.usuario?.nombre} ${a.usuario?.apellido}`.localeCompare(`${b.usuario?.nombre} ${b.usuario?.apellido}`))
        .filter(r => {
            if (filter === 'ausentes') return r.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION;
            if (filter === 'justificados') return r.estado === ATTENDANCE_STATES.CON_JUSTIFICACION;
            return true;
        });

    const totalPresentes = records.filter(r => r.estado === ATTENDANCE_STATES.ASISTIO).length;
    const totalAusentes = records.filter(r => r.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION).length;
    const totalJustificados = records.filter(r => r.estado === ATTENDANCE_STATES.CON_JUSTIFICACION).length;
    const totalSinRegistro = records.filter(r => !r.estado).length;

    const estadoBadge = (estado: string | null) => {
        if (estado === ATTENDANCE_STATES.ASISTIO) return <Badge color="teal" variant="filled" radius="sm" size="sm">Presente</Badge>;
        if (estado === ATTENDANCE_STATES.SIN_JUSTIFICACION) return <Badge color="red" variant="filled" radius="sm" size="sm">Falta</Badge>;
        if (estado === ATTENDANCE_STATES.CON_JUSTIFICACION) return <Badge color="orange" variant="filled" radius="sm" size="sm">Justificada</Badge>;
        return <Badge color="gray" variant="light" radius="sm" size="sm">Sin registro</Badge>;
    };

    if (allDepts.length === 0 && !permissions.isSystemAdmin) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Sin Acceso" color="red">
                    No tienes departamentos asignados para consultar el registro de asistencia.
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Registro de Asistencia
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Historial de ausencias y justificaciones por actividad</Text>
                    </Stack>
                </Group>

                {/* Filtros */}
                <Paper p="xl" radius="xl" withBorder className="shell-glass">
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                        <Select
                            label="Departamento"
                            data={deptOptions}
                            value={selectedDept}
                            onChange={setSelectedDept}
                            leftSection={<IconBuildingCommunity size={18} />}
                            radius="md"
                            size="md"
                            styles={{ label: { fontWeight: 700 } }}
                        />
                        <DatePickerInput
                            label="Fecha del Servicio"
                            value={selectedDate}
                            onChange={val => setSelectedDate(val as Date | null)}
                            leftSection={<IconCalendarEvent size={18} color="var(--mantine-color-gold-6)" />}
                            radius="md"
                            size="md"
                            styles={{ label: { fontWeight: 700 } }}
                        />
                        <Select
                            label="Servicio / Turno"
                            data={serviceOptions}
                            value={selectedService}
                            onChange={setSelectedService}
                            disabled={serviceDays.length === 0}
                            placeholder={serviceDays.length === 0 ? 'Sin servicios en esta fecha' : 'Seleccionar'}
                            leftSection={<IconChevronRight size={18} color="var(--mantine-color-gold-6)" />}
                            radius="md"
                            size="md"
                            styles={{ label: { fontWeight: 700 } }}
                        />
                    </SimpleGrid>
                </Paper>

                {selectedService && records.length > 0 && (
                    <>
                        {/* KPIs */}
                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Presentes</Text>
                                        <Text fw={900} size="2rem" c="teal.6">{totalPresentes}</Text>
                                        <Text size="xs" c="dimmed" fw={600}>{records.length > 0 ? Math.round((totalPresentes / records.length) * 100) : 0}% del total</Text>
                                    </Stack>
                                    <ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconCheck size={22} /></ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Ausentes</Text>
                                        <Text fw={900} size="2rem" c="red.6">{totalAusentes}</Text>
                                        <Text size="xs" c="dimmed" fw={600}>Sin justificación</Text>
                                    </Stack>
                                    <ThemeIcon size="xl" radius="lg" variant="light" color="red"><IconX size={22} /></ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Justificadas</Text>
                                        <Text fw={900} size="2rem" c="orange.6">{totalJustificados}</Text>
                                        <Text size="xs" c="dimmed" fw={600}>Con motivo registrado</Text>
                                    </Stack>
                                    <ThemeIcon size="xl" radius="lg" variant="light" color="orange"><IconFileText size={22} /></ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder className="glass-card">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asignados</Text>
                                        <Text fw={900} size="2rem">{records.length}</Text>
                                        <Text size="xs" c="dimmed" fw={600}>{totalSinRegistro > 0 ? `${totalSinRegistro} sin marcar` : 'Todos marcados'}</Text>
                                    </Stack>
                                    <ThemeIcon size="xl" radius="lg" variant="light" color="blue"><IconUsers size={22} /></ThemeIcon>
                                </Group>
                            </Paper>
                        </SimpleGrid>

                        {/* Tabla */}
                        <Paper radius="xl" withBorder className="glass-card" style={{ overflow: 'hidden' }}>
                            {/* Filtro de estado */}
                            <Box p="xl" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                                    <Group gap="sm">
                                        <ThemeIcon color="gold" variant="light" size="lg" radius="md">
                                            <IconClipboardList size={18} />
                                        </ThemeIcon>
                                        <Stack gap={0}>
                                            <Text fw={800} size="lg">Detalle de Asistencia</Text>
                                            <Text size="xs" c="dimmed" fw={600}>
                                                {dayjs(selectedDate).format('dddd D [de] MMMM YYYY')} · {serviceOptions.find(s => s.value === selectedService)?.label}
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <SegmentedControl
                                        value={filter}
                                        onChange={val => setFilter(val as FilterState)}
                                        data={[
                                            { label: `Todos (${records.length})`, value: 'todos' },
                                            { label: `Ausentes (${totalAusentes})`, value: 'ausentes' },
                                            { label: `Justificados (${totalJustificados})`, value: 'justificados' },
                                        ]}
                                        radius="xl"
                                        size="sm"
                                        styles={{ root: { backgroundColor: 'var(--mantine-color-gray-1)' }, label: { fontWeight: 700 } }}
                                    />
                                </Group>
                            </Box>

                            <Table.ScrollContainer minWidth={500}>
                                <Table verticalSpacing="md" highlightOnHover>
                                    <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                                        <Table.Tr>
                                            <Table.Th style={{ paddingLeft: 24, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mantine-color-gray-6)' }}>Servidor</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mantine-color-gray-6)' }}>Estado</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mantine-color-gray-6)' }}>Justificación</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mantine-color-gray-6)' }}>Registrado por</Table.Th>
                                            <Table.Th style={{ paddingRight: 24, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mantine-color-gray-6)', textAlign: 'right' }}>Hora</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {loading ? (
                                            <Table.Tr><Table.Td colSpan={4}><Center py="xl"><Loader color="gold" type="dots" /></Center></Table.Td></Table.Tr>
                                        ) : filteredRecords.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td colSpan={4}>
                                                    <Center py="xl">
                                                        <Stack align="center" gap="xs" opacity={0.5}>
                                                            <IconCheck size={36} />
                                                            <Text fw={700} size="sm">
                                                                {filter === 'ausentes' ? 'No hay ausencias registradas' :
                                                                 filter === 'justificados' ? 'No hay justificaciones registradas' :
                                                                 'Sin registros para este servicio'}
                                                            </Text>
                                                        </Stack>
                                                    </Center>
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : filteredRecords.map(r => (
                                            <Table.Tr key={r.id} style={{
                                                backgroundColor: r.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION
                                                    ? 'var(--mantine-color-red-0)'
                                                    : r.estado === ATTENDANCE_STATES.CON_JUSTIFICACION
                                                    ? 'var(--mantine-color-orange-0)'
                                                    : undefined
                                            }}>
                                                <Table.Td style={{ paddingLeft: 24 }}>
                                                    <Group gap="sm">
                                                        <Avatar color="gold" radius="lg" size="sm">
                                                            {r.usuario?.nombre[0]}{r.usuario?.apellido[0]}
                                                        </Avatar>
                                                        <Stack gap={0}>
                                                            <Text size="sm" fw={800}>{r.usuario?.nombre} {r.usuario?.apellido}</Text>
                                                            <Text size="xs" c="dimmed" fw={600}>{r.posicion?.nombre || 'General'}</Text>
                                                        </Stack>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>{estadoBadge(r.estado)}</Table.Td>
                                                <Table.Td style={{ maxWidth: 320 }}>
                                                    {r.estado === ATTENDANCE_STATES.CON_JUSTIFICACION ? (
                                                        r.justificacion ? (
                                                            <Group gap="xs" align="flex-start">
                                                                <IconFileText size={14} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0, marginTop: 2 }} />
                                                                <Text size="sm" fw={600} c="orange.8">{r.justificacion}</Text>
                                                            </Group>
                                                        ) : (
                                                            <Text size="xs" c="dimmed" fw={600} fs="italic">Sin motivo especificado</Text>
                                                        )
                                                    ) : (
                                                        <Text size="xs" c="dimmed">—</Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {r.registrado_por_nombre ? (
                                                        <Group gap="xs" wrap="nowrap">
                                                            <Avatar color="gold" radius="xl" size="xs">
                                                                {r.registrado_por_nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                            </Avatar>
                                                            <Text size="xs" fw={600}>{r.registrado_por_nombre}</Text>
                                                        </Group>
                                                    ) : (
                                                        <Text size="xs" c="dimmed" fs="italic">—</Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td style={{ paddingRight: 24, textAlign: 'right' }}>
                                                    <Text size="xs" fw={700} c="dimmed">
                                                        {r.hora_registro ? dayjs(r.hora_registro).format('h:mm A') : '—'}
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>

                            {filteredRecords.length > 0 && (
                                <>
                                    <Divider />
                                    <Box p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                                        <Group justify="flex-end" gap="xl">
                                            <Text size="xs" fw={700} c="dimmed">
                                                Mostrando {filteredRecords.length} de {records.length} registros
                                            </Text>
                                        </Group>
                                    </Box>
                                </>
                            )}
                        </Paper>
                    </>
                )}

                {/* Empty state */}
                {(!selectedService || records.length === 0) && !loading && (
                    <Paper p="xl" radius="xl" withBorder style={{ borderStyle: 'dashed', backgroundColor: 'var(--mantine-color-gray-0)' }}>
                        <Center py="xl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gold">
                                    <IconClipboardList size={30} />
                                </ThemeIcon>
                                <Stack gap={4} align="center">
                                    <Text fw={800} size="lg">Registro de Asistencia</Text>
                                    <Text c="dimmed" maw={400} ta="center" size="sm" fw={500}>
                                        {!selectedService
                                            ? 'Selecciona un departamento, fecha y servicio para consultar el registro.'
                                            : 'No hay registros de asistencia para este servicio.'}
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
