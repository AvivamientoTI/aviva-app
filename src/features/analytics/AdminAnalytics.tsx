import { 
    Container, 
    Title, 
    Text, 
    Paper, 
    Group, 
    Stack, 
    SimpleGrid, 
    ThemeIcon, 
    Badge,
    Progress,
    Loader,
    Center,
    Box
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { 
    IconActivity,
    IconUsers,
    IconTrendingUp,
    IconAlertTriangle,
    IconChartBar,
    IconInfoCircle
} from '@tabler/icons-react';
import { analyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';

export default function AdminAnalytics() {
    const { data: globalStats, isLoading: loadingStats } = useQuery({
        queryKey: ['analytics', 'global'],
        queryFn: () => analyticsService.fetchGlobalStats()
    });

    const { data: globalDemographics, isLoading: loadingDemo } = useQuery({
        queryKey: ['analytics', 'demographics', 'global'],
        queryFn: () => analyticsService.fetchDemographicDist()
    });

    if (loadingStats || loadingDemo) {
        return (
            <Center h={400}>
                <Loader color="gold" size="xl" />
            </Center>
        );
    }

    const totalStats = globalStats || [];
    const avgAttendance = totalStats.length > 0 
        ? Math.round(totalStats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / totalStats.length)
        : 0;

    // "Critical Cupos" - Departments with attendance < 80%
    const criticalDepts = totalStats.filter(d => d.attendanceRate < 80);

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack gap={0}>
                    <Title order={1} style={{ 
                        fontFamily: 'Inter, sans-serif', 
                        fontSize: '2.4rem',
                        letterSpacing: '-0.02em',
                        color: 'var(--mantine-color-text)'
                    }}>
                        Analítica Global 🌐
                    </Title>
                    <Text c="dimmed" fw={500} size="md">Visión estratégica de todos los departamentos</Text>
                </Stack>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Asistencia Global</Text>
                                <Text fw={900} size="2.2rem">{avgAttendance}%</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="gold">
                                <IconTrendingUp size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Total Departamentos</Text>
                                <Text fw={900} size="2.2rem">{totalStats.length}</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="blue">
                                <IconActivity size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper p="lg" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Dptos en Alerta</Text>
                                <Text fw={900} size="2.2rem" c={criticalDepts.length > 0 ? 'red' : 'dimmed'}>
                                    {criticalDepts.length}
                                </Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color={criticalDepts.length > 0 ? 'red' : 'gray'}>
                                <IconAlertTriangle size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>

                <Paper p="xl" radius="xl" withBorder className="glass-card">
                    <Title order={4} mb="xl">Comparativa por Departamento</Title>
                    <Box h={350}>
                        <BarChart
                            h="100%"
                            data={totalStats}
                            dataKey="nombre"
                            series={[{ name: 'attendanceRate', color: 'gold.6', label: 'Tasa de Asistencia (%)' }]}
                            gridAxis="y"
                            withLegend
                        />
                    </Box>
                </Paper>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Paper p="xl" radius="xl" withBorder className="glass-card">
                        <Group justify="space-between" mb="lg">
                            <Title order={4}>Estados Críticos (Mes Siguiente)</Title>
                            <ThemeIcon color="red" variant="light">
                                <IconChartBar size={20} />
                            </ThemeIcon>
                        </Group>
                        {criticalDepts.length > 0 ? (
                            <Stack gap="md">
                                {criticalDepts.map(d => (
                                    <Box key={d.id}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm" fw={700}>{d.nombre}</Text>
                                            <Badge color="red" variant="light">{d.attendanceRate}%</Badge>
                                        </Group>
                                        <Progress value={d.attendanceRate} color="red" size="sm" radius="xl" />
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed" ta="center" py="xl">Todos los departamentos mantienen una salud óptima. ✨</Text>
                        )}
                    </Paper>

                    <Paper p="xl" radius="xl" withBorder className="shell-glass">
                        <Group gap="xs" mb="sm">
                            <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                            <Text fw={800} size="lg">Insight Estratégico</Text>
                        </Group>
                        <Text size="sm" fw={600} mb="md">
                            {criticalDepts.length > 0 
                                ? "Se observa una caída en la participación de algunos departamentos clave. Se recomienda revisión de roles cabecera."
                                : "La estabilidad global permite planificar eventos a gran escala para el próximo trimestre."}
                        </Text>
                        <Group gap="xs">
                            <ThemeIcon variant="light" size="sm"><IconUsers size={14} /></ThemeIcon>
                            <Text size="xs" c="dimmed">Distribución Global: {globalDemographics?.gender.male} Hombres / {globalDemographics?.gender.female} Mujeres</Text>
                        </Group>
                    </Paper>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
