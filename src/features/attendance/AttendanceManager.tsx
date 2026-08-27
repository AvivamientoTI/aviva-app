import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box,
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
    Progress,
    SimpleGrid,
    ThemeIcon,
    Avatar,
    Textarea
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

    IconChevronRight,
    IconDeviceFloppy
} from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { attendanceService, type ServiceDay, type AttendanceRecordWithDetails } from '../../services/attendanceService';
import { supabase } from '../../services/supabaseClient';
import { IconBell, IconLock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { ATTENDANCE_STATES, JUSTIFICATION_TYPES, type JustificationType } from '../../constants/attendance';

const UNMARKED_ATTENDANCE_VALUE = '__sin_marcar__';
const UNMARKED_SUNDAY_TURN_VALUE = '__sin_turno__';

export default function AttendanceManager() {
    const { attendanceManagedDepartments, userProfile } = useUser();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecordWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [cultosTime, setCultosTime] = useState<Record<string | number, string>>({});
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [noServicesFound, setNoServicesFound] = useState(false);
    const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);

    const permissions = usePermissions();
    const queryClient = useQueryClient();
    const isDirty = useRef(false);
    const notifiedServices = useRef<Set<string>>(new Set());

    const draftKey = selectedService ? `attendance_draft_${selectedService}` : null;

    function saveDraft(updatedAttendance: AttendanceRecordWithDetails[], updatedCultosTime: Record<string | number, string>) {
        if (!draftKey) return;
        try {
            localStorage.setItem(draftKey, JSON.stringify({ attendance: updatedAttendance, cultosTime: updatedCultosTime }));
        } catch { /* quota exceeded — ignore */ }
    }

    function clearDraft() {
        if (draftKey) localStorage.removeItem(draftKey);
    }

    function loadDraft(): { attendance: AttendanceRecordWithDetails[]; cultosTime: Record<string | number, string> } | null {
        if (!draftKey) return null;
        try {
            const raw = localStorage.getItem(draftKey);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    useEffect(() => {
        if (selectedDept && selectedDate) {
            fetchData();
        }
    }, [selectedDept, selectedDate]);

    // Persiste el borrador cuando cualquiera de los dos estados cambia
    useEffect(() => {
        if (isDirty.current && attendance.length > 0) {
            saveDraft(attendance, cultosTime);
        }
    }, [attendance, cultosTime]);

    useEffect(() => {
        if (selectedService) {
            fetchAttendanceData();
        } else {
            setAttendance([]);
        }
    }, [selectedService]);

    function handleAttendanceChange(recordId: string | number, newState: string) {
        isDirty.current = true;
        setHasUnsavedDraft(true);
        const now = new Date().toISOString();
        setAttendance(prev => prev.map(rec =>
            String(rec.id) === String(recordId)
                ? { ...rec, estado: newState, hora_registro: now }
                : rec
        ));
        if (newState !== ATTENDANCE_STATES.ASISTIO) {
            setCultosTime(prev => { const n = { ...prev }; delete n[recordId]; return n; });
        }
    }

    function handleJustificationTypeChange(recordId: string | number, tipo: string | null) {
        isDirty.current = true;
        setAttendance(prev => prev.map(rec =>
            String(rec.id) === String(recordId)
                ? { ...rec, tipo_justificacion: tipo as JustificationType | null, justificacion: tipo !== 'otro' ? null : rec.justificacion }
                : rec
        ));
    }

    function handleJustificationChange(recordId: string | number, text: string) {
        isDirty.current = true;
        setAttendance(prev => prev.map(rec =>
            String(rec.id) === String(recordId) ? { ...rec, justificacion: text } : rec
        ));
    }

    async function fetchData() {
        setLoading(true);
        setFetchError(null);
        setNoServicesFound(false);
        try {
            if (!selectedDept || !selectedDate) return;
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const days = await attendanceService.fetchServiceDaysByDate(selectedDept, formattedDate);
            setServiceDays(days);
            if (days.length > 0) {
                setSelectedService(String(days[0].id));
            } else {
                setSelectedService(null);
                setNoServicesFound(true);
            }
        } catch (error) {
            console.error(error);
            setFetchError('No se pudo sincronizar la lista de servicios. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchAttendanceData() {
        setLoading(true);
        setFetchError(null);
        try {
            if (!selectedService) {
                setAttendance([]);
                return;
            }
            const data = await attendanceService.fetchAttendanceWithDetails(Number(selectedService), Number(selectedDept));

            const turnosMap: Record<string | number, string> = {};
            data.forEach((rec: any) => {
                if (rec.turno_dominical) turnosMap[rec.id] = rec.turno_dominical;
            });

            const draft = loadDraft();
            if (draft) {
                const draftById = new Map(draft.attendance.map((r: any) => [String(r.id), r]));
                const merged = data.map(rec => {
                    const saved = draftById.get(String(rec.id));
                    return saved ? { ...rec, estado: saved.estado, tipo_justificacion: saved.tipo_justificacion, justificacion: saved.justificacion, hora_registro: saved.hora_registro } : rec;
                });
                isDirty.current = true;
                setHasUnsavedDraft(true);
                setAttendance(merged);
                setCultosTime({ ...turnosMap, ...draft.cultosTime });
            } else {
                isDirty.current = false;
                setHasUnsavedDraft(false);
                setAttendance(data);
                setCultosTime(turnosMap);
            }
        } catch (error) {
            console.error(error);
            setFetchError('No se pudo cargar la asistencia. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    function handleDiscardDraft() {
        clearDraft();
        isDirty.current = false;
        setHasUnsavedDraft(false);
        fetchAttendanceData();
    }

    async function handleSave() {
        if (!selectedService || attendance.length === 0) {
            notifications.show({ title: 'Error', message: 'No hay datos para guardar.', color: 'red' });
            return;
        }
        const unmarkedCount = attendance.filter(rec => !rec.estado).length;
        if (unmarkedCount > 0) {
            notifications.show({
                title: 'Asistencia incompleta',
                message: `${unmarkedCount} ${unmarkedCount === 1 ? 'servidor falta' : 'servidores faltan'} por marcar.`,
                color: 'orange',
                icon: <IconAlertCircle size={18} />
            });
            return;
        }
        setSaving(true);
        try {
            const isJustificada = (rec: typeof attendance[0]) => rec.estado === ATTENDANCE_STATES.CON_JUSTIFICACION;
            const recordsToUpdate = attendance.map(rec => ({
                id: rec.id,
                usuario_id: rec.usuario_id,
                configuracion_dia_id: rec.configuracion_dia_id,
                estado: rec.estado,
                tipo_justificacion: isJustificada(rec) ? (rec as any).tipo_justificacion ?? null : null,
                justificacion: isJustificada(rec) && (rec as any).tipo_justificacion === 'otro' ? rec.justificacion || '' : null,
                turno_dominical: cultosTime[rec.id] || null,
                hora_registro: rec.hora_registro ?? new Date().toISOString(),
                registrado_por: userProfile?.usuario_id ?? null
            }));
            await attendanceService.updateAttendanceRecords(recordsToUpdate);

            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['personalStats'] });
            queryClient.invalidateQueries({ queryKey: ['deptStats'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });

            isDirty.current = false;
            setHasUnsavedDraft(false);
            clearDraft();
            const allPresent = attendance.length > 0 && attendance.every(r => r.estado === ATTENDANCE_STATES.ASISTIO);
            if (allPresent) {
                notifications.show({
                    title: 'Equipo completo',
                    message: 'Todos los servidores estuvieron presentes.',
                    color: 'teal',
                    icon: <IconCheck size={18} />,
                });
            } else {
                notifications.show({ title: 'Asistencia guardada', message: 'Los registros se actualizaron.', color: 'teal' });
            }
            fetchAttendanceData();
            // Notificaciones: solo una vez por servicio para evitar envíos duplicados
            if (!notifiedServices.current.has(selectedService)) {
                notifiedServices.current.add(selectedService);
                sendAttendanceNotifications(Number(selectedService));
            }
        } catch {
            notifications.show({
                title: 'Error al guardar',
                message: 'No se pudo guardar la asistencia. Verifica tu conexión e intenta de nuevo.',
                color: 'red'
            });
        } finally {
            setSaving(false);
        }
    }

    async function sendAttendanceNotifications(configDiaId: number) {
        setNotifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-attendance`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ configuracion_dia_id: configDiaId }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? 'Error desconocido');
            notifications.show({
                title: 'Notificaciones enviadas',
                message: `${result.sent} correo(s) enviados a los servidores.`,
                color: 'teal',
                icon: <IconBell size={18} />,
            });
        } catch (err: any) {
            notifications.show({
                title: 'Error al notificar',
                message: err.message,
                color: 'orange',
                icon: <IconBell size={18} />,
            });
        } finally {
            setNotifying(false);
        }
    }

    const isLocked = false;

    // Ordenado alfabético memoizado — evita recomputar en cada render
    const sortedAttendance = useMemo(() =>
        [...attendance].sort((a, b) => {
            const nameA = `${a.usuario?.nombre || ''} ${a.usuario?.apellido || ''}`.toLowerCase();
            const nameB = `${b.usuario?.nombre || ''} ${b.usuario?.apellido || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        }),
        [attendance]
    );

    // Función pura — no depende de estado, no necesita recrearse en cada render
    const attendanceColor = (estado: string | null | undefined) =>
        !estado ? 'gray' :
        estado === ATTENDANCE_STATES.ASISTIO ? 'teal' :
        estado === ATTENDANCE_STATES.SIN_JUSTIFICACION ? 'red' : 'blue';

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
                <Alert icon={<IconAlertCircle size={16} />} title="Sin Acceso" color="red" radius="md">
                    La gestión de asistencia es exclusiva para el departamento de Servidores.
                </Alert>
            </Container>
        );
    }


    const serviceOptions = serviceDays.map(d => ({ value: String(d.id), label: d.tipo_servicio }));

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={2}>
                        <Title order={1} style={{
                            fontSize: 'var(--text-display)',
                            letterSpacing: 'var(--ls-display)',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Control de Asistencia
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Marca la asistencia del equipo para cada servicio</Text>
                    </Stack>
                </Group>

                {fetchError && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Error de conexión"
                        color="red"
                        radius="md"
                        withCloseButton
                        onClose={() => setFetchError(null)}
                    >
                        <Group justify="space-between" align="center" wrap="nowrap">
                            <Text size="sm">{fetchError}</Text>
                            <Button
                                size="xs"
                                variant="filled"
                                color="red"
                                radius="xl"
                                onClick={() => fetchData()}
                                disabled={!selectedDept || !selectedDate}
                            >
                                Reintentar
                            </Button>
                        </Group>
                    </Alert>
                )}

                {hasUnsavedDraft && (
                    <Alert
                        icon={<IconClipboardCheck size={16} />}
                        title="Cambios sin guardar"
                        color="orange"
                        radius="md"
                    >
                        <Group justify="space-between" align="center">
                            <Text size="sm">Tienes cambios pendientes de guardar.</Text>
                            <Button size="xs" variant="subtle" color="red" onClick={handleDiscardDraft}>
                                Descartar
                            </Button>
                        </Group>
                    </Alert>
                )}

                <Paper p={{ base: 'md', sm: 'xl' }} radius="xl" withBorder style={{
                    backgroundColor: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)'
                }}>
                    {/* Mobile: stacked vertically for thumb-friendly tapping */}
                    <Stack hiddenFrom="sm" gap="md">
                        <DatePickerInput
                            label="Fecha del Servicio"
                            placeholder="Seleccionar fecha"
                            value={selectedDate}
                            onChange={(val) => { setNoServicesFound(false); setSelectedDate(val as Date | null); }}
                            radius="md"
                            size="lg"
                            disabled={loading}
                            leftSection={<IconCalendarEvent size={18} color="var(--mantine-color-gold-6)" />}
                        />
                        <Select
                            label="Tipo de servicio"
                            placeholder={noServicesFound ? 'Sin servicios este día' : 'Selecciona el servicio'}
                            data={serviceOptions.map(opt => ({ ...opt, label: opt.label || 'Sin Nombre' }))}
                            value={selectedService}
                            onChange={setSelectedService}
                            disabled={!selectedDept || !selectedDate || loading || noServicesFound}
                            radius="md"
                            size="lg"
                            leftSection={<IconChevronRight size={18} color="var(--mantine-color-gold-6)" />}
                        />
                    </Stack>
                    {/* Desktop: side by side */}
                    <Group visibleFrom="sm" grow align="flex-end" gap="lg">
                        <DatePickerInput
                            label="Fecha del Servicio"
                            placeholder="Seleccionar fecha"
                            value={selectedDate}
                            onChange={(val) => { setNoServicesFound(false); setSelectedDate(val as Date | null); }}
                            radius="md"
                            size="md"
                            disabled={loading}
                            leftSection={<IconCalendarEvent size={18} color="var(--mantine-color-gold-6)" />}
                        />
                        <Select
                            label="Tipo de servicio"
                            placeholder={noServicesFound ? 'Sin servicios este día' : 'Selecciona el servicio'}
                            data={serviceOptions.map(opt => ({ ...opt, label: opt.label || 'Sin Nombre' }))}
                            value={selectedService}
                            onChange={setSelectedService}
                            disabled={!selectedDept || !selectedDate || loading || noServicesFound}
                            radius="md"
                            size="md"
                            leftSection={<IconChevronRight size={18} color="var(--mantine-color-gold-6)" />}
                        />
                    </Group>
                </Paper>

                {selectedDept && selectedDate && selectedService ? (
                    <Stack gap="xl">
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                            <Paper p="lg" radius="xl" withBorder aria-live="polite" aria-atomic="true">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text className="section-label">Presentes</Text>
                                        <Text fw={900} style={{ fontSize: 'var(--text-title)' }} c="teal.6">
                                            {attendance.filter(a => a.estado === ATTENDANCE_STATES.ASISTIO).length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="teal" variant="light" size="xl" radius="lg">
                                        <IconCheck size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder aria-live="polite" aria-atomic="true">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text className="section-label">Ausentes</Text>
                                        <Text fw={900} style={{ fontSize: 'var(--text-title)' }} c="red.6">
                                            {attendance.filter(a =>
                                                a.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION ||
                                                a.estado === ATTENDANCE_STATES.CON_JUSTIFICACION
                                            ).length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="red" variant="light" size="xl" radius="lg">
                                        <IconX size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                            <Paper p="lg" radius="xl" withBorder aria-live="polite" aria-atomic="true">
                                <Group justify="space-between">
                                    <Stack gap={0}>
                                        <Text className="section-label">Asignados</Text>
                                        <Text fw={900} style={{ fontSize: 'var(--text-title)' }}>
                                            {attendance.length}
                                        </Text>
                                    </Stack>
                                    <ThemeIcon color="gold" variant="light" size="xl" radius="lg">
                                        <IconUserCheck size={26} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                        </SimpleGrid>

                        {/* Barra de progreso de marcación */}
                        {attendance.length > 0 && (() => {
                            const marked = attendance.filter(a => a.estado).length;
                            const pct = Math.round((marked / attendance.length) * 100);
                            const done = marked === attendance.length;
                            return (
                                <Box>
                                    <Group justify="space-between" mb={6}>
                                        <Text className="section-label">
                                            {done ? 'Todos marcados' : `${marked} de ${attendance.length} marcados`}
                                        </Text>
                                        <Text size="xs" fw={700} c={done ? 'teal.6' : 'dimmed'}>{pct}%</Text>
                                    </Group>
                                    <Progress
                                        value={pct}
                                        color={done ? 'teal' : 'gold'}
                                        size="sm"
                                        radius="xl"
                                        animated={!done}
                                        style={{ transition: 'all 400ms var(--ease-out)' }}
                                    />
                                </Box>
                            );
                        })()}

                        {/* sortedAttendance, attendanceColor viven en el scope del componente (useMemo / función pura) */}
                        {(() => {
                            const justificationFields = (record: typeof attendance[0]) => (
                                record.estado === ATTENDANCE_STATES.CON_JUSTIFICACION ? (
                                    <Stack gap={4} mt={4}>
                                        <Select
                                            placeholder="Selecciona el motivo"
                                            data={JUSTIFICATION_TYPES.map(j => ({ value: j.value, label: j.label }))}
                                            value={(record as any).tipo_justificacion ?? null}
                                            onChange={(val) => handleJustificationTypeChange(record.id, val)}
                                            size="sm"
                                            radius="md"
                                            clearable
                                            disabled={isLocked}
                                        />
                                        {(record as any).tipo_justificacion === 'otro' && (
                                            <Textarea
                                                placeholder="Especifica el motivo..."
                                                value={record.justificacion || ''}
                                                onChange={(e) => handleJustificationChange(record.id, e.currentTarget.value)}
                                                size="sm"
                                                radius="md"
                                                autosize
                                                minRows={2}
                                                maxRows={3}
                                                disabled={isLocked}
                                            />
                                        )}
                                    </Stack>
                                ) : null
                            );

                            const sundayTurn = (record: typeof attendance[0]) => (
                                selectedDate && dayjs(selectedDate).day() === 0 && record.estado === ATTENDANCE_STATES.ASISTIO ? (
                                    <SegmentedControl
                                        value={cultosTime[record.id] || UNMARKED_SUNDAY_TURN_VALUE}
                                        onChange={(val) => {
                                            if (val !== UNMARKED_SUNDAY_TURN_VALUE) {
                                                isDirty.current = true;
                                                setCultosTime(prev => ({ ...prev, [record.id]: val }));
                                            }
                                        }}
                                        data={[
                                            { label: 'Sin turno', value: UNMARKED_SUNDAY_TURN_VALUE },
                                            { label: '8 AM', value: '8am' },
                                            { label: '11 AM', value: '11am' },
                                        ]}
                                        color="gold"
                                        radius="xl"
                                        size="sm"
                                        styles={{
                                            root: { backgroundColor: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gold-3)' },
                                            label: { fontWeight: 700 }
                                        }}
                                    />
                                ) : null
                            );

                            return (
                                <>
                                    {/* ── Desktop: tabla horizontal ── */}
                                    <Paper shadow="sm" radius="xl" withBorder visibleFrom="sm" style={{
                                        backgroundColor: 'var(--mantine-color-body)',
                                        overflow: 'hidden'
                                    }}>
                                        <Table.ScrollContainer minWidth={600}>
                                            <Table verticalSpacing="md" highlightOnHover>
                                                <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderBottom: '2px solid var(--mantine-color-gray-3)' }}>
                                                    <Table.Tr>
                                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 'var(--ls-tag)', paddingLeft: '24px' }}>Servidor</Table.Th>
                                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 'var(--ls-tag)', textAlign: 'center' }}>Asistencia</Table.Th>
                                                        <Table.Th style={{ color: 'var(--mantine-color-gray-7)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 'var(--ls-tag)', textAlign: 'right', paddingRight: '24px' }}>Hora</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {loading ? (
                                                        <Table.Tr><Table.Td colSpan={3}><Center py="xl"><Loader color="gold" type="dots" /></Center></Table.Td></Table.Tr>
                                                    ) : sortedAttendance.length > 0 ? (
                                                        sortedAttendance.map((record) => (
                                                            <Table.Tr key={record.id}>
                                                                <Table.Td style={{ paddingLeft: '24px' }}>
                                                                    <Group gap="sm">
                                                                        <Avatar color="gold" radius="lg" size="md">
                                                                            {record.usuario?.nombre?.[0]}{record.usuario?.apellido?.[0]}
                                                                        </Avatar>
                                                                        <Stack gap={0}>
                                                                            <Text size="sm" fw={800}>{record.usuario?.nombre} {record.usuario?.apellido}</Text>
                                                                            <Text size="xs" c="dimmed" fw={600}>{record.posicion?.nombre || 'General'}</Text>
                                                                        </Stack>
                                                                    </Group>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Center>
                                                                        <Stack gap={6} align="center">
                                                                            <SegmentedControl
                                                                                value={record.estado ?? UNMARKED_ATTENDANCE_VALUE}
                                                                                onChange={(value) => {
                                                                                    if (value !== UNMARKED_ATTENDANCE_VALUE) handleAttendanceChange(record.id, value);
                                                                                }}
                                                                                disabled={isLocked}
                                                                                data={[
                                                                                    { label: 'Sin marcar', value: UNMARKED_ATTENDANCE_VALUE },
                                                                                    { label: 'Presente', value: ATTENDANCE_STATES.ASISTIO },
                                                                                    { label: 'Falta', value: ATTENDANCE_STATES.SIN_JUSTIFICACION },
                                                                                    { label: 'Justificada', value: ATTENDANCE_STATES.CON_JUSTIFICACION },
                                                                                ]}
                                                                                color={attendanceColor(record.estado)}
                                                                                radius="xl"
                                                                                size="sm"
                                                                                styles={{ root: { backgroundColor: 'var(--mantine-color-gray-1)' }, label: { fontWeight: 700 } }}
                                                                            />
                                                                            {justificationFields(record)}
                                                                            {sundayTurn(record)}
                                                                        </Stack>
                                                                    </Center>
                                                                </Table.Td>
                                                                <Table.Td style={{ paddingRight: '24px' }} align="right">
                                                                    <Text size="xs" fw={700} c="dimmed">
                                                                        {record.hora_registro ? dayjs(record.hora_registro).format('h:mm A') : '--'}
                                                                    </Text>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        ))
                                                    ) : (
                                                        <Table.Tr>
                                                            <Table.Td colSpan={3}>
                                                                <Center py="xl">
                                                                    <Stack align="center" gap="sm">
                                                                        <ThemeIcon size={52} radius="xl" variant="light" color="stone">
                                                                            <IconAlertCircle size={26} stroke={1.5} />
                                                                        </ThemeIcon>
                                                                        <Text fw={600} c="dimmed">No hay servidores asignados.</Text>
                                                                    </Stack>
                                                                </Center>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    )}
                                                </Table.Tbody>
                                            </Table>
                                        </Table.ScrollContainer>
                                    </Paper>

                                    {/* ── Mobile: lista táctil ─────────────────────────────
                                        Un encargado con un pulgar en la puerta de la iglesia.
                                        Cada servidor: fila completa, controles grandes, sin scroll horizontal. */}
                                    <Paper withBorder radius="xl" hiddenFrom="sm" style={{
                                        backgroundColor: 'var(--mantine-color-body)',
                                        overflow: 'hidden'
                                    }}>
                                        {loading ? (
                                            <Center py="xl"><Loader color="gold" type="dots" /></Center>
                                        ) : sortedAttendance.length > 0 ? (
                                            <Stack gap={0}>
                                                {sortedAttendance.map((record, index) => {
                                                    const bgTint =
                                                        record.estado === ATTENDANCE_STATES.ASISTIO ? 'rgba(20,184,166,0.04)' :
                                                        record.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION ? 'rgba(239,68,68,0.04)' :
                                                        record.estado === ATTENDANCE_STATES.CON_JUSTIFICACION ? 'rgba(59,130,246,0.04)' :
                                                        'transparent';
                                                    return (
                                                        <Box
                                                            key={record.id}
                                                            p="md"
                                                            className="attendance-row"
                                                            style={{
                                                                borderTop: index > 0 ? '1px solid var(--mantine-color-default-border)' : 'none',
                                                                backgroundColor: bgTint,
                                                            }}
                                                        >
                                                            <Group justify="space-between" mb={10} wrap="nowrap">
                                                                <Group gap="sm" wrap="nowrap">
                                                                    <Avatar color="gold" radius="lg" size="md">
                                                                        {record.usuario?.nombre?.[0]}{record.usuario?.apellido?.[0]}
                                                                    </Avatar>
                                                                    <Stack gap={0}>
                                                                        <Text size="sm" fw={800} style={{ lineHeight: 1.2 }}>{record.usuario?.nombre} {record.usuario?.apellido}</Text>
                                                                        <Text size="xs" c="dimmed" fw={600}>{record.posicion?.nombre || 'General'}</Text>
                                                                    </Stack>
                                                                </Group>
                                                                <Text size="xs" fw={700} c="dimmed" style={{ flexShrink: 0 }}>
                                                                    {record.hora_registro ? dayjs(record.hora_registro).format('h:mm A') : '--'}
                                                                </Text>
                                                            </Group>
                                                            <SegmentedControl
                                                                fullWidth
                                                                aria-label={`Asistencia de ${record.usuario?.nombre ?? ''} ${record.usuario?.apellido ?? ''}`.trim()}
                                                                value={record.estado ?? UNMARKED_ATTENDANCE_VALUE}
                                                                onChange={(value) => {
                                                                    if (value !== UNMARKED_ATTENDANCE_VALUE) handleAttendanceChange(record.id, value);
                                                                }}
                                                                disabled={isLocked}
                                                                data={[
                                                                    { label: '·', value: UNMARKED_ATTENDANCE_VALUE },
                                                                    { label: 'Presente', value: ATTENDANCE_STATES.ASISTIO },
                                                                    { label: 'Falta', value: ATTENDANCE_STATES.SIN_JUSTIFICACION },
                                                                    { label: 'Just.', value: ATTENDANCE_STATES.CON_JUSTIFICACION },
                                                                ]}
                                                                color={attendanceColor(record.estado)}
                                                                radius="xl"
                                                                size="sm"
                                                                styles={{ root: { backgroundColor: 'var(--mantine-color-gray-1)' }, label: { fontWeight: 700 } }}
                                                            />
                                                            {justificationFields(record)}
                                                            {sundayTurn(record)}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <Center py="xl">
                                                <Stack align="center" gap="sm">
                                                    <ThemeIcon size={52} radius="xl" variant="light" color="stone">
                                                        <IconAlertCircle size={26} stroke={1.5} />
                                                    </ThemeIcon>
                                                    <Text fw={600} c="dimmed">No hay servidores asignados.</Text>
                                                </Stack>
                                            </Center>
                                        )}
                                    </Paper>
                                </>
                            );
                        })()}

                        {/* Save button: full-width on mobile, right-aligned on desktop */}
                        <Box hiddenFrom="sm">
                            <Button
                                leftSection={isLocked ? <IconLock size={20} /> : <IconDeviceFloppy size={20} />}
                                onClick={handleSave}
                                loading={saving || notifying}
                                disabled={isLocked}
                                size="lg"
                                radius="xl"
                                className="btn-premium"
                                fullWidth
                            >
                                {isLocked ? 'Registro cerrado' : 'Guardar Asistencia'}
                            </Button>
                        </Box>
                        <Group visibleFrom="sm" justify="flex-end">
                            {notifying && (
                                <Text size="sm" c="dimmed" fw={500}>Enviando notificaciones...</Text>
                            )}
                            <Button
                                leftSection={isLocked ? <IconLock size={20} /> : <IconDeviceFloppy size={20} />}
                                onClick={handleSave}
                                loading={saving || notifying}
                                disabled={isLocked}
                                size="lg"
                                radius="xl"
                                className="btn-premium"
                            >
                                {isLocked ? 'Registro cerrado' : 'Guardar Asistencia'}
                            </Button>
                        </Group>
                    </Stack>
                ) : noServicesFound ? (
                    <Paper p="xl" radius="xl" withBorder style={{
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        borderStyle: 'dashed'
                    }}>
                        <Center py="xl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" variant="light" color="stone">
                                    <IconCalendarEvent size={30} />
                                </ThemeIcon>
                                <Stack gap={4} align="center">
                                    <Text fw={800} size="lg">Sin servicios este día</Text>
                                    <Text c="dimmed" maw={400} ta="center" size="sm" fw={500}>
                                        No hay servicios configurados para el {dayjs(selectedDate).format('dddd D [de] MMMM')}. Selecciona otra fecha.
                                    </Text>
                                </Stack>
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <Paper p="xl" radius="xl" withBorder style={{
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        borderStyle: 'dashed'
                    }}>
                        <Center py="xl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gold">
                                    <IconClipboardCheck size={30} />
                                </ThemeIcon>
                                <Stack gap={4} align="center">
                                    <Text fw={800} size="lg">Elige fecha y servicio</Text>
                                    <Text c="dimmed" maw={400} ta="center" size="sm" fw={500}>
                                        Selecciona una fecha para ver los servicios disponibles y comenzar a marcar asistencia.
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
