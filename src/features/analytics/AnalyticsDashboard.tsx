import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Tabs,
    Card,
    SimpleGrid,
    Group,
    ThemeIcon,
    Stack,
    Loader,
    Center
} from '@mantine/core';
import {
    IconChartBar,
    IconCalendarStats,
    IconTrendingUp,
    IconCalendar
} from '@tabler/icons-react';
import { AreaChart, BarChart } from '@mantine/charts';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { analyticsService } from '../../services/analyticsService';
import { useUser } from '../../contexts/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export const AnalyticsDashboard = () => {
    const { userMemberships, attendanceManagedDepartments } = useUser();
    const [activeTab, setActiveTab] = useState<string | null>('weekly');
    const [deptId, setDeptId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Stats State
    const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
    const [annualStats, setAnnualStats] = useState<any>(null);
    const [monthlyStats, setMonthlyStats] = useState<any | null>(null);

    // Auto-select first managed department
    useEffect(() => {
        if (attendanceManagedDepartments && attendanceManagedDepartments.length > 0) {
            setDeptId(attendanceManagedDepartments[0].id);
        } else if (userMemberships && userMemberships.length > 0) {
            setDeptId(userMemberships[0].departamento_id);
        }
    }, [attendanceManagedDepartments, userMemberships]);

    useEffect(() => {
        if (deptId) {
            loadStats();
        }
    }, [deptId, activeTab]);

    const loadStats = async () => {
        if (!deptId) return;
        setLoading(true);
        try {
            if (activeTab === 'weekly') {
                const data = await analyticsService.fetchWeeklyStats(deptId);
                setWeeklyStats(data);
            } else if (activeTab === 'annual') {
                const data = await analyticsService.fetchAnnualStats(deptId);
                setAnnualStats(data);
            } else if (activeTab === 'monthly') {
                const data = await analyticsService.fetchAttendanceStats(deptId, 12); // Last 12 months
                setMonthlyStats(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !weeklyStats.length && !annualStats && !monthlyStats) {
        return (
            <Center h={400}>
                <Loader color="orange" type="dots" />
            </Center>
        );
    }

    const renderMonthly = () => {
        if (!monthlyStats) return null;
        const data = Object.values(monthlyStats.byMonth) as any[];

        return (
            <Stack gap="lg" className="animate-fade-in">
                <Card padding="xl" radius="md" withBorder>
                    <Title order={4} mb="md">Desglose por Mes</Title>
                    {data.length > 0 ? (
                        <BarChart
                            h={300}
                            data={data}
                            dataKey="month"
                            series={[
                                { name: 'asistio', color: 'gold.6', label: 'Asistió' },
                                { name: 'faltas', color: 'stone.4', label: 'Faltas' },
                            ]}
                            withLegend
                            gridAxis="xy"
                            barProps={{ radius: [4, 4, 0, 0] }}
                        />
                    ) : (
                        <Center h={300}>
                            <Text c="dimmed">No hay datos suficientes para mostrar el gráfico mensual</Text>
                        </Center>
                    )}
                </Card>
            </Stack>
        );
    };

    const renderWeekly = () => (
        <Stack gap="lg" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <Card padding="lg" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Promedio Asistencia (12 Sem)</Text>
                            <Text fw={700} size="xl">
                                {Math.round(weeklyStats.reduce((acc, curr) => acc + curr.rate, 0) / (weeklyStats.length || 1))}%
                            </Text>
                        </div>
                        <ThemeIcon size="xl" radius="md" variant="light" color="teal">
                            <IconTrendingUp size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>
                <Card padding="lg" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Participaciones Totales</Text>
                            <Text fw={700} size="xl">
                                {weeklyStats.reduce((acc, curr) => acc + curr.total, 0)}
                            </Text>
                            <Text size="xs" c="dimmed">En las últimas 12 semanas</Text>
                        </div>
                        <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                            <IconCalendarStats size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card padding="xl" radius="md" withBorder>
                <Title order={4} mb="md">Asistencia de las últimas semanas</Title>
                {weeklyStats.length > 0 ? (
                    <AreaChart
                        h={300}
                        data={weeklyStats}
                        dataKey="weekStart"
                        series={[
                            { name: 'present', color: 'teal.6', label: 'Asistentes' },
                            { name: 'absent', color: 'red.4', label: 'Ausentes' },
                        ]}
                        curveType="monotone"
                        withLegend
                        gridAxis="xy"
                    />
                ) : (
                    <Center h={300}>
                        <Text c="dimmed">No hay datos suficientes para mostrar el gráfico</Text>
                    </Center>
                )}
            </Card>
        </Stack>
    );

    const renderAnnual = () => (
        <Stack gap="lg" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Card padding="lg" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Participaciones Anuales</Text>
                            <Text fw={700} size="xl">{annualStats?.totalServices || 0}</Text>
                            <Text size="xs" c="dimmed">Registros de asistencia este año</Text>
                        </div>
                        <ThemeIcon size="xl" radius="md" variant="light" color="orange">
                            <IconChartBar size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>
                <Card padding="lg" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Días Únicos</Text>
                            <Text fw={700} size="xl">{annualStats?.uniqueDates || 0}</Text>
                            <Text size="xs" c="dimmed">Días con actividad registrada</Text>
                        </div>
                        <ThemeIcon size="xl" radius="md" variant="light" color="grape">
                            <IconCalendar size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card padding="xl" radius="md" withBorder>
                <Title order={4} mb="xs">Calendario de Actividad Anual</Title>
                <Text size="sm" c="dimmed" mb="xl">Frecuencia de servicios realizados por fecha en el año {dayjs().year()}</Text>

                <ActivityHeatmap data={annualStats?.heatmapData || []} />
            </Card>
        </Stack>
    );

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <div>
                    <Text fw={900} size="2rem" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Mi Panel de Actividad 📊
                    </Text>
                    <Text c="dimmed">Resumen de la participación y asistencia del equipo</Text>
                </div>

                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
                    <Tabs.List>
                        <Tabs.Tab value="weekly" leftSection={<IconTrendingUp size={16} />}>
                            Tendencia Semanal
                        </Tabs.Tab>
                        <Tabs.Tab value="monthly" leftSection={<IconChartBar size={16} />}>
                            Por Mes
                        </Tabs.Tab>
                        <Tabs.Tab value="annual" leftSection={<IconCalendarStats size={16} />}>
                            Resumen del Año
                        </Tabs.Tab>
                    </Tabs.List>

                    <Card withBorder radius="lg" mt="md" p="xl" style={{ minHeight: 400 }}>
                        <Tabs.Panel value="weekly">
                            {renderWeekly()}
                        </Tabs.Panel>
                        <Tabs.Panel value="monthly">
                            {renderMonthly()}
                        </Tabs.Panel>
                        <Tabs.Panel value="annual">
                            {renderAnnual()}
                        </Tabs.Panel>
                    </Card>
                </Tabs>
            </Stack>
        </Container>
    );
};
