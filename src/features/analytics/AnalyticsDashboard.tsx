import { useState } from 'react';
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
    Center
} from '@mantine/core';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import { 
    IconChartBar, 
    IconCalendarStats, 
    IconTrendingUp, 
    IconCalendar, 
    IconActivity,
    IconArrowUpRight,
    IconAlertTriangle,
    IconUsers,
    IconClock,
    IconInfoCircle
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { analyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import type { ChurnRiskUser } from '../../types';


// Re-using the logic for activity heatmap
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

export default function AnalyticsDashboard({ deptId = 2 }: { deptId?: number }) {
    const [activeTab, setActiveTab] = useState<string | null>('weekly');
    
    // Using React Query for data fetching
    const { data: weeklyStatsData } = useQuery({
        queryKey: ['analytics', 'weekly', deptId],
        queryFn: () => analyticsService.fetchWeeklyStats(deptId)
    });

    const { data: annualStatsData } = useQuery({
        queryKey: ['analytics', 'annual', deptId],
        queryFn: () => analyticsService.fetchAnnualStats(deptId)
    });

    const { data: churnRiskData } = useQuery({
        queryKey: ['analytics', 'churn', deptId],
        queryFn: () => analyticsService.fetchChurnRisk(deptId)
    });

    const { data: demographicData } = useQuery({
        queryKey: ['analytics', 'demographics', deptId],
        queryFn: () => analyticsService.fetchDemographicDist(deptId)
    });

    const { data: punctualityData } = useQuery({
        queryKey: ['analytics', 'punctuality', deptId],
        queryFn: () => analyticsService.fetchPunctualityTrends(deptId)
    });

    const weeklyStats = weeklyStatsData || [];
    const annualStats = annualStatsData || null;

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
                    <Title order={4} mb="md">Rendimiento Mensual</Title>
                    <Text size="sm" c="dimmed">Datos mensuales agregados se están cargando...</Text>
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

    const renderInsights = () => (
        <Stack gap="xl" className="animate-fade-in">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Paper p="xl" radius="xl" withBorder className="glass-card">
                    <Group justify="space-between" mb="lg">
                        <Stack gap={0}>
                            <Title order={4}>Riesgo de Deserción (Churn)</Title>
                            <Text size="xs" c="dimmed" fw={600}>Servidores con tendencia negativa en las últimas 4 semanas</Text>
                        </Stack>
                        <ThemeIcon color="orange" variant="light" radius="xl">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                    </Group>
                    
                    {churnRiskData && churnRiskData.length > 0 ? (
                        <Stack gap="md">
                            {churnRiskData.map((u: ChurnRiskUser) => (
                                <Box key={u.id}>

                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" fw={700}>{u.nombre} {u.apellido}</Text>
                                        <Badge color={u.riskScore > 75 ? 'red' : 'orange'} variant="light">
                                            Riesgo {u.riskScore}%
                                        </Badge>
                                    </Group>
                                    <Progress value={u.riskScore} color={u.riskScore > 75 ? 'red' : 'orange'} size="sm" radius="xl" />
                                    <Text size="10px" c="dimmed" mt={4}>
                                        {u.faltas} faltas de {u.asistencias + u.faltas} servicios previstos recientemente
                                    </Text>
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Text size="sm" c="dimmed" ta="center" py="xl">No se detectan servidores en riesgo crítico actualmente. ✨</Text>
                    )}
                </Paper>

                <Stack gap="md">
                    <Paper p="xl" radius="xl" withBorder className="shell-glass">
                        <Group gap="xs" mb="sm">
                            <IconClock size={18} color="var(--mantine-color-gold-6)" />
                            <Text fw={800} size="lg">Hábito de Puntualidad</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">La mayoría del equipo llega entre **5-10 minutos** antes de iniciar el servicio.</Text>
                        <BarChart
                            h={120}
                            data={punctualityData || []}
                            dataKey="label"
                            orientation="vertical"
                            series={[{ name: 'count', color: 'teal.6', label: 'Personas' }]}
                            withYAxis={false}
                        />
                    </Paper>
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
                        <Group gap="xs" mb="sm">
                            <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                            <Text fw={800} size="lg">Recomendación Estratégica</Text>
                        </Group>
                        <Text size="sm" fw={600}>
                            {churnRiskData && churnRiskData.length > 0 
                                ? "Se recomienda un abordaje personal para los servidores en riesgo para entender su situación actual."
                                : "El compromiso es alto. Es un buen momento para iniciar capacitaciones avanzadas o nuevas responsabilidades."}
                        </Text>
                    </Paper>
                </Stack>
            </SimpleGrid>
        </Stack>
    );

    const renderDemographics = () => {
        const demo = demographicData || { gender: { male: 0, female: 0 }, ageRanges: {} };
        const ageData = Object.entries(demo.ageRanges).map(([name, value]) => ({ name, value }));
        
        return (
            <Stack gap="xl" className="animate-fade-in">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
                        <Title order={4} mb="xl">Distribución por Género</Title>
                        <Center h={200}>
                            <DonutChart 
                                data={[
                                    { name: 'Hombres', value: demo.gender.male, color: 'blue.6' },
                                    { name: 'Mujeres', value: demo.gender.female, color: 'pink.6' }
                                ]}
                                withLabelsLine
                                withLabels
                                size={180}
                                thickness={25}
                            />
                        </Center>
                    </Paper>

                    <Paper p="xl" radius="xl" withBorder className="glass-card">
                        <Title order={4} mb="xl">Rangos de Edad</Title>
                        <BarChart
                            h={250}
                            data={ageData}
                            dataKey="name"
                            series={[{ name: 'value', color: 'indigo.6', label: 'Cantidad' }]}
                            gridAxis="y"
                        />
                    </Paper>
                </SimpleGrid>
            </Stack>
        );
    };

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
                        <Tabs.Tab value="demographics" leftSection={<IconUsers size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Demografía
                        </Tabs.Tab>
                        <Tabs.Tab value="insights" leftSection={<IconActivity size={18} />} styles={{ tab: { fontWeight: 700 } }}>
                            Insights
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
                        <Tabs.Panel value="demographics">
                            {renderDemographics()}
                        </Tabs.Panel>
                        <Tabs.Panel value="insights">
                            {renderInsights()}
                        </Tabs.Panel>
                    </Box>
                </Tabs>
            </Stack>
        </Container>
    );
}
