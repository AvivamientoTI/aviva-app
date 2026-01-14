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
import { AreaChart } from '@mantine/charts';
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
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !weeklyStats.length && !annualStats) {
        return (
            <Center h={400}>
                <Loader color="orange" type="dots" />
            </Center>
        );
    }

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
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Servicios</Text>
                            <Text fw={700} size="xl">
                                {weeklyStats.reduce((acc, curr) => acc + curr.total, 0)}
                            </Text>
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
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Anual</Text>
                            <Text fw={700} size="xl">{annualStats?.totalServices || 0}</Text>
                            <Text size="xs" c="dimmed">Servicios cubiertos este año</Text>
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

            {/* Heatmap Simulation using Grid since Mantine Heatmap requires complex data structure */}
            {/* Ideally we use a dedicated library or build a custom grid, for now a simple list of active dates */}
            <Card padding="xl" radius="md" withBorder>
                <Title order={4} mb="md">Calendario de Servicios</Title>
                <Text size="sm" c="dimmed" mb="lg">Frecuencia de servicios por fecha en {dayjs().year()}</Text>

                <Group gap={4}>
                    {annualStats?.heatmapData?.map((d: any) => (
                        <Card
                            key={d.date}
                            p={0}
                            w={30}
                            h={30}
                            radius="xs"
                            style={{
                                backgroundColor: `var(--mantine-color-teal-${Math.min(9, d.count * 2)})`,
                                opacity: 0.8
                            }}
                            title={`${d.date}: ${d.count} servicios`}
                        />
                    ))}
                </Group>
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
                            Esta Semana
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
                            <Center h={300}><Text c="dimmed">Próximamente: Análisis de Retención y Crecimiento</Text></Center>
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
