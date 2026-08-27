import { useState, useEffect, type ReactNode } from 'react';
import {
    Container,
    Title,
    Text,
    Paper,
    Group,
    Stack,
    SimpleGrid,
    ThemeIcon,
    Tabs,
    Box,
    Badge,
    Progress,
    Center,
    Select,
    Table,
    Loader
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import {
    IconChartBar,
    IconCalendarStats,
    IconTrendingUp,
    IconCalendar,
    IconActivity,
    IconArrowUpRight,
    IconAlertTriangle,
    IconUsers,
    IconInfoCircle,
    IconBuildingCommunity,
    IconCheck,
    IconUser,
    IconX,
} from '@tabler/icons-react';
import { JUSTIFICATION_TYPES } from '../../constants/attendance';
import { attendanceService } from '../../services/attendanceService';
import dayjs from 'dayjs';
import { analyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import type { ChurnRiskUser } from '../../types';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../services/supabaseClient';

const TOOLTIP_PROPS = {
    allowEscapeViewBox: { x: false, y: false },
    offset: 10,
    wrapperStyle: { zIndex: 200 },
};

function Kpi({ label, value, valueColor, subText, icon }: {
    label: string;
    value: ReactNode;
    valueColor?: string;
    subText?: string;
    icon?: ReactNode;
}) {
    return (
        <Paper p="lg" radius="xl" withBorder>
            <Group justify="space-between" align="flex-start">
                <Stack gap={0}>
                    <Text className="section-label">{label}</Text>
                    <Text fw={900} size="2rem" c={valueColor} style={{ letterSpacing: '-0.02em' }}>{value}</Text>
                    {subText && <Text size="xs" c="dimmed" fw={600} mt={4}>{subText}</Text>}
                </Stack>
                {icon}
            </Group>
        </Paper>
    );
}

export default function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState<string | null>('weekly');
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const { managedDepartments } = useUser();
    const { isSystemAdmin } = usePermissions();

    const { data: allDepts } = useQuery({
        queryKey: ['allDepts'],
        queryFn: async () => {
            const { data, error } = await supabase.from('departamentos').select('id, nombre').order('nombre');
            if (error) throw error;
            return data as { id: number; nombre: string }[];
        },
        enabled: isSystemAdmin,
        staleTime: Infinity
    });

    const deptOptions = isSystemAdmin
        ? (allDepts ?? []).map(d => ({ value: String(d.id), label: d.nombre }))
        : managedDepartments.map(d => ({ value: String(d.id), label: d.nombre }));

    useEffect(() => {
        if (!selectedDeptId && deptOptions.length > 0) {
            setSelectedDeptId(deptOptions[0].value);
        }
    }, [deptOptions]);

    const deptId: number | null = selectedDeptId ? Number(selectedDeptId) : null;
    const selectedDeptName = deptOptions.find(d => d.value === selectedDeptId)?.label ?? null;

    const { data: monthlyStatsData, isLoading: loadingMonthly, isError: errorMonthly } = useQuery({
        queryKey: ['analytics', 'monthly', deptId],
        queryFn: () => analyticsService.fetchAttendanceStats(deptId!, 'YTD'),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: weeklyStatsData, isLoading: loadingWeekly, isError: errorWeekly } = useQuery({
        queryKey: ['analytics', 'weekly', deptId],
        queryFn: () => analyticsService.fetchWeeklyStats(deptId!),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: annualStatsData, isLoading: loadingAnnual, isError: errorAnnual } = useQuery({
        queryKey: ['analytics', 'annual', deptId],
        queryFn: () => analyticsService.fetchAnnualStats(deptId!),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: churnRiskData, isLoading: loadingChurn, isError: errorChurn } = useQuery({
        queryKey: ['analytics', 'churn', deptId],
        queryFn: () => analyticsService.fetchChurnRisk(deptId!),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: demographicData, isLoading: loadingDemographic, isError: errorDemographic } = useQuery({
        queryKey: ['analytics', 'demographics', deptId],
        queryFn: () => analyticsService.fetchDemographicDist(deptId!),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: punctualityData, isLoading: loadingPunctuality, isError: errorPunctuality } = useQuery({
        queryKey: ['analytics', 'punctuality', deptId],
        queryFn: () => analyticsService.fetchPunctualityTrends(deptId!),
        enabled: deptId != null,
        retry: 1,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 60,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    const { data: deptMembers } = useQuery({
        queryKey: ['deptMembers', deptId],
        queryFn: () => attendanceService.fetchDeptMembers(deptId!),
        enabled: deptId != null,
        staleTime: 60000,
    });

    const { data: memberAttendance, isLoading: loadingMember, isError: errorMember } = useQuery({
        queryKey: ['memberAttendance', selectedMemberId],
        queryFn: () => attendanceService.fetchPersonalAttendance(Number(selectedMemberId)),
        enabled: !!selectedMemberId,
    });

    const isLoading = deptId == null || loadingWeekly || loadingMonthly || loadingAnnual || loadingChurn || loadingDemographic || loadingPunctuality;
    const hasError = errorWeekly || errorMonthly || errorAnnual || errorChurn || errorDemographic || errorPunctuality;
    const weeklyStats = weeklyStatsData || [];
    const annualStats = annualStatsData || null;

    const renderWeekly = () => {
        const totalPresent = weeklyStats.reduce((acc, w) => acc + w.present, 0);
        const totalRecords = weeklyStats.reduce((acc, w) => acc + w.total, 0);
        const avgRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
        const lastWeek = weeklyStats[weeklyStats.length - 1];
        const prevWeek = weeklyStats[weeklyStats.length - 2];
        const rateDiff = lastWeek && prevWeek && prevWeek.total > 0
            ? lastWeek.rate - prevWeek.rate
            : null;

        const chartData = weeklyStats.map(w => ({
            semana: w.weekStart,
            Presentes: w.present,
            Ausentes: w.absent,
            Tasa: w.rate,
        }));

        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Paper p="lg" radius="xl" withBorder>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text className="section-label">Tasa Promedio</Text>
                                <Text fw={900} size="2rem" style={{ letterSpacing: '-0.02em' }}>{avgRate}%</Text>
                                {rateDiff !== null && (
                                    <Group gap={4} mt={4}>
                                        <IconArrowUpRight size={14} color={rateDiff >= 0 ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'} style={{ transform: rateDiff < 0 ? 'rotate(90deg)' : undefined }} />
                                        <Text size="xs" c={rateDiff >= 0 ? 'teal.6' : 'red.6'} fw={700}>{rateDiff >= 0 ? '+' : ''}{rateDiff}% vs semana anterior</Text>
                                    </Group>
                                )}
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="gold"><IconTrendingUp size={24} /></ThemeIcon>
                        </Group>
                    </Paper>

                    <Kpi
                        label="Total Presentes"
                        value={totalPresent}
                        subText={`de ${totalRecords} registros (12 sem.)`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="blue"><IconCalendarStats size={24} /></ThemeIcon>}
                    />

                    <Kpi
                        label="Última Semana"
                        value={`${lastWeek?.rate ?? 0}%`}
                        subText={lastWeek ? `${lastWeek.present} presentes · ${lastWeek.absent} ausentes` : 'Sin datos'}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="orange"><IconActivity size={24} /></ThemeIcon>}
                    />
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder style={{ overflow: 'hidden' }}>
                    <Group justify="space-between" mb="xl">
                        <Stack gap={0}>
                            <Title order={4}>Tendencia de Participación</Title>
                            <Text size="xs" c="dimmed" fw={600}>Presentes y ausentes por semana — últimas 12 semanas</Text>
                        </Stack>
                        <Group gap="lg">
                            <Group gap={6}>
                                <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--mantine-color-teal-6)' }} />
                                <Text size="xs" fw={700} c="dimmed">Presentes</Text>
                            </Group>
                            <Group gap={6}>
                                <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--mantine-color-red-5)' }} />
                                <Text size="xs" fw={700} c="dimmed">Ausentes</Text>
                            </Group>
                        </Group>
                    </Group>

                    {chartData.length === 0 ? (
                        <Center py="xl"><Text c="dimmed" fw={600}>Sin datos semanales disponibles</Text></Center>
                    ) : (
                        <Box h={340} style={{ overflow: 'hidden' }}>
                            <BarChart
                                h="100%"
                                data={chartData}
                                dataKey="semana"
                                type="stacked"
                                series={[
                                    { name: 'Presentes', color: 'teal.6' },
                                    { name: 'Ausentes', color: 'red.5' },
                                ]}
                                gridAxis="y"
                                tickLine="y"
                                withTooltip
                                tooltipProps={TOOLTIP_PROPS}
                                xAxisProps={{ tick: { fontSize: 11, fontWeight: 600 }, interval: 0, angle: -35, textAnchor: 'end', height: 55 }}
                                yAxisProps={{ tick: { fontSize: 11 }, width: 35 }}
                            />
                        </Box>
                    )}
                </Paper>
            </Stack>
        );
    };

    const renderMonthly = () => {
        const byMonth = monthlyStatsData?.byMonth ?? {};
        const summary = monthlyStatsData?.summary ?? { total: 0, asistio: 0, faltoConAviso: 0, faltoSinAviso: 0 };

        const monthEntries = Object.values(byMonth as Record<string, { month: string; asistio: number; faltas: number }>)
            .sort((a, b) => dayjs(a.month, 'MMM YYYY').unix() - dayjs(b.month, 'MMM YYYY').unix());

        const chartData = monthEntries.map(m => ({
            mes: m.month,
            Asistencias: m.asistio,
            Faltas: m.faltas,
            Tasa: m.asistio + m.faltas > 0 ? Math.round((m.asistio / (m.asistio + m.faltas)) * 100) : 0
        }));

        const bestMonth = [...monthEntries].sort((a, b) => {
            const rateA = a.asistio + a.faltas > 0 ? a.asistio / (a.asistio + a.faltas) : 0;
            const rateB = b.asistio + b.faltas > 0 ? b.asistio / (b.asistio + b.faltas) : 0;
            return rateB - rateA;
        })[0];

        const worstMonth = [...monthEntries].sort((a, b) => {
            const rateA = a.asistio + a.faltas > 0 ? a.asistio / (a.asistio + a.faltas) : 1;
            const rateB = b.asistio + b.faltas > 0 ? b.asistio / (b.asistio + b.faltas) : 1;
            return rateA - rateB;
        })[0];

        const overallRate = summary.total > 0 ? Math.round((summary.asistio / summary.total) * 100) : 0;
        const totalFaltas = summary.faltoConAviso + summary.faltoSinAviso;

        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Kpi
                        label="Tasa Global YTD"
                        value={`${overallRate}%`}
                        subText={`${summary.asistio} de ${summary.total} registros`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconTrendingUp size={24} /></ThemeIcon>}
                    />
                    <Kpi
                        label="Mejor Mes"
                        value={bestMonth?.month ?? '—'}
                        subText={bestMonth ? `${Math.round((bestMonth.asistio / (bestMonth.asistio + bestMonth.faltas)) * 100)}% asistencia` : '—'}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconArrowUpRight size={24} /></ThemeIcon>}
                    />
                    <Kpi
                        label="Total Faltas YTD"
                        value={totalFaltas}
                        valueColor="red.6"
                        subText={`${summary.faltoConAviso} c/aviso · ${summary.faltoSinAviso} s/aviso`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="red"><IconAlertTriangle size={24} /></ThemeIcon>}
                    />
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder>
                    <Stack gap={0} mb="xl">
                        <Title order={4}>Asistencia por Mes</Title>
                        <Text size="xs" c="dimmed" fw={600}>Comparativa mensual de presencias y ausencias</Text>
                    </Stack>
                    {chartData.length > 0 ? (
                        <Box h={320} style={{ overflow: 'hidden' }}>
                            <BarChart
                                h="100%"
                                data={chartData}
                                dataKey="mes"
                                series={[
                                    { name: 'Asistencias', color: 'teal.6' },
                                    { name: 'Faltas', color: 'red.5' },
                                ]}
                                withLegend
                                gridAxis="y"
                                tickLine="y"
                                tooltipProps={TOOLTIP_PROPS}
                            />
                        </Box>
                    ) : (
                        <Center py="xl"><Text c="dimmed" fw={600}>Sin datos mensuales disponibles</Text></Center>
                    )}
                </Paper>

                {monthEntries.length > 0 && (
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Paper p="xl" radius="xl" withBorder>
                            <Text fw={800} size="lg" mb="md">Resumen por Mes</Text>
                            <Stack gap="sm">
                                {monthEntries.map(m => {
                                    const rate = m.asistio + m.faltas > 0 ? Math.round((m.asistio / (m.asistio + m.faltas)) * 100) : 0;
                                    return (
                                        <Box key={m.month}>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm" fw={700}>{m.month}</Text>
                                                <Group gap="xs">
                                                    <Badge color={rate >= 80 ? 'teal' : rate >= 60 ? 'orange' : 'red'} variant="light" size="sm">{rate}%</Badge>
                                                    <Text size="xs" c="dimmed">{m.asistio}/{m.asistio + m.faltas}</Text>
                                                </Group>
                                            </Group>
                                            <Progress value={rate} color={rate >= 80 ? 'teal' : rate >= 60 ? 'orange' : 'red'} size="sm" radius="xl" />
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>

                        <Paper p="xl" radius="xl" withBorder>
                            <Group gap="xs" mb="md">
                                <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                                <Text fw={800} size="lg">Análisis</Text>
                            </Group>
                            <Stack gap="sm">
                                {bestMonth && (
                                    <Group gap="xs" align="flex-start">
                                        <Badge color="green" variant="light" size="sm">Mejor</Badge>
                                        <Text size="sm" fw={600} style={{ flex: 1 }}>
                                            {bestMonth.month} tuvo la mayor asistencia con {Math.round((bestMonth.asistio / (bestMonth.asistio + bestMonth.faltas)) * 100)}%
                                        </Text>
                                    </Group>
                                )}
                                {worstMonth && worstMonth.month !== bestMonth?.month && (
                                    <Group gap="xs" align="flex-start">
                                        <Badge color="orange" variant="light" size="sm">Alerta</Badge>
                                        <Text size="sm" fw={600} style={{ flex: 1 }}>
                                            {worstMonth.month} registró la menor asistencia con {Math.round((worstMonth.asistio / (worstMonth.asistio + worstMonth.faltas)) * 100)}%
                                        </Text>
                                    </Group>
                                )}
                                <Group gap="xs" align="flex-start">
                                    <Badge color="blue" variant="light" size="sm">Info</Badge>
                                    <Text size="sm" fw={600} style={{ flex: 1 }}>
                                        {overallRate >= 80
                                            ? 'El equipo mantiene un nivel de compromiso saludable en el año.'
                                            : overallRate >= 60
                                                ? 'La asistencia es moderada. Se recomienda seguimiento personalizado.'
                                                : 'La asistencia está por debajo del nivel óptimo. Se requiere atención inmediata.'}
                                    </Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                )}
            </Stack>
        );
    };

    const renderInsights = () => {
        const churn = churnRiskData || [];
        const punct = punctualityData || [];
        const totalPunct = punct.reduce((acc: number, p: any) => acc + p.count, 0);
        const criticalChurn = churn.filter((u: ChurnRiskUser) => u.riskScore > 75);
        const moderateChurn = churn.filter((u: ChurnRiskUser) => u.riskScore <= 75);

        const summary = monthlyStatsData?.summary ?? { total: 0, asistio: 0, faltoConAviso: 0, faltoSinAviso: 0 };
        const overallRate = summary.total > 0 ? Math.round((summary.asistio / summary.total) * 100) : 0;

        const stateColors: Record<string, string> = {
            'Asistió': 'teal',
            'Faltó con Aviso': 'orange',
            'Faltó sin Aviso': 'red',
        };

        const recommendations: { color: string; label: string; text: string }[] = [];
        if (criticalChurn.length > 0)
            recommendations.push({ color: 'red', label: 'Urgente', text: `${criticalChurn.length} servidor${criticalChurn.length > 1 ? 'es' : ''} con riesgo crítico (>75%). Se recomienda contacto inmediato para entender su situación.` });
        if (moderateChurn.length > 0)
            recommendations.push({ color: 'orange', label: 'Atención', text: `${moderateChurn.length} servidor${moderateChurn.length > 1 ? 'es' : ''} con riesgo moderado. Monitorear de cerca en las próximas semanas.` });
        if (overallRate >= 85)
            recommendations.push({ color: 'teal', label: 'Destacado', text: 'La tasa de asistencia es excelente. Buen momento para asignar nuevas responsabilidades o capacitaciones.' });
        else if (overallRate >= 70)
            recommendations.push({ color: 'blue', label: 'Estable', text: 'La asistencia es moderada. Considerar reforzar el seguimiento semanal del equipo.' });
        else if (overallRate > 0)
            recommendations.push({ color: 'red', label: 'Crítico', text: 'La tasa de asistencia es baja. Se recomienda una reunión con el equipo de liderazgo para identificar causas.' });
        if (recommendations.length === 0)
            recommendations.push({ color: 'gray', label: 'Sin datos', text: 'No hay suficientes datos recientes para generar recomendaciones.' });

        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Kpi
                        label="En Riesgo"
                        value={churn.length}
                        valueColor={churn.length > 0 ? 'orange.6' : 'teal.6'}
                        subText="Últimas 4 semanas"
                    />
                    <Kpi
                        label="Riesgo Crítico"
                        value={criticalChurn.length}
                        valueColor={criticalChurn.length > 0 ? 'red.6' : 'teal.6'}
                        subText="Más del 75% faltas"
                    />
                    <Kpi
                        label="Tasa Global"
                        value={`${overallRate}%`}
                        valueColor={overallRate >= 80 ? 'teal.6' : overallRate >= 60 ? 'orange.6' : 'red.6'}
                        subText="Asistencia YTD"
                    />
                    <Kpi
                        label="Registros"
                        value={summary.total}
                        subText="Total analizados"
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Paper p="xl" radius="xl" withBorder>
                        <Group justify="space-between" mb="lg">
                            <Stack gap={0}>
                                <Title order={4}>Riesgo de Deserción</Title>
                                <Text size="xs" c="dimmed" fw={600}>Servidores con ≥50% faltas en las últimas 4 semanas</Text>
                            </Stack>
                            <ThemeIcon color={churn.length > 0 ? 'orange' : 'teal'} variant="light" radius="xl" size="lg">
                                <IconAlertTriangle size={20} />
                            </ThemeIcon>
                        </Group>
                        {churn.length > 0 ? (
                            <Stack gap="md">
                                {churn.map((u: ChurnRiskUser) => {
                                    const color = u.riskScore > 75 ? 'red' : 'orange';
                                    const total = u.asistencias + u.faltas;
                                    return (
                                        <Paper key={u.id} p="sm" radius="lg" withBorder style={{ borderColor: `var(--mantine-color-${color}-3)`, backgroundColor: `var(--mantine-color-${color}-0)` }}>
                                            <Group justify="space-between" mb={6}>
                                                <Group gap="sm">
                                                    <Box style={{ width: 32, height: 32, borderRadius: '50%', background: `var(--mantine-color-${color}-6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                                                        {u.nombre[0]}{u.apellido[0]}
                                                    </Box>
                                                    <Stack gap={0}>
                                                        <Text size="sm" fw={800}>{u.nombre} {u.apellido}</Text>
                                                        <Text size="xs" c="dimmed" fw={600}>{u.faltas} faltas · {u.asistencias} presencias · {total} servicios</Text>
                                                    </Stack>
                                                </Group>
                                                <Badge color={color} variant="filled" radius="sm" size="sm" fw={800}>{u.riskScore}%</Badge>
                                            </Group>
                                            <Progress value={u.riskScore} color={color} size="xs" radius="xl" />
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <ThemeIcon size={48} radius="xl" variant="light" color="teal"><IconCheck size={26} /></ThemeIcon>
                                    <Text size="sm" fw={700} c="teal.7">Sin servidores en riesgo</Text>
                                    <Text size="xs" c="dimmed" ta="center">El equipo mantiene una asistencia saludable en las últimas 4 semanas.</Text>
                                </Stack>
                            </Center>
                        )}
                    </Paper>

                    <Paper p="xl" radius="xl" withBorder>
                        <Group gap="xs" mb="lg">
                            <ThemeIcon color="indigo" variant="light" size="lg" radius="md"><IconChartBar size={18} /></ThemeIcon>
                            <Stack gap={0}>
                                <Text fw={800} size="lg">Distribución de Asistencia</Text>
                                <Text size="xs" c="dimmed" fw={600}>Desglose por estado — últimos 3 meses</Text>
                            </Stack>
                        </Group>
                        {punct.length > 0 ? (
                            <Stack gap="md">
                                {punct.map((p: any) => {
                                    const pct = totalPunct > 0 ? Math.round((p.count / totalPunct) * 100) : 0;
                                    const color = stateColors[p.label] || 'gray';
                                    return (
                                        <Box key={p.label}>
                                            <Group justify="space-between" mb={5}>
                                                <Group gap="xs">
                                                    <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--mantine-color-${color}-6)`, flexShrink: 0 }} />
                                                    <Text size="sm" fw={700}>{p.label}</Text>
                                                </Group>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={800}>{p.count}</Text>
                                                    <Badge variant="light" color={color} size="sm">{pct}%</Badge>
                                                </Group>
                                            </Group>
                                            <Progress value={pct} color={color} size="md" radius="xl" />
                                        </Box>
                                    );
                                })}
                                <Box mt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 8 }}>
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed" fw={700}>Total registros</Text>
                                        <Text size="xs" fw={800}>{totalPunct}</Text>
                                    </Group>
                                </Box>
                            </Stack>
                        ) : (
                            <Center py="xl"><Text c="dimmed" size="sm">Sin datos de asistencia disponibles</Text></Center>
                        )}
                    </Paper>
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder>
                    <Group gap="xs" mb="lg">
                        <ThemeIcon color="blue" variant="light" size="lg" radius="md"><IconInfoCircle size={18} /></ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={800} size="lg">Recomendaciones</Text>
                            <Text size="xs" c="dimmed" fw={600}>Generadas en base a los datos actuales del departamento</Text>
                        </Stack>
                    </Group>
                    <Stack gap="sm">
                        {recommendations.map((r, i) => (
                            <Group key={i} gap="sm" align="flex-start" p="sm" style={{ borderRadius: 10, backgroundColor: `var(--mantine-color-${r.color}-0)`, border: `1px solid var(--mantine-color-${r.color}-2)` }}>
                                <Badge color={r.color} variant="filled" size="sm" radius="sm" style={{ flexShrink: 0, marginTop: 1 }}>{r.label}</Badge>
                                <Text size="sm" fw={600} style={{ flex: 1 }}>{r.text}</Text>
                            </Group>
                        ))}
                    </Stack>
                </Paper>
            </Stack>
        );
    };

    const renderDemographics = () => {
        const demo = demographicData || { gender: { male: 0, female: 0 }, ageRanges: {} };
        const totalGender = demo.gender.male + demo.gender.female;
        const malePercent = totalGender > 0 ? Math.round((demo.gender.male / totalGender) * 100) : 0;
        const femalePercent = totalGender > 0 ? Math.round((demo.gender.female / totalGender) * 100) : 0;

        const AGE_COLORS = ['indigo.5', 'violet.5', 'blue.5', 'teal.5', 'cyan.5'];
        const ageEntries = Object.entries(demo.ageRanges as Record<string, number>)
            .filter(([, v]) => v > 0);
        const totalAge = ageEntries.reduce((acc, [, v]) => acc + v, 0);
        const ageData = ageEntries.map(([name, value]) => ({ name, value }));

        const donutData = [
            { name: 'Hombres', value: demo.gender.male, color: 'blue.6' },
            { name: 'Mujeres', value: demo.gender.female, color: 'pink.5' },
        ].filter(d => d.value > 0);

        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Kpi label="Total Miembros" value={totalGender} subText="En el departamento" />
                    <Kpi label="Hombres" value={demo.gender.male} valueColor="blue.6" subText={`${malePercent}% del total`} />
                    <Kpi label="Mujeres" value={demo.gender.female} valueColor="pink.5" subText={`${femalePercent}% del total`} />
                    <Kpi label="Con edad registrada" value={totalAge} subText={`de ${totalGender} miembros`} />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Paper p="xl" radius="xl" withBorder>
                        <Title order={4} mb="lg">Distribución por Género</Title>
                        {donutData.length > 0 ? (
                            <Stack gap="lg">
                                <Center>
                                    <DonutChart
                                        data={donutData}
                                        size={200}
                                        thickness={30}
                                        paddingAngle={3}
                                        tooltipDataSource="segment"
                                        tooltipProps={TOOLTIP_PROPS}
                                    />
                                </Center>
                                <Stack gap="sm">
                                    {[
                                        { label: 'Hombres', value: demo.gender.male, percent: malePercent, color: 'var(--mantine-color-blue-6)' },
                                        { label: 'Mujeres', value: demo.gender.female, percent: femalePercent, color: 'var(--mantine-color-pink-5)' },
                                    ].map(item => (
                                        <Box key={item.label}>
                                            <Group justify="space-between" mb={4}>
                                                <Group gap="xs">
                                                    <Box style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                                                    <Text size="sm" fw={700}>{item.label}</Text>
                                                </Group>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={800}>{item.value}</Text>
                                                    <Badge variant="light" color={item.label === 'Hombres' ? 'blue' : 'pink'} size="sm">{item.percent}%</Badge>
                                                </Group>
                                            </Group>
                                            <Progress value={item.percent} color={item.label === 'Hombres' ? 'blue' : 'pink'} size="sm" radius="xl" />
                                        </Box>
                                    ))}
                                </Stack>
                            </Stack>
                        ) : (
                            <Center py="xl"><Text c="dimmed">Sin datos de género disponibles</Text></Center>
                        )}
                    </Paper>

                    <Paper p="xl" radius="xl" withBorder>
                        <Title order={4} mb="lg">Rangos de Edad</Title>
                        {ageData.length > 0 ? (
                            <Stack gap="sm">
                                {ageData.map(({ name, value }, i) => {
                                    const pct = totalAge > 0 ? Math.round((value / totalAge) * 100) : 0;
                                    const color = AGE_COLORS[i % AGE_COLORS.length];
                                    return (
                                        <Box key={name}>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm" fw={700}>{name} años</Text>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={800}>{value}</Text>
                                                    <Badge variant="light" color={color.split('.')[0]} size="sm">{pct}%</Badge>
                                                </Group>
                                            </Group>
                                            <Progress value={pct} color={color} size="md" radius="xl" />
                                        </Box>
                                    );
                                })}
                                <Box mt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 8 }}>
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed" fw={700}>Total con edad registrada</Text>
                                        <Text size="xs" fw={800}>{totalAge} personas</Text>
                                    </Group>
                                </Box>
                            </Stack>
                        ) : (
                            <Center py="xl"><Text c="dimmed">Sin datos de edad disponibles</Text></Center>
                        )}
                    </Paper>
                </SimpleGrid>
            </Stack>
        );
    };

    const renderAnnual = () => {
        const heatmapRaw = annualStats?.heatmapData || [];
        const dateMap: Record<string, number> = Object.fromEntries(heatmapRaw.map((d: { date: string; count: number }) => [d.date, d.count]));

        const summary = monthlyStatsData?.summary ?? { total: 0, asistio: 0, faltoConAviso: 0, faltoSinAviso: 0 };
        const byMonth = monthlyStatsData?.byMonth ?? {};
        const annualRate = summary.total > 0 ? Math.round((summary.asistio / summary.total) * 100) : 0;
        const totalFaltas = summary.faltoConAviso + summary.faltoSinAviso;

        const monthChartData = Object.values(byMonth as Record<string, { month: string; asistio: number; faltas: number }>)
            .sort((a, b) => dayjs(a.month, 'MMM YYYY').unix() - dayjs(b.month, 'MMM YYYY').unix())
            .map(m => ({ mes: m.month, Asistencias: m.asistio, Faltas: m.faltas }));

        const today = dayjs();
        const startOfYear = dayjs().startOf('year');
        const months: { label: string; days: { date: string; count: number }[] }[] = [];
        for (let m = 0; m <= today.month(); m++) {
            const monthStart = startOfYear.month(m).startOf('month');
            const monthEnd = monthStart.endOf('month');
            const days: { date: string; count: number }[] = [];
            let cur = monthStart;
            while (!cur.isAfter(monthEnd) && !cur.isAfter(today)) {
                const key = cur.format('YYYY-MM-DD');
                days.push({ date: key, count: dateMap[key] || 0 });
                cur = cur.add(1, 'day');
            }
            months.push({ label: monthStart.format('MMM'), days });
        }

        const getHeatColor = (count: number) => {
            if (count === 0) return 'var(--mantine-color-gray-2)';
            if (count < 10) return 'var(--mantine-color-teal-2)';
            if (count < 20) return 'var(--mantine-color-teal-4)';
            if (count < 30) return 'var(--mantine-color-teal-6)';
            return 'var(--mantine-color-teal-8)';
        };

        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Kpi
                        label="Asistencias"
                        value={annualStats?.totalServices || 0}
                        subText={`Año ${dayjs().year()}`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconChartBar size={22} /></ThemeIcon>}
                    />
                    <Kpi
                        label="Tasa Anual"
                        value={`${annualRate}%`}
                        valueColor={annualRate >= 80 ? 'teal.6' : annualRate >= 60 ? 'orange.6' : 'red.6'}
                        subText={`de ${summary.total} registros`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="indigo"><IconTrendingUp size={22} /></ThemeIcon>}
                    />
                    <Kpi
                        label="Días Activos"
                        value={annualStats?.uniqueDates || 0}
                        subText="Con al menos 1 asistencia"
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="grape"><IconCalendar size={22} /></ThemeIcon>}
                    />
                    <Kpi
                        label="Total Faltas"
                        value={totalFaltas}
                        valueColor="red.6"
                        subText={`${summary.faltoConAviso} c/aviso · ${summary.faltoSinAviso} s/aviso`}
                        icon={<ThemeIcon size="xl" radius="lg" variant="light" color="red"><IconAlertTriangle size={22} /></ThemeIcon>}
                    />
                </SimpleGrid>

                {monthChartData.length > 0 && (
                    <Paper p="xl" radius="xl" withBorder style={{ overflow: 'hidden' }}>
                        <Stack gap={0} mb="xl">
                            <Title order={4}>Asistencia Mensual</Title>
                            <Text size="xs" c="dimmed" fw={600}>Comparativa acumulada de presencias y ausencias por mes</Text>
                        </Stack>
                        <Box h={280} style={{ overflow: 'hidden' }}>
                            <BarChart
                                h="100%"
                                data={monthChartData}
                                dataKey="mes"
                                type="stacked"
                                series={[
                                    { name: 'Asistencias', color: 'teal.6' },
                                    { name: 'Faltas', color: 'red.5' },
                                ]}
                                withLegend
                                gridAxis="y"
                                tooltipProps={TOOLTIP_PROPS}
                            />
                        </Box>
                    </Paper>
                )}

                <Paper p="xl" radius="xl" withBorder>
                    <Group justify="space-between" align="center" mb="lg">
                        <Stack gap={0}>
                            <Title order={4}>Mapa de Actividad {dayjs().year()}</Title>
                            <Text size="xs" c="dimmed" fw={600}>Intensidad de asistencias por día</Text>
                        </Stack>
                        <Group gap="xs">
                            <Text size="xs" c="dimmed" fw={600}>Menos</Text>
                            {['var(--mantine-color-gray-2)', 'var(--mantine-color-teal-2)', 'var(--mantine-color-teal-4)', 'var(--mantine-color-teal-6)', 'var(--mantine-color-teal-8)'].map((c, i) => (
                                <Box key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
                            ))}
                            <Text size="xs" c="dimmed" fw={600}>Más</Text>
                        </Group>
                    </Group>

                    <Box style={{ overflowX: 'auto' }}>
                        <Group gap="md" align="flex-start" wrap="nowrap" pb="xs">
                            {months.map(month => (
                                <Stack key={month.label} gap={4} align="center" style={{ minWidth: 0 }}>
                                    <Text size="10px" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: 'var(--ls-label)' }}>{month.label}</Text>
                                    <Group gap={3} wrap="wrap" style={{ maxWidth: 90 }}>
                                        {month.days.map(d => (
                                            <Box
                                                key={d.date}
                                                title={`${d.date}: ${d.count} asistencia${d.count !== 1 ? 's' : ''}`}
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 2,
                                                    backgroundColor: getHeatColor(d.count),
                                                    cursor: d.count > 0 ? 'pointer' : 'default',
                                                    flexShrink: 0
                                                }}
                                            />
                                        ))}
                                    </Group>
                                    <Text size="10px" c="dimmed" fw={600}>{month.days.filter(d => d.count > 0).length} días</Text>
                                </Stack>
                            ))}
                        </Group>
                    </Box>
                </Paper>
            </Stack>
        );
    };

    const renderServerStats = () => {
        const memberOptions = (deptMembers || []).map(m => ({
            value: String(m.id),
            label: `${m.nombre} ${m.apellido}`,
        }));

        const records = memberAttendance || [];
        const total = records.length;
        const asistio = records.filter((r: any) => r.estado === 'Asistió').length;
        const justificada = records.filter((r: any) => r.estado === 'Faltó con Aviso').length;
        const sinAviso = records.filter((r: any) => r.estado === 'Faltó sin Aviso').length;
        const rate = total > 0 ? Math.round((asistio / total) * 100) : 0;
        const rateColor = rate >= 80 ? 'teal' : rate >= 60 ? 'orange' : 'red';

        const justifLabels = Object.fromEntries(JUSTIFICATION_TYPES.map(j => [j.value, j.label]));

        const getStatusColor = (estado: string) => {
            if (estado === 'Asistió') return 'teal';
            if (estado === 'Faltó con Aviso') return 'yellow';
            return 'red';
        };

        return (
            <Stack gap="xl" className="animate-fade-in">
                <Paper p="xl" radius="xl" withBorder>
                    <Select
                        label="Seleccionar servidor"
                        placeholder="Buscar servidor del departamento..."
                        data={memberOptions}
                        value={selectedMemberId}
                        onChange={setSelectedMemberId}
                        searchable
                        leftSection={<IconUser size={18} color="var(--mantine-color-gold-6)" />}
                        radius="md"
                        size="md"
                        nothingFoundMessage="No se encontró el servidor"
                    />
                </Paper>

                {!selectedMemberId && (
                    <Paper p="xl" radius="xl" withBorder style={{ borderStyle: 'dashed' }}>
                        <Center py="lg">
                            <Stack align="center" gap="sm">
                                <ThemeIcon size={56} radius="xl" variant="light" color="gold">
                                    <IconUser size={28} />
                                </ThemeIcon>
                                <Text fw={700} size="lg">Selecciona un servidor</Text>
                                <Text c="dimmed" size="sm" ta="center">
                                    Elige un servidor del departamento para ver su historial y estadísticas de asistencia.
                                </Text>
                            </Stack>
                        </Center>
                    </Paper>
                )}

                {selectedMemberId && loadingMember && (
                    <Center py="xl">
                        <Stack align="center" gap="md">
                            <Loader color="gold" size="md" />
                            <Text c="dimmed" fw={600}>Cargando historial...</Text>
                        </Stack>
                    </Center>
                )}

                {selectedMemberId && errorMember && !loadingMember && (
                    <Center py="xl">
                        <Stack align="center" gap="sm">
                            <ThemeIcon size={52} radius="xl" variant="light" color="orange">
                                <IconAlertTriangle size={26} stroke={1.5} />
                            </ThemeIcon>
                            <Text fw={700} c="orange.7">No se pudo cargar el historial</Text>
                            <Text size="sm" c="dimmed" ta="center">Intenta seleccionar otro servidor o recargar la página.</Text>
                        </Stack>
                    </Center>
                )}

                {selectedMemberId && !loadingMember && !errorMember && (
                    <Stack gap="xl">
                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                            <Kpi
                                label="Tasa de Asistencia"
                                value={`${rate}%`}
                                valueColor={`${rateColor}.6`}
                                subText={`${asistio} de ${total} servicios`}
                            />
                            <Kpi
                                label="Presencias"
                                value={asistio}
                                valueColor="teal.6"
                                subText="Asistencias confirmadas"
                            />
                            <Kpi
                                label="Justificadas"
                                value={justificada}
                                valueColor="yellow.6"
                                subText="No cuentan como falta"
                            />
                            <Kpi
                                label="Faltas s/aviso"
                                value={sinAviso}
                                valueColor="red.6"
                                subText="Ausencias injustificadas"
                            />
                        </SimpleGrid>

                        <Paper p="lg" radius="xl" withBorder>
                            <Group justify="space-between" mb="md">
                                <Stack gap={0}>
                                    <Text fw={800} size="lg">Tasa de asistencia real</Text>
                                    <Text size="xs" c="dimmed" fw={600}>Excluyendo ausencias justificadas</Text>
                                </Stack>
                                <Badge color={rateColor} variant="filled" size="lg" radius="sm" fw={800}>{rate}%</Badge>
                            </Group>
                            <Progress value={rate} color={rateColor} size="lg" radius="xl" />
                        </Paper>

                        <Paper shadow="sm" radius="xl" withBorder style={{ overflow: 'hidden' }}>
                            <Table.ScrollContainer minWidth={500}>
                                <Table verticalSpacing="sm" highlightOnHover>
                                    <Table.Thead style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                                        <Table.Tr>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 20 }}>Fecha</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Servicio</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estado</Table.Th>
                                            <Table.Th style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Justificación</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {records.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td colSpan={4}>
                                                    <Center py="xl">
                                                        <Text c="dimmed" fw={600}>Sin registros de asistencia</Text>
                                                    </Center>
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : records.map((rec: any) => {
                                            const config = Array.isArray(rec.configuracion_dia) ? rec.configuracion_dia[0] : rec.configuracion_dia;
                                            const tipoLabel = rec.tipo_justificacion
                                                ? justifLabels[rec.tipo_justificacion] ?? rec.tipo_justificacion
                                                : null;
                                            return (
                                                <Table.Tr key={rec.id}>
                                                    <Table.Td style={{ paddingLeft: 20 }}>
                                                        <Text size="sm" fw={700}>
                                                            {config?.fecha ? dayjs(config.fecha).format('DD/MM/YYYY') : '—'}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge variant="light" color="blue" size="sm">
                                                            {config?.tipo_servicio || 'N/A'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            color={getStatusColor(rec.estado)}
                                                            variant="filled"
                                                            size="sm"
                                                            leftSection={
                                                                rec.estado === 'Asistió' ? <IconCheck size={12} /> :
                                                                rec.estado === 'Faltó con Aviso' ? <IconInfoCircle size={12} /> :
                                                                <IconX size={12} />
                                                            }
                                                        >
                                                            {rec.estado}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {tipoLabel ? (
                                                            <Group gap={4} wrap="nowrap">
                                                                <Badge variant="light" color="gray" size="xs">{tipoLabel}</Badge>
                                                                {rec.justificacion && (
                                                                    <Text size="xs" c="dimmed" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {rec.justificacion}
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                        ) : (
                                                            <Text size="xs" c="dimmed" fs="italic">—</Text>
                                                        )}
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        </Paper>
                    </Stack>
                )}
            </Stack>
        );
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
                    <Stack gap={0}>
                        <Title order={1} style={{
                            fontSize: 'var(--text-display)',
                            letterSpacing: 'var(--ls-display)',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Panel de Impacto
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Analítica avanzada de participación y asistencia</Text>
                    </Stack>

                    {deptOptions.length > 1 ? (
                        <Select
                            placeholder="Seleccionar departamento"
                            data={deptOptions}
                            value={selectedDeptId}
                            onChange={setSelectedDeptId}
                            leftSection={<IconBuildingCommunity size={18} />}
                            radius="md"
                            size="md"
                            w={220}
                            styles={{ input: { fontWeight: 700 } }}
                        />
                    ) : selectedDeptName ? (
                        <Badge color="gold" variant="light" size="lg" radius="md" fw={700}>
                            {selectedDeptName}
                        </Badge>
                    ) : null}
                </Group>

                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="xl">
                    <Tabs.List style={{
                        padding: '6px',
                        borderRadius: '100px',
                        border: '1px solid var(--mantine-color-default-border)',
                        width: 'fit-content',
                        backgroundColor: 'var(--mantine-color-body)'
                    }}>
                        <Tabs.Tab value="weekly" leftSection={<IconTrendingUp size={18} />} fw={700}>Semanal</Tabs.Tab>
                        <Tabs.Tab value="monthly" leftSection={<IconChartBar size={18} />} fw={700}>Mensual</Tabs.Tab>
                        <Tabs.Tab value="annual" leftSection={<IconCalendarStats size={18} />} fw={700}>Anual</Tabs.Tab>
                        <Tabs.Tab value="demographics" leftSection={<IconUsers size={18} />} fw={700}>Demografía</Tabs.Tab>
                        <Tabs.Tab value="insights" leftSection={<IconActivity size={18} />} fw={700}>Insights</Tabs.Tab>
                        <Tabs.Tab value="servidor" leftSection={<IconUser size={18} />} fw={700}>Por Servidor</Tabs.Tab>
                    </Tabs.List>

                    <Box mt="xl">
                        {isLoading ? (
                            <Center py="xl">
                                <Stack align="center" gap="md">
                                    <Loader color="gold" size="xl" />
                                    <Text c="dimmed" fw={600}>Cargando estadísticas...</Text>
                                </Stack>
                            </Center>
                        ) : hasError ? (
                            <Center py="xl">
                                <Stack align="center" gap="sm">
                                    <ThemeIcon size={56} radius="xl" variant="light" color="orange">
                                        <IconAlertTriangle size={28} stroke={1.5} />
                                    </ThemeIcon>
                                    <Text fw={700} c="orange.7">No se pudieron cargar los datos</Text>
                                    <Text size="sm" c="dimmed" ta="center" maw={400}>
                                        Hubo un error al obtener las estadísticas. Intenta recargar la página o seleccionar otro departamento.
                                    </Text>
                                </Stack>
                            </Center>
                        ) : (
                            <>
                                <Tabs.Panel value="weekly">{renderWeekly()}</Tabs.Panel>
                                <Tabs.Panel value="monthly">{renderMonthly()}</Tabs.Panel>
                                <Tabs.Panel value="annual">{renderAnnual()}</Tabs.Panel>
                                <Tabs.Panel value="demographics">{renderDemographics()}</Tabs.Panel>
                                <Tabs.Panel value="insights">{renderInsights()}</Tabs.Panel>
                                <Tabs.Panel value="servidor">{renderServerStats()}</Tabs.Panel>
                            </>
                        )}
                    </Box>
                </Tabs>
            </Stack>
        </Container>
    );
}
