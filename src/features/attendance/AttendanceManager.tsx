// Ensuring TS attendance service is used
import { useState, useEffect } from 'react';
import {
    Card,
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
    TextInput,
    Loader,
    Alert,
    Progress,
    Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconCalendar, IconUsers, IconSearch, IconFileDownload } from '@tabler/icons-react';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { attendanceService, type DepartmentMember, type ServiceDay, type AttendanceRecord } from '../../services/attendanceService';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { impactReportService, type MonthlyStats, type MemberImpact, type ServiceDetail } from '../../services/ImpactReportService';
import { ImpactReportTemplate } from '../reports/ImpactReportTemplate';
import { ATTENDANCE_STATES } from '../../constants/attendance';
import { TableSkeleton } from '../../components/TableSkeleton';

type LocalAttendanceState = Pick<AttendanceRecord, 'estado' | 'justificacion'>;

export function AttendanceManager() {
    const { attendanceManagedDepartments } = useUser();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
    const [members, setMembers] = useState<DepartmentMember[]>([]);
    const [attendance, setAttendance] = useState<Record<string, LocalAttendanceState>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportData, setReportData] = useState<{
        stats: MonthlyStats;
        members: MemberImpact[];
        services: ServiceDetail[];
    } | null>(null);

    const reportRef = useRef<HTMLDivElement>(null);

    const permissions = usePermissions();



    useEffect(() => {
        if (selectedDept) {
            fetchData();
        }
    }, [selectedDept]);

    useEffect(() => {
        if (selectedService) {
            fetchAttendanceData();
        } else {
            setAttendance({});
        }
    }, [selectedService]);

    function handleAttendanceChange(userId: string | number, field: keyof LocalAttendanceState, value: string) {
        setAttendance(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value
            }
        }));
    }

    async function fetchData() {
        setLoading(true);
        try {
            if (!selectedDept) return;
            const [days, deptMembers] = await Promise.all([
                attendanceService.fetchServiceDays(selectedDept),
                attendanceService.fetchDeptMembers(selectedDept)
            ]);
            setServiceDays(days);
            // Sort members alphabetically by name
            const sortedMembers = deptMembers.sort((a, b) => {
                const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
                const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setMembers(sortedMembers);
            if (days.length > 0) {
                setSelectedService(String(days[0].id));
            } else {
                setSelectedService(null);
            }
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error de Datos',
                message: 'No se pudo sincronizar la lista de miembros o servicios.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchAttendanceData() {
        try {
            if (!selectedService) return;
            const data = await attendanceService.fetchAttendance(selectedService);
            const attendanceMap: Record<string, LocalAttendanceState> = {};
            data.forEach((rec) => {
                attendanceMap[rec.usuario_id] = {
                    estado: rec.estado,
                    justificacion: rec.justificacion || ''
                };
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSave() {
        if (!selectedService || members.length === 0) {
            notifications.show({
                title: 'Error',
                message: 'No hay datos suficientes para guardar la asistencia.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
            return;
        }
        setSaving(true);
        try {
            // Construir registros a guardar
            const records = members.map(member => ({
                usuario_id: member.id,
                configuracion_dia_id: Number(selectedService),
                estado: attendance[member.id]?.estado || '',
                justificacion: attendance[member.id]?.justificacion || ''
            }));
            await attendanceService.saveAttendance(records);
            notifications.show({
                title: '¡Éxito!',
                message: 'Asistencia guardada correctamente.',
                color: 'green',
                icon: <IconCheck size={18} />
            });
        } catch (error: unknown) {
            console.error(error);
            notifications.show({
                title: 'Error al guardar',
                message: (error as Error).message || 'No se pudo guardar la asistencia.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setSaving(false);
        }
    }

    // Filter departments to only those the user can manage attendance for (Strictly Servidores per latest rule)
    const filteredDepts = (attendanceManagedDepartments || []).filter(d => permissions.canManageAttendance(d.id));

    useEffect(() => {
        if (!selectedDept && filteredDepts.length > 0) {
            setSelectedDept(String(filteredDepts[0].id));
        } else if (selectedDept && filteredDepts.length > 0 && !filteredDepts.some(d => String(d.id) === selectedDept)) {
            // If current selected is not in allowed list, reset to first allowed
            setSelectedDept(String(filteredDepts[0].id));
        }
    }, [filteredDepts, selectedDept]);

    if (!attendanceManagedDepartments || loading) {
        return (
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                        <div>
                            <Title order={1} style={{
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '2.5rem',
                                letterSpacing: '-0.02em',
                                color: '#78350f'
                            }}>
                                Control de Asistencia
                            </Title>
                        </div>
                    </Group>
                    <TableSkeleton rows={6} columns={3} withHeader={false} />
                </Stack>
            </Container>
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

    const deptOptions = filteredDepts.map(d => ({
        value: String(d.id),
        label: d.nombre
    }));

    const serviceOptions = serviceDays.map(d => ({
        value: String(d.id),
        label: `${dayjs(d.fecha).format('DD/MM')} - ${d.tipo_servicio}`
    }));

    const filteredMembers = members.filter(m =>
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presentCount = filteredMembers.filter(m => attendance[m.id]?.estado === ATTENDANCE_STATES.ASISTIO).length;
    const totalVisible = filteredMembers.length;
    const attendancePercentage = totalVisible > 0 ? Math.round((presentCount / totalVisible) * 100) : 0;

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                    <div>
                        <Title order={1} style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '2.5rem',
                            letterSpacing: '-0.02em',
                            color: '#78350f' // Deep Amber
                        }}>
                            Control de Asistencia
                        </Title>
                    </div>
                    <Group align="flex-end" gap="sm">
                        <Select
                            label="Departamento"
                            data={deptOptions}
                            value={selectedDept}
                            onChange={setSelectedDept}
                            size="md"
                            radius="xl"
                            w={200}
                            styles={{ label: { color: '#78716c', fontWeight: 700 } }}
                        />
                        <Select
                            label="Servicio / Fecha"
                            placeholder="Selecciona"
                            data={serviceOptions}
                            value={selectedService}
                            onChange={setSelectedService}
                            size="md"
                            radius="xl"
                            w={240}
                            leftSection={<IconCalendar size={18} />}
                            styles={{ label: { color: '#78716c', fontWeight: 700 } }}
                        />
                        <Button
                            variant="light"
                            color="gold" // Gold theme
                            radius="xl"
                            leftSection={<IconFileDownload size={18} />}
                            loading={generatingReport}
                            onClick={async () => {
                                if (!selectedDept) return;
                                setGeneratingReport(true);
                                try {
                                    const now = dayjs();
                                    const data = await impactReportService.getMonthlyData(
                                        Number(selectedDept),
                                        now.month() + 1,
                                        now.year()
                                    );

                                    if (!data.stats) {
                                        notifications.show({
                                            title: 'Sin Datos',
                                            message: 'No hay servicios registrados en este mes para generar el reporte.',
                                            color: 'orange'
                                        });
                                        return;
                                    }

                                    setReportData(data as {
                                        stats: MonthlyStats;
                                        members: MemberImpact[];
                                        services: ServiceDetail[];
                                    });

                                    // Esperar un render para capturar
                                    setTimeout(async () => {
                                        if (reportRef.current) {
                                            const dataUrl = await toPng(reportRef.current, { quality: 0.95, pixelRatio: 2 });
                                            const pdf = new jsPDF('p', 'mm', 'a4');
                                            const imgProps = pdf.getImageProperties(dataUrl);
                                            const pdfWidth = pdf.internal.pageSize.getWidth();
                                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                            pdf.save(`Reporte_Impacto_${dayjs().format('MMMM_YYYY')}.pdf`);
                                            setReportData(null);
                                        }
                                    }, 500);
                                } catch (error) {
                                    console.error('Error generating report:', error);
                                    notifications.show({ title: 'Error', message: 'No se pudo generar el reporte', color: 'red' });
                                } finally {
                                    setGeneratingReport(false);
                                }
                            }}
                        >
                            Ver Reporte de Impacto (PDF)
                        </Button>
                    </Group>
                </Group>

                {/* Report Template (Hidden) */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    {reportData && (
                        <ImpactReportTemplate
                            ref={reportRef}
                            stats={reportData.stats}
                            members={reportData.members}
                            services={reportData.services}
                            month={dayjs().month() + 1}
                            year={dayjs().year()}
                            deptName={attendanceManagedDepartments?.find(d => String(d.id) === selectedDept)?.nombre || 'Departamento'}
                        />
                    )}
                </div>

                {selectedService && !loading && members.length > 0 && (
                    <Card p="xl" radius="lg" withBorder style={{
                        background: 'linear-gradient(135deg, #fcfaf5 0%, #fffbeb 100%)', // Warm Cream Gradient
                        borderColor: '#e7e5e4',
                        position: 'relative',
                        overflow: 'hidden',
                        borderLeft: '6px solid #d97706' // Amber 600
                    }}>
                        {/* Decorative background icon */}
                        <Box style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            opacity: 0.05,
                            transform: 'rotate(15deg)',
                            color: '#d97706'
                        }}>
                            <IconUsers size={160} />
                        </Box>

                        <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                            <Group justify="space-between">
                                <Stack gap={2}>
                                    <Text fw={900} size="xs" tt="uppercase" c="gold.8" style={{ letterSpacing: '0.05em' }}>Asistencia del Equipo</Text>
                                    <Title order={3} style={{ fontFamily: 'Outfit, sans-serif', color: '#292524' }}>Participación</Title>
                                </Stack>
                                <Badge color="gold" variant="filled" size="xl" radius="md" style={{ height: 40, fontSize: '1rem', fontWeight: 800 }}>
                                    {attendancePercentage}% PRESENTE
                                </Badge>
                            </Group>

                            <Progress
                                value={attendancePercentage}
                                size="lg"
                                radius="xl"
                                animated
                                color="gold.5"
                                style={{ background: '#e7e5e4' }}
                            />

                            <Group justify="space-between" mt="md">
                                <Button
                                    variant="light"
                                    size="sm"
                                    color="gold"
                                    radius="md"
                                    leftSection={<IconUsers size={16} />}
                                    onClick={() => {
                                        const newAttendance = { ...attendance };
                                        members.forEach(m => {
                                            newAttendance[m.id] = { estado: ATTENDANCE_STATES.ASISTIO, justificacion: '' };
                                        });
                                        setAttendance(newAttendance);
                                        notifications.show({ title: '¡Listo!', message: 'Todos marcados como presente', color: 'green' });
                                    }}
                                >
                                    Marcar todos como "Asistió"
                                </Button>

                                <TextInput
                                    placeholder="Buscar por nombre..."
                                    size="sm"
                                    radius="md"
                                    w={240}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    leftSection={<IconSearch size={16} />}
                                    styles={{
                                        input: {
                                            backgroundColor: 'var(--mantine-color-body)',
                                            borderColor: '#e7e5e4',
                                        }
                                    }}
                                />
                            </Group>
                        </Stack>
                    </Card>
                )}

                {loading ? (
                    <Stack align="center" py="xl">
                        <Loader size="lg" color="gold" />
                        <Text size="sm" c="dimmed">Sincronizando equipo...</Text>
                    </Stack>
                ) : selectedService ? (
                    <>
                        <Table.ScrollContainer minWidth={600}>
                            <Table verticalSpacing="md" highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ fontFamily: 'Outfit, sans-serif', color: '#57534e' }}>Servidor</Table.Th>
                                        <Table.Th ta="center" style={{ fontFamily: 'Outfit, sans-serif', color: '#57534e' }}>Estado de Asistencia</Table.Th>
                                        <Table.Th style={{ fontFamily: 'Outfit, sans-serif', color: '#57534e' }}>Justificación / Notas</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredMembers.map((member) => (
                                        <Table.Tr key={member.id}>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Text fw={800} size="sm" c="stone.8">{member.nombre} {member.apellido}</Text>
                                                    <Text size="xs" c="stone.5" fw={700}>Servidor(a)</Text>
                                                </Stack>
                                            </Table.Td>

                                            <Table.Td>
                                                <Center>
                                                    <SegmentedControl
                                                        size="xs"
                                                        radius="xl"
                                                        value={attendance[member.id]?.estado || ''}
                                                        onChange={(val) => handleAttendanceChange(member.id, 'estado', val)}
                                                        data={[
                                                            { label: 'Asistió', value: ATTENDANCE_STATES.ASISTIO },
                                                            { label: 'Con Justificación', value: ATTENDANCE_STATES.CON_JUSTIFICACION },
                                                            { label: 'Sin Justificación', value: ATTENDANCE_STATES.SIN_JUSTIFICACION },
                                                        ]}
                                                        color={
                                                            attendance[member.id]?.estado === ATTENDANCE_STATES.ASISTIO ? 'teal' : // Green -> Teal
                                                                attendance[member.id]?.estado === ATTENDANCE_STATES.CON_JUSTIFICACION ? 'orange' : // Yellow -> Orange for contrast
                                                                    attendance[member.id]?.estado === ATTENDANCE_STATES.SIN_JUSTIFICACION ? 'red' : 'gray'
                                                        }
                                                    />
                                                </Center>
                                            </Table.Td>
                                            <Table.Td>
                                                <TextInput
                                                    placeholder="Ej: Enfermedad, viaje..."
                                                    size="xs"
                                                    radius="md"
                                                    value={attendance[member.id]?.justificacion || ''}
                                                    onChange={(e) => handleAttendanceChange(member.id, 'justificacion', e.target.value)}
                                                    disabled={attendance[member.id]?.estado === ATTENDANCE_STATES.ASISTIO}
                                                    styles={{ input: { borderColor: '#e7e5e4' } }}
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>

                        <Group justify="flex-end">
                            <Button
                                leftSection={<IconDeviceFloppy size={20} />}
                                onClick={handleSave}
                                loading={saving}
                                size="lg"
                                radius="xl"
                                color="gold"
                                disabled={!permissions.canManageAttendance(selectedDept)}
                                style={{
                                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                                }}
                            >
                                Guardar Asistencia
                            </Button>
                        </Group>
                    </>
                ) : (
                    <Alert icon={<IconAlertCircle size={16} />} title="Sin Servicios" color="orange" radius="lg" variant="light">
                        <Text fw={700} size="sm">No se encontraron días de servicio configurados para este departamento en el mes actual o pasado.</Text>
                        <Text size="xs" mt={4} fw={600}>Por favor, asegúrate de que el rol haya sido planificado.</Text>
                    </Alert>
                )}
            </Stack>
        </Container>
    );
}
