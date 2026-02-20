import { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    SimpleGrid,
    Card,
    Box,
    Select,
    Skeleton,
    Button
} from '@mantine/core';
import {
    IconCalendarEvent,
    IconChecklist,
    IconUsers,
    IconTrendingUp,
    IconCalendarOff
} from '@tabler/icons-react';
import { DonutChart, BarChart } from '@mantine/charts';
import { useUser } from '../../contexts/UserContext';
import { getUniformeColor } from '../../utils/calendar/colorMapper';
import { AiQueryWidget } from './components/AiQueryWidget';
import { useDashboardData } from '../../hooks/useDashboardData';
import { StatCard } from './components/StatCard';
import { WelcomeCard } from './components/WelcomeCard';
import { UpcomingServiceCard } from './components/UpcomingServiceCard';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { PersonalRoleTemplate } from '../reports/PersonalRoleTemplate';
import { analyticsService } from '../../services/analyticsService';
import { notifications } from '@mantine/notifications';
import { IconFileDownload } from '@tabler/icons-react';

// Helper to safely get the first item or the item itself
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

export function Dashboard() {
    const { userProfile, attendanceManagedDepartments } = useUser();
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

    // Initial department selection
    useEffect(() => {
        if (attendanceManagedDepartments && attendanceManagedDepartments.length > 0 && !selectedDeptId) {
            setSelectedDeptId(attendanceManagedDepartments[0].id);
        }
    }, [attendanceManagedDepartments]);

    const { upcoming, upcomingCount, stats, loading, shouldShowDeptStats } = useDashboardData(selectedDeptId);

    const [exporting, setExporting] = useState(false);
    const [exportData, setExportData] = useState<any[] | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleExportRole = async () => {
        if (!userProfile?.usuario_id) return;
        setExporting(true);
        try {
            const now = dayjs();
            const data = await analyticsService.fetchMonthlyUserRole(
                userProfile.usuario_id,
                now.month() + 1,
                now.year()
            );

            if (data.length === 0) {
                notifications.show({
                    title: 'Sin Asignaciones',
                    message: 'No tienes servicios programados para este mes.',
                    color: 'orange'
                });
                return;
            }

            setExportData(data);

            // Wait for render
            setTimeout(async () => {
                if (reportRef.current) {
                    const dataUrl = await toPng(reportRef.current, { quality: 0.95, pixelRatio: 2 });
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgProps = pdf.getImageProperties(dataUrl);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`Mi_Rol_Servicio_${dayjs().format('MMMM_YYYY')}.pdf`);
                    setExportData(null);
                    notifications.show({
                        title: '¡Éxito!',
                        message: 'Tu rol ha sido exportado.',
                        color: 'teal',
                        icon: <IconChecklist size={18} />
                    });
                }
            }, 600);
        } catch (error) {
            console.error('Error exporting role:', error);
            notifications.show({ title: 'Error', message: 'No se pudo generar el PDF de tu rol', color: 'red' });
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <Container size="xl" py="md">
                <Stack gap="lg">
                    {/* Skeleton for Welcome & Upcoming */}
                    <Grid gutter="lg">
                        <Grid.Col span={{ base: 12, md: 7 }}>
                            <Skeleton height={280} radius="lg" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                            <Skeleton height={280} radius="xl" />
                        </Grid.Col>
                    </Grid>

                    {/* Skeleton for Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                        <Skeleton height={140} radius="lg" />
                    </SimpleGrid>

                    {/* Skeleton for Charts/Lists */}
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Skeleton height={300} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Skeleton height={300} radius="md" />
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Container>
        );
    }

    const attendanceTotal = stats?.summary.total || 0;
    const attendanceRate = attendanceTotal > 0
        ? Math.round((stats!.summary.asistio / attendanceTotal) * 100)
        : 0;

    // Data for "Mes Pasado"
    const lastMonthStat = (stats as any)?.lastMonthSummary;
    const lastMonthTotal = lastMonthStat ? (lastMonthStat.asistio + lastMonthStat.faltas) : 0;

    const nextService = upcoming.length > 0 ? upcoming[0] : null;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                {/* AI Conversational Widget */}
                {selectedDeptId && <AiQueryWidget departmentId={selectedDeptId} />}

                <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <WelcomeCard userName={userProfile?.usuario?.nombre || 'Servidor'} />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <UpcomingServiceCard nextService={nextService} />
                    </Grid.Col>
                </Grid>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                    <StatCard
                        title={shouldShowDeptStats ? "Asistencia Departamento" : "Mi Asistencia"}
                        value={`${attendanceRate}%`}
                        subtitle={shouldShowDeptStats ? `Promedio de todo el equipo` : `Tu promedio año ${dayjs().year()}`}
                        icon={<IconTrendingUp size={24} />}
                        color="teal"
                    />
                    <StatCard
                        title="Próximos Servicios"
                        value={upcomingCount}
                        icon={<IconCalendarEvent size={24} />}
                        color="gold"
                    />
                    <StatCard
                        title="Mes Pasado"
                        value={lastMonthTotal}
                        subtitle={(stats as any)?.lastMonthSummary?.month || ''}
                        icon={<IconChecklist size={24} />}
                        color="stone"
                    />
                    <StatCard
                        title="Departamentos"
                        value={Array.from(new Set(attendanceManagedDepartments?.map(d => d.id) || [])).length}
                        icon={<IconUsers size={24} />}
                        color="orange"
                    />
                </SimpleGrid>

                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Card withBorder p="md" radius="md" className="animate-fade-in hover-card">
                            <Group justify="space-between" mb="md">
                                <Title order={4} c="gold.5">Próximos Servicios</Title>
                                <Button
                                    variant="subtle"
                                    color="gold"
                                    size="xs"
                                    radius="xl"
                                    leftSection={<IconFileDownload size={16} />}
                                    loading={exporting}
                                    onClick={handleExportRole}
                                >
                                    Exportar Mi Rol (PDF)
                                </Button>
                            </Group>
                            {upcoming.length > 0 ? (
                                <Stack gap="xs">
                                    {upcoming.map((service: any) => {
                                        const configDia = getSingle(service.configuracion_dia);
                                        const pos = getSingle(service.posicion);
                                        const dept = getSingle(pos?.departamento);
                                        return (
                                            <Card key={service.id} withBorder padding="sm" radius="md" style={{
                                                background: 'var(--mantine-bg-tint, rgba(217, 119, 6, 0.05))',
                                                borderColor: 'var(--mantine-color-default-border)'
                                            }}>
                                                <Group justify="space-between">
                                                    <Stack gap={0}>
                                                        <Group gap={6}>
                                                            <Text size="xs" fw={700} c="gold.6" tt="uppercase">{dept?.nombre}</Text>
                                                        </Group>
                                                        <Text fw={600} c="stone.3">{configDia?.tipo_servicio}</Text>
                                                        <Text size="sm" c="stone.5">
                                                            {dayjs(configDia?.fecha).format('dddd, D [de] MMMM')}
                                                        </Text>
                                                    </Stack>
                                                    <Group>
                                                        <Badge color="stone" variant="light">{pos?.nombre}</Badge>
                                                        <Badge color={getUniformeColor(configDia?.color_uniforme)} variant="filled">
                                                            {configDia?.color_uniforme}
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                            </Card>
                                        )
                                    })}
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="xs">
                                    <IconCalendarOff size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                    <Text ta="center" c="dimmed">No tienes asignaciones programadas próximamente.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>

                    {attendanceManagedDepartments && attendanceManagedDepartments.length > 1 && (
                        <Grid.Col span={12}>
                            <Group justify="center" mb="md">
                                <Select
                                    label="Departamento para Estadísticas"
                                    placeholder="Selecciona un departamento"
                                    data={attendanceManagedDepartments
                                        .filter((d, index, self) =>
                                            index === self.findIndex(dept => dept.id === d.id)
                                        )
                                        .map(d => ({
                                            value: String(d.id),
                                            label: d.nombre
                                        }))}
                                    value={selectedDeptId ? String(selectedDeptId) : null}
                                    onChange={(val: string | null) => setSelectedDeptId(val ? Number(val) : null)}
                                    w={300}
                                    size="md"
                                    styles={{
                                        label: { fontWeight: 700, color: '#78716c' }
                                    }}
                                />
                            </Group>
                        </Grid.Col>
                    )}

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card withBorder p="md" radius="md" className="animate-fade-in hover-card">
                            <Group justify="space-between" mb="md">
                                <Title order={4} c="gold.5">
                                    {shouldShowDeptStats ? "Estado del Departamento" : "Mi Estado de Asistencia"}
                                </Title>
                                {shouldShowDeptStats && <Badge color="orange" variant="light">Vista Líder</Badge>}
                            </Group>
                            {stats ? (
                                <Stack align="center">
                                    <Box w="100%" h={220} style={{ minWidth: 0 }} role="img" aria-label={`Gráfico de donas mostrando: ${stats!.summary.asistio} asistieron, ${stats!.summary.faltoConAviso} faltas con aviso, ${stats!.summary.faltoSinAviso} faltas sin aviso.`}>
                                        <DonutChart
                                            h={220}
                                            data={[
                                                { name: 'Asistió', value: stats!.summary.asistio, color: 'teal.6' },
                                                { name: 'Justificado', value: stats!.summary.faltoConAviso, color: 'yellow.6' },
                                                { name: 'Faltó', value: stats!.summary.faltoSinAviso, color: 'red.6' },
                                            ]}
                                            tooltipDataSource="segment"
                                            withLabelsLine
                                            withLabels
                                        />
                                    </Box>
                                    <Group gap="xs">
                                        <Badge color="teal" variant="dot">Asistió</Badge>
                                        <Badge color="yellow" variant="dot">Justificado</Badge>
                                        <Badge color="red" variant="dot">Faltó</Badge>
                                    </Group>
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="xs">
                                    <IconUsers size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                    <Text ta="center" c="dimmed">No hay datos de asistencia todavía.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>

                    {stats && stats.byMonth && Object.keys(stats.byMonth).length > 0 && (
                        <Grid.Col span={12}>
                            <Card withBorder p="md" radius="md" className="animate-fade-in hover-card">
                                <Title order={4} mb="md" c="gold.5">Tendencia de Asistencia (Últimos Meses)</Title>
                                <Box w="100%" h={400} style={{ minWidth: 0 }} role="img" aria-label="Gráfico de barras mostrando la tendencia de asistencia y faltas en los últimos meses.">
                                    <BarChart
                                        h={400}
                                        data={Object.values(stats.byMonth)}
                                        dataKey="month"
                                        series={[
                                            { name: 'asistio', color: 'teal.6', label: 'Asistencias' },
                                            { name: 'faltas', color: 'red.6', label: 'Faltas' },
                                        ]}
                                        tickLine="y"
                                        gridAxis="xy"
                                        withLegend
                                    />
                                </Box>
                            </Card>
                        </Grid.Col>
                    )}
                </Grid>
            </Stack>

            {/* Template for export (Hidden) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {exportData && (
                    <PersonalRoleTemplate
                        ref={reportRef}
                        userName={`${userProfile?.usuario?.nombre} ${userProfile?.usuario?.apellido}`}
                        assignments={exportData}
                        month={dayjs().month() + 1}
                        year={dayjs().year()}
                    />
                )}
            </div>
        </Container>
    );
}
