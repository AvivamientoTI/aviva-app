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
import { attendanceService, type DepartmentMember } from '../../services/attendanceService';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { impactReportService, type MonthlyStats, type MemberImpact, type ServiceDetail } from '../../services/ImpactReportService';
import { ImpactReportTemplate } from '../reports/ImpactReportTemplate';

interface AttendanceRecord {
    estado: string;
    justificacion: string;
}

interface ServiceDay {
    id: string | number;
    fecha: string;
    tipo_servicio: string;
}

export function AttendanceManager() {
    const { attendanceManagedDepartments, userMemberships } = useUser();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
    const [members, setMembers] = useState<DepartmentMember[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
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

    // Declarar servidoresDept y servidoresMembership antes de los hooks
    const servidoresDept = attendanceManagedDepartments?.find(d => d.nombre?.toLowerCase() === 'servidores');
    const servidoresMembership = userMemberships?.find(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === 'servidores' && (
            rol === 'líder' || rol === 'lider' || rol === 'sublíder' || rol === 'sublider' || rol === 'encargado' || rol === 'encargada'
        );
    });

    useEffect(() => {
        if (!selectedDept && attendanceManagedDepartments && attendanceManagedDepartments.length > 0) {
            setSelectedDept(String(attendanceManagedDepartments[0].id));
        }
    }, [attendanceManagedDepartments, selectedDept]);

    useEffect(() => {
        if (servidoresDept && selectedDept !== String(servidoresDept.id)) {
            setSelectedDept(String(servidoresDept.id));
        }
    }, [servidoresDept, selectedDept]);

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

    function handleAttendanceChange(userId: string | number, field: keyof AttendanceRecord, value: string) {
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
            setMembers(deptMembers);
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
            const attendanceMap: Record<string, AttendanceRecord> = {};
            data.forEach((rec: any) => {
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
                config_dia_id: selectedService,
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
        } catch (error: any) {
            console.error(error);
            notifications.show({
                title: 'Error al guardar',
                message: error.message || 'No se pudo guardar la asistencia.',
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
        } finally {
            setSaving(false);
        }
    }

    if (!attendanceManagedDepartments) {
        return (
            <Container size="md" py="xl">
                <Loader size="lg" />
                <Text>Inicializando...</Text>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container size="md" py="xl">
                <Loader size="lg" />
                <Text>Cargando datos de usuario...</Text>
            </Container>
        );
    }

    if (!servidoresDept || !servidoresMembership) {
        return null;
    }

    const deptOptions = [{ value: String(servidoresDept.id), label: servidoresDept.nombre }];

    const serviceOptions = serviceDays.map(d => ({
        value: String(d.id),
        label: `${dayjs(d.fecha).format('DD/MM')} - ${d.tipo_servicio}`
    }));

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                    <div>
                        <Title order={1} style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '2.5rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-blue-9)'
                        }}>
                            Control de Asistencia
                        </Title>
                        <Text c="slate.7" size="md" fw={700}>Gestión de participación del equipo en tiempo real.</Text>
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
                        />
                        <Button
                            variant="light"
                            color="indigo"
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

                                    setReportData(data as any);

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
                        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                        borderColor: '#e2e8f0',
                        position: 'relative',
                        overflow: 'hidden',
                        borderLeft: '6px solid #2563eb'
                    }}>
                        {/* Decorative background icon */}
                        <Box style={{
                            position: 'absolute',
                            top: -20,
                            right: -20,
                            opacity: 0.05,
                            transform: 'rotate(15deg)',
                            color: '#2563eb'
                        }}>
                            <IconUsers size={160} />
                        </Box>

                        <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                            <Group justify="space-between">
                                <Stack gap={2}>
                                    <Text fw={900} size="xs" tt="uppercase" c="blue.8" style={{ letterSpacing: '0.05em' }}>Salud del Equipo (Hoy)</Text>
                                    <Title order={3} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Snapshot de Participación</Title>
                                </Stack>
                                <Badge color="blue" variant="filled" size="xl" radius="md" style={{ height: 40, fontSize: '1rem', fontWeight: 800 }}>
                                    {Math.round((Object.values(attendance).filter(a => a.estado === 'Asistió').length / members.length) * 100)}% PRESENTE
                                </Badge>
                            </Group>

                            <Progress
                                value={(Object.values(attendance).filter(a => a.estado === 'Asistió').length / members.length) * 100}
                                size="lg"
                                radius="xl"
                                animated
                                color="blue.5"
                                style={{ background: '#e2e8f0' }}
                            />

                            <Group justify="space-between" mt="md">
                                <Button
                                    variant="light"
                                    size="sm"
                                    color="blue"
                                    radius="md"
                                    leftSection={<IconUsers size={16} />}
                                    onClick={() => {
                                        const newAttendance = { ...attendance };
                                        members.forEach(m => {
                                            newAttendance[m.id] = { estado: 'Asistió', justificacion: '' };
                                        });
                                        setAttendance(newAttendance);
                                        notifications.show({ title: '¡Listo!', message: 'Todos marcados como presente', color: 'blue' });
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
                                            backgroundColor: '#ffffff',
                                            borderColor: '#e2e8f0',
                                        }
                                    }}
                                />
                            </Group>
                        </Stack>
                    </Card>
                )}

                {loading ? (
                    <Stack align="center" py="xl">
                        <Loader size="lg" />
                        <Text size="sm" c="dimmed">Sincronizando equipo...</Text>
                    </Stack>
                ) : selectedService ? (
                    <>
                        <Table.ScrollContainer minWidth={600}>
                            <Table verticalSpacing="md" highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ fontFamily: 'Outfit, sans-serif' }}>Servidor</Table.Th>
                                        <Table.Th ta="center" style={{ fontFamily: 'Outfit, sans-serif' }}>Estado de Asistencia</Table.Th>
                                        <Table.Th style={{ fontFamily: 'Outfit, sans-serif' }}>Justificación / Notas</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {members
                                        .filter(m => `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((member) => (
                                            <Table.Tr key={member.id}>
                                                <Table.Td>
                                                    <Stack gap={0}>
                                                        <Text fw={800} size="sm" c="slate.9">{member.nombre} {member.apellido}</Text>
                                                        <Text size="xs" c="slate.7" fw={700}>Servidor(a)</Text>
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
                                                                { label: 'Asistió', value: 'Asistió' },
                                                                { label: 'Faltó c/ Aviso', value: 'Faltó con Aviso' },
                                                                { label: 'Faltó s/ Aviso', value: 'Faltó sin Aviso' },
                                                            ]}
                                                            color={
                                                                attendance[member.id]?.estado === 'Asistió' ? 'green' :
                                                                    attendance[member.id]?.estado === 'Faltó con Aviso' ? 'orange' :
                                                                        attendance[member.id]?.estado === 'Faltó sin Aviso' ? 'red' : 'gray'
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
                                                        disabled={attendance[member.id]?.estado === 'Asistió'}
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
                                color="blue"
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
