import { useState, useEffect } from 'react';
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
    Card,
    Badge,
    Progress,
    Center,
    Select
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
    IconCheck
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { analyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import type { ChurnRiskUser } from '../../types';
import { useUser } from '../../contexts/UserContext';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../services/supabaseClient';


// Re-using the logic for activity heatmap

export default function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState<string | null>('weekly');
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

    const { managedDepartments } = useUser();
    const { isSystemAdmin } = usePermissions();

    // For system admins, load all departments; for leaders use their managed ones
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

    // Auto-select first department when options load
    useEffect(() => {
        if (!selectedDeptId && deptOptions.length > 0) {
            setSelectedDeptId(deptOptions[0].value);
        }
    }, [deptOptions.length]);

    const deptId: number | null = selectedDeptId ? Number(selectedDeptId) : null;
    const selectedDeptName = deptOptions.find(d => d.value === selectedDeptId)?.label ?? null;
    
    // Using React Query for data fetching
    const { data: monthlyStatsData, isLoading: loadingMonthly } = useQuery({
        queryKey: ['analytics', 'monthly', deptId],
        queryFn: () => analyticsService.fetchAttendanceStats(deptId!, 'YTD'),
        enabled: deptId != null,
        retry: 1
    });

    const { data: weeklyStatsData, isLoading: loadingWeekly, isError: errorWeekly } = useQuery({
        queryKey: ['analytics', 'weekly', deptId],
        queryFn: () => analyticsService.fetchWeeklyStats(deptId!),
        enabled: deptId != null,
        retry: 1
    });

    const { data: annualStatsData, isLoading: loadingAnnual } = useQuery({
        queryKey: ['analytics', 'annual', deptId],
        queryFn: () => analyticsService.fetchAnnualStats(deptId!),
        enabled: deptId != null,
        retry: 1
    });

    const { data: churnRiskData, isLoading: loadingChurn } = useQuery({
        queryKey: ['analytics', 'churn', deptId],
        queryFn: () => analyticsService.fetchChurnRisk(deptId!),
        enabled: deptId != null,
        retry: 1
    });

    const { data: demographicData, isLoading: loadingDemographic } = useQuery({
        queryKey: ['analytics', 'demographics', deptId],
        queryFn: () => analyticsService.fetchDemographicDist(deptId!),
        enabled: deptId != null,
        retry: 1
    });

    const { data: punctualityData, isLoading: loadingPunctuality } = useQuery({
        queryKey: ['analytics', 'punctuality', deptId],
        queryFn: () => analyticsService.fetchPunctualityTrends(deptId!),
        enabled: deptId != null,
        retry: 1
    });

    const isLoading = deptId == null || loadingWeekly || loadingMonthly || loadingAnnual || loadingChurn || loadingDemographic || loadingPunctuality;
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
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(217,119,6,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Tasa Promedio</Text>
                                <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>{avgRate}%</Text>
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

                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(37,99,235,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Total Presentes</Text>
                                <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>{totalPresent}</Text>
                                <Text size="xs" c="dimmed" fw={600} mt={4}>de {totalRecords} registros (12 sem.)</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="blue"><IconCalendarStats size={24} /></ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(245,158,11,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Última Semana</Text>
                                <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>{lastWeek?.rate ?? 0}%</Text>
                                <Text size="xs" c="dimmed" fw={600} mt={4}>{lastWeek ? `${lastWeek.present} presentes · ${lastWeek.absent} ausentes` : 'Sin datos'}</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="orange"><IconActivity size={24} /></ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder className="glass-card" style={{ backgroundColor: 'var(--mantine-color-body)', overflow: 'hidden' }}>
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
                                tooltipProps={{
                                    allowEscapeViewBox: { x: false, y: false },
                                    offset: 10,
                                    wrapperStyle: { zIndex: 200 }
                                }}
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
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(20,184,166,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Tasa Global YTD</Text>
                                <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>{overallRate}%</Text>
                                <Text size="xs" c="dimmed" fw={600} mt={4}>{summary.asistio} de {summary.total} registros</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconTrendingUp size={24} /></ThemeIcon>
                        </Group>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(34,197,94,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Mejor Mes</Text>
                                <Text fw={900} size="1.6rem" style={{ letterSpacing: '-0.02em' }}>{bestMonth?.month ?? '—'}</Text>
                                <Text size="xs" c="teal.6" fw={700} mt={4}>
                                    {bestMonth ? `${Math.round((bestMonth.asistio / (bestMonth.asistio + bestMonth.faltas)) * 100)}% asistencia` : '—'}
                                </Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="green"><IconArrowUpRight size={24} /></ThemeIcon>
                        </Group>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(239,68,68,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Total Faltas YTD</Text>
                                <Text fw={900} size="2.2rem" c="red.6" style={{ letterSpacing: '-0.02em' }}>{totalFaltas}</Text>
                                <Text size="xs" c="dimmed" fw={600} mt={4}>{summary.faltoConAviso} c/aviso · {summary.faltoSinAviso} s/aviso</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="red"><IconAlertTriangle size={24} /></ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder className="glass-card">
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
                                tooltipProps={{ allowEscapeViewBox: { x: false, y: false }, offset: 10, wrapperStyle: { zIndex: 200 } }}
                            />
                        </Box>
                    ) : (
                        <Center py="xl"><Text c="dimmed" fw={600}>Sin datos mensuales disponibles</Text></Center>
                    )}
                </Paper>

                {monthEntries.length > 0 && (
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        <Paper p="xl" radius="xl" withBorder className="shell-glass">
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

                        <Paper p="xl" radius="xl" withBorder className="glass-card">
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
                {/* KPIs */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>En Riesgo</Text>
                            <Text fw={900} size="2rem" c={churn.length > 0 ? 'orange.6' : 'teal.6'}>{churn.length}</Text>
                            <Text size="xs" c="dimmed" fw={600}>Últimas 4 semanas</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Riesgo Crítico</Text>
                            <Text fw={900} size="2rem" c={criticalChurn.length > 0 ? 'red.6' : 'teal.6'}>{criticalChurn.length}</Text>
                            <Text size="xs" c="dimmed" fw={600}>Más del 75% faltas</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Tasa Global</Text>
                            <Text fw={900} size="2rem" c={overallRate >= 80 ? 'teal.6' : overallRate >= 60 ? 'orange.6' : 'red.6'}>{overallRate}%</Text>
                            <Text size="xs" c="dimmed" fw={600}>Asistencia YTD</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Registros</Text>
                            <Text fw={900} size="2rem">{summary.total}</Text>
                            <Text size="xs" c="dimmed" fw={600}>Total analizados</Text>
                        </Stack>
                    </Paper>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    {/* Churn risk */}
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
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

                    {/* Distribución de estados */}
                    <Paper p="xl" radius="xl" withBorder className="shell-glass">
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

                {/* Recomendaciones */}
                <Paper p="xl" radius="xl" withBorder className="glass-card">
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
                {/* KPIs */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Total Miembros</Text>
                            <Text fw={900} size="2rem">{totalGender}</Text>
                            <Text size="xs" c="dimmed" fw={600}>En el departamento</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Hombres</Text>
                            <Text fw={900} size="2rem" c="blue.6">{demo.gender.male}</Text>
                            <Text size="xs" c="dimmed" fw={600}>{malePercent}% del total</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Mujeres</Text>
                            <Text fw={900} size="2rem" c="pink.5">{demo.gender.female}</Text>
                            <Text size="xs" c="dimmed" fw={600}>{femalePercent}% del total</Text>
                        </Stack>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Con edad registrada</Text>
                            <Text fw={900} size="2rem">{totalAge}</Text>
                            <Text size="xs" c="dimmed" fw={600}>de {totalGender} miembros</Text>
                        </Stack>
                    </Paper>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    {/* Género */}
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
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
                                        tooltipProps={{ allowEscapeViewBox: { x: false, y: false }, offset: 10, wrapperStyle: { zIndex: 200 } }}
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

                    {/* Rangos de edad */}
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
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

        // Build month-by-month heatmap grid
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
                    <Card padding="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asistencias</Text>
                                <Text fw={900} size="2rem">{annualStats?.totalServices || 0}</Text>
                                <Text size="xs" c="dimmed" fw={600}>Año {dayjs().year()}</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconChartBar size={22} /></ThemeIcon>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Tasa Anual</Text>
                                <Text fw={900} size="2rem" c={annualRate >= 80 ? 'teal.6' : annualRate >= 60 ? 'orange.6' : 'red.6'}>{annualRate}%</Text>
                                <Text size="xs" c="dimmed" fw={600}>de {summary.total} registros</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="indigo"><IconTrendingUp size={22} /></ThemeIcon>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Días Activos</Text>
                                <Text fw={900} size="2rem">{annualStats?.uniqueDates || 0}</Text>
                                <Text size="xs" c="dimmed" fw={600}>Con al menos 1 asistencia</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="grape"><IconCalendar size={22} /></ThemeIcon>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Total Faltas</Text>
                                <Text fw={900} size="2rem" c="red.6">{totalFaltas}</Text>
                                <Text size="xs" c="dimmed" fw={600}>{summary.faltoConAviso} c/aviso · {summary.faltoSinAviso} s/aviso</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="red"><IconAlertTriangle size={22} /></ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {monthChartData.length > 0 && (
                    <Paper p="xl" radius="xl" withBorder className="glass-card" style={{ overflow: 'hidden' }}>
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
                                tooltipProps={{ allowEscapeViewBox: { x: false, y: false }, offset: 10, wrapperStyle: { zIndex: 200 } }}
                            />
                        </Box>
                    </Paper>
                )}

                <Paper p="xl" radius="xl" withBorder className="glass-card">
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
                                    <Text size="10px" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.05em' }}>{month.label}</Text>
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
                            Panel de Impacto 📊
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
                    <Tabs.List className="shell-glass" style={{ 
                        padding: '6px', 
                        borderRadius: '100px',
                        border: '1px solid var(--mantine-color-default-border)',
                        width: 'fit-content',
                        backgroundColor: 'var(--mantine-color-body)'
                    }}>
                        <Tabs.Tab value="weekly" leftSection={<IconTrendingUp size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Semanal
                        </Tabs.Tab>
                        <Tabs.Tab value="monthly" leftSection={<IconChartBar size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Mensual
                        </Tabs.Tab>
                        <Tabs.Tab value="annual" leftSection={<IconCalendarStats size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Anual
                        </Tabs.Tab>
                        <Tabs.Tab value="demographics" leftSection={<IconUsers size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Demografía
                        </Tabs.Tab>
                        <Tabs.Tab value="insights" leftSection={<IconActivity size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Insights
                        </Tabs.Tab>
                    </Tabs.List>

                    <Box mt="xl">
                        {isLoading ? (
                            <Center py="xl"><Stack align="center" gap="md"><div className="loader" style={{ width: 40, height: 40, border: '4px solid var(--mantine-color-gold-2)', borderTop: '4px solid var(--mantine-color-gold-6)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><Text c="dimmed" fw={600}>Cargando estadísticas...</Text></Stack></Center>
                        ) : errorWeekly && weeklyStats.length === 0 ? (
                            <Center py="xl"><Stack align="center" gap="sm"><IconAlertTriangle size={40} color="var(--mantine-color-orange-6)" /><Text fw={700} c="orange.7">No se pudieron cargar las estadísticas</Text><Text size="sm" c="dimmed" ta="center">Es posible que las funciones de análisis no estén configuradas en la base de datos.</Text></Stack></Center>
                        ) : (
                            <>
                                <Tabs.Panel value="weekly">{renderWeekly()}</Tabs.Panel>
                                <Tabs.Panel value="monthly">{renderMonthly()}</Tabs.Panel>
                                <Tabs.Panel value="annual">{renderAnnual()}</Tabs.Panel>
                                <Tabs.Panel value="demographics">{renderDemographics()}</Tabs.Panel>
                                <Tabs.Panel value="insights">{renderInsights()}</Tabs.Panel>
                            </>
                        )}
                    </Box>
                </Tabs>
            </Stack>
        </Container>
    );
}
