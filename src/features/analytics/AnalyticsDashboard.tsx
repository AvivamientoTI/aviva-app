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
    Skeleton, 
    Loader, 
    Center,
    Card,
    Badge
} from '@mantine/core';
import { AreaChart, BarChart } from '@mantine/charts';
import { 
    IconChartBar, 
    IconCalendarStats, 
    IconTrendingUp, 
    IconCalendar, 
    IconActivity,
    IconArrowUpRight
} from '@tabler/icons-react';
import { supabase } from '../../services/supabaseClient';
import dayjs from 'dayjs';

// Re-using the logic for activity heatmap if needed, or keeping it simple for now
const ActivityHeatmap = ({ data }: { data: { date: string, count: number }[] }) => {
    return (
        <Group gap={4} wrap="wrap">
            {data.map((d, i) => (
                <Box 
                    key={i} 
                    style={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: d.count > 0 ? 'var(--mantine-color-gold-6)' : 'var(--mantine-color-gray-2)',
                        borderRadius: 2 
                    }} 
                    title={`${d.date}: ${d.count} servicios`}
                />
            ))}
        </Group>
    );
};

export function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState<string | null>('weekly');
    const [loading, setLoading] = useState(true);
    const [weeklyStats, setWeeklyStats] = useState<{ weekStart: string, present: number, absent: number, total: number }[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<{ department: string, attendanceRate: number }[]>([]);
    const [annualStats, setAnnualStats] = useState<{ totalServices: number, uniqueDates: number, heatmapData: any[] } | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        setLoading(true);
        try {
            // Fetch mockup or real data from view/rpc
            // For now using mockup data to ensure the UI looks premium as requested
            setWeeklyStats([
                { weekStart: 'Sem 1', present: 45, absent: 5, total: 50 },
                { weekStart: 'Sem 2', present: 42, absent: 8, total: 50 },
                { weekStart: 'Sem 3', present: 48, absent: 2, total: 50 },
                { weekStart: 'Sem 4', present: 44, absent: 6, total: 50 },
            ]);

            setMonthlyStats([
                { department: 'Servidores AM', attendanceRate: 92 },
                { department: 'Ujieres PM', attendanceRate: 88 },
                { department: 'Seguridad', attendanceRate: 95 },
                { department: 'Multimedia', attendanceRate: 84 },
            ]);

            setAnnualStats({
                totalServices: 1240,
                uniqueDates: 156,
                heatmapData: Array.from({ length: 50 }, (_, i) => ({ 
                    date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'), 
                    count: Math.floor(Math.random() * 5) 
                }))
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderWeekly = () => (
        <Stack gap="xl" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                <Paper p="lg" radius="xl" withBorder className="glass-card" style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(217, 119, 6, 0.05) 100%)'
                }}>
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Tasa de Asistencia</Text>
                            <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>94.2%</Text>
                            <Group gap={4} mt={4}>
                                <IconArrowUpRight size={14} color="var(--mantine-color-teal-6)" />
                                <Text size="xs" c="teal.6" fw={700}>+2.4% vs mes anterior</Text>
                            </Group>
                        </Stack>
                        <ThemeIcon size="xl" radius="lg" variant="light" color="gold">
                            <IconTrendingUp size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper p="lg" radius="xl" withBorder className="glass-card" style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(37, 99, 235, 0.05) 100%)'
                }}>
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Participaciones</Text>
                            <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>
                                {weeklyStats.reduce((acc, curr) => acc + curr.total, 0)}
                            </Text>
                            <Text size="xs" c="dimmed" fw={600} mt={4}>Servicios registrados</Text>
                        </Stack>
                        <ThemeIcon size="xl" radius="lg" variant="light" color="blue">
                            <IconCalendarStats size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper p="lg" radius="xl" withBorder className="glass-card" style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(245, 158, 11, 0.05) 100%)'
                }}>
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={0}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Actividad Semanal</Text>
                            <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>
                                {weeklyStats.length}
                            </Text>
                            <Text size="xs" c="dimmed" fw={600} mt={4}>Semanas analizadas</Text>
                        </Stack>
                        <ThemeIcon size="xl" radius="lg" variant="light" color="orange">
                            <IconActivity size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            <Paper p="xl" radius="xl" withBorder className="glass-card" style={{
                backgroundColor: 'var(--mantine-color-body)'
            }}>
                <Group justify="space-between" mb="xl">
                    <Stack gap={0}>
                        <Title order={4}>Tendencia de Participación</Title>
                        <Text size="xs" c="dimmed" fw={600}>Evolución del compromiso del equipo por semana</Text>
                    </Stack>
                </Group>
                
                <Box h={350}>
                    <AreaChart
                        h="100%"
                        data={weeklyStats}
                        dataKey="weekStart"
                        series={[
                            { name: 'present', color: 'teal.6', label: 'Asistentes' },
                            { name: 'absent', color: 'red.6', label: 'Ausentes' },
                        ]}
                        curveType="monotone"
                        withLegend
                        gridAxis="xy"
                        tickLine="xy"
                    />
                </Box>
            </Paper>
        </Stack>
    );

    const renderMonthly = () => (
        <Stack gap="xl" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Paper p="xl" radius="xl" withBorder className="glass-card">
                    <Title order={4} mb="md">Rendimiento por Departamento</Title>
                    <BarChart
                        h={300}
                        data={monthlyStats}
                        dataKey="department"
                        series={[{ name: 'attendanceRate', color: 'gold.6', label: 'Tasa %' }]}
                        gridAxis="y"
                    />
                </Paper>
                
                <Stack gap="md">
                    <Paper p="xl" radius="xl" withBorder className="shell-glass">
                        <Text fw={800} size="lg" mb="sm">Insights del Mes</Text>
                        <Stack gap="xs">
                            <Group gap="xs">
                                <Badge color="green" variant="light">Top</Badge>
                                <Text size="sm" fw={600}>Seguridad mantiene el liderazgo con 95%</Text>
                            </Group>
                            <Group gap="xs">
                                <Badge color="orange" variant="light">Alerta</Badge>
                                <Text size="sm" fw={600}>Multimedia bajó un 4% este mes</Text>
                            </Group>
                        </Stack>
                    </Paper>
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
                        <Text fw={800} size="lg" mb="sm">Proyección Próximo Mes</Text>
                        <Text size="sm" c="dimmed">Se estima un incremento del 5% en la participación basado en las tendencias actuales de planificación.</Text>
                    </Paper>
                </Stack>
            </SimpleGrid>
        </Stack>
    );

    const renderAnnual = () => (
        <Stack gap="xl" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <Card padding="xl" radius="xl" withBorder className="glass-card">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Participaciones Anuales</Text>
                            <Text fw={900} size="2.5rem">{annualStats?.totalServices || 0}</Text>
                            <Text size="xs" c="dimmed" fw={600}>Total registros {dayjs().year()}</Text>
                        </div>
                        <ThemeIcon size={50} radius="xl" variant="light" color="indigo">
                            <IconChartBar size={30} />
                        </ThemeIcon>
                    </Group>
                </Card>
                <Card padding="xl" radius="xl" withBorder className="glass-card">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Días con Actividad</Text>
                            <Text fw={900} size="2.5rem">{annualStats?.uniqueDates || 0}</Text>
                            <Text size="xs" c="dimmed" fw={600}>Días de servicio registrados</Text>
                        </div>
                        <ThemeIcon size={50} radius="xl" variant="light" color="grape">
                            <IconCalendar size={30} />
                        </ThemeIcon>
                    </Group>
                </Card>
            </SimpleGrid>

            <Paper p="xl" radius="xl" withBorder className="glass-card">
                <Title order={4} mb="xs">Intensidad de Actividad</Title>
                <Text size="sm" c="dimmed" mb="xl" fw={500}>Frecuencia de participación en los últimos meses</Text>
                <ActivityHeatmap data={annualStats?.heatmapData || []} />
            </Paper>
        </Stack>
    );

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-end">
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
                    </Tabs.List>

                    <Box mt="xl">
                        <Tabs.Panel value="weekly">
                            {renderWeekly()}
                        </Tabs.Panel>
                        <Tabs.Panel value="monthly">
                            {renderMonthly()}
                        </Tabs.Panel>
                        <Tabs.Panel value="annual">
                            {renderAnnual()}
                        </Tabs.Panel>
                    </Box>
                </Tabs>
            </Stack>
        </Container>
    );
}
