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
    Box,
    Avatar
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
    IconTrendingUp,
    IconAlertTriangle,
    IconInfoCircle,
    IconUsers,
    IconCheck,
    IconStar
} from '@tabler/icons-react';
import { analyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';

const DEPT_COLORS = ['gold', 'blue', 'teal', 'violet', 'orange', 'pink'];

function getDeptColor(index: number) {
    return DEPT_COLORS[index % DEPT_COLORS.length];
}

function getRateColor(rate: number) {
    if (rate >= 80) return 'teal';
    if (rate >= 60) return 'orange';
    return 'red';
}

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

    const totalStats = [...(globalStats || [])].sort((a, b) => b.attendanceRate - a.attendanceRate);
    const activeDepts = totalStats.filter(d => d.attendanceRate > 0);
    const avgAttendance = activeDepts.length > 0
        ? Math.round(activeDepts.reduce((acc, d) => acc + d.attendanceRate, 0) / activeDepts.length)
        : 0;
    const criticalDepts = totalStats.filter(d => d.attendanceRate > 0 && d.attendanceRate < 80);
    const healthyDepts = totalStats.filter(d => d.attendanceRate >= 80);
    const bestDept = totalStats[0];
    const totalMembers = (globalDemographics?.gender.male ?? 0) + (globalDemographics?.gender.female ?? 0);
    const totalServers = totalStats.reduce((acc, d) => acc + d.totalServers, 0);

    const demo = globalDemographics || { gender: { male: 0, female: 0 }, ageRanges: {} };
    const ageEntries = Object.entries(demo.ageRanges as Record<string, number>).filter(([, v]) => v > 0);
    const totalAge = ageEntries.reduce((acc, [, v]) => acc + v, 0);
    const AGE_COLORS = ['indigo', 'violet', 'blue', 'teal', 'cyan'];

    const chartData = totalStats.filter(d => d.attendanceRate > 0);

    const recommendations: { color: string; label: string; text: string }[] = [];
    if (criticalDepts.length > 0)
        recommendations.push({ color: 'red', label: 'Alerta', text: `${criticalDepts.map(d => d.nombre).join(', ')} presentan asistencia inferior al 80%. Se recomienda revisión de roles y seguimiento.` });
    if (healthyDepts.length === activeDepts.length && activeDepts.length > 0)
        recommendations.push({ color: 'teal', label: 'Excelente', text: 'Todos los departamentos activos mantienen una tasa saludable. Momento ideal para planificar eventos de mayor escala.' });
    if (avgAttendance >= 80)
        recommendations.push({ color: 'blue', label: 'Destacado', text: `La tasa promedio global es ${avgAttendance}%. El equipo muestra un compromiso sólido a nivel general.` });

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-end">
                    <Stack gap={0}>
                        <Title order={1} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '2.4rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--mantine-color-text)'
                        }}>
                            Analítica Global 🌐
                        </Title>
                        <Text c="dimmed" fw={500} size="md">Visión estratégica de todos los departamentos — últimos 3 meses</Text>
                    </Stack>
                </Group>

                {/* KPIs */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(217,119,6,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asistencia Global</Text>
                                <Text fw={900} size="2.2rem" c={getRateColor(avgAttendance)}>{avgAttendance}%</Text>
                                <Text size="xs" c="dimmed" fw={600}>Promedio entre dptos</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="gold"><IconTrendingUp size={22} /></ThemeIcon>
                        </Group>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(59,130,246,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Total Servidores</Text>
                                <Text fw={900} size="2.2rem">{totalMembers || totalServers}</Text>
                                <Text size="xs" c="dimmed" fw={600}>Miembros registrados</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="blue"><IconUsers size={22} /></ThemeIcon>
                        </Group>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(20,184,166,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Dptos Saludables</Text>
                                <Text fw={900} size="2.2rem" c="teal.6">{healthyDepts.length}</Text>
                                <Text size="xs" c="dimmed" fw={600}>Con ≥80% asistencia</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color="teal"><IconCheck size={22} /></ThemeIcon>
                        </Group>
                    </Paper>
                    <Paper p="lg" radius="xl" withBorder className="glass-card" style={{ background: 'linear-gradient(135deg, var(--mantine-color-body) 0%, rgba(239,68,68,0.05) 100%)' }}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={0}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Dptos en Alerta</Text>
                                <Text fw={900} size="2.2rem" c={criticalDepts.length > 0 ? 'red.6' : 'dimmed'}>{criticalDepts.length}</Text>
                                <Text size="xs" c="dimmed" fw={600}>Con &lt;80% asistencia</Text>
                            </Stack>
                            <ThemeIcon size="xl" radius="lg" variant="light" color={criticalDepts.length > 0 ? 'red' : 'gray'}><IconAlertTriangle size={22} /></ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>

                {/* Ranking de departamentos */}
                <Paper p="xl" radius="xl" withBorder className="glass-card">
                    <Group justify="space-between" mb="xl">
                        <Stack gap={0}>
                            <Title order={4}>Ranking de Departamentos</Title>
                            <Text size="xs" c="dimmed" fw={600}>Ordenados por tasa de asistencia — últimos 3 meses</Text>
                        </Stack>
                        {bestDept && bestDept.attendanceRate > 0 && (
                            <Group gap="xs">
                                <ThemeIcon size="sm" radius="xl" variant="light" color="gold"><IconStar size={12} /></ThemeIcon>
                                <Text size="xs" fw={800} c="gold.7">{bestDept.nombre} lidera con {bestDept.attendanceRate}%</Text>
                            </Group>
                        )}
                    </Group>
                    <Stack gap="lg">
                        {totalStats.map((dept, i) => {
                            const color = getDeptColor(i);
                            const rateColor = getRateColor(dept.attendanceRate);
                            const hasData = dept.attendanceRate > 0;
                            return (
                                <Box key={dept.id}>
                                    <Group justify="space-between" mb={6}>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="md" color={color} variant="light" style={{ fontWeight: 900, fontSize: 13 }}>
                                                {dept.nombre[0]}
                                            </Avatar>
                                            <Stack gap={0}>
                                                <Text size="sm" fw={800}>{dept.nombre}</Text>
                                                <Text size="xs" c="dimmed" fw={600}>
                                                    {hasData ? `${dept.totalServers} servidores activos` : 'Sin registros de asistencia'}
                                                </Text>
                                            </Stack>
                                        </Group>
                                        <Group gap="xs">
                                            {i === 0 && hasData && <ThemeIcon size="xs" radius="xl" variant="light" color="gold"><IconStar size={10} /></ThemeIcon>}
                                            <Badge
                                                color={hasData ? rateColor : 'gray'}
                                                variant={hasData ? 'filled' : 'light'}
                                                radius="sm"
                                                size="md"
                                                fw={800}
                                            >
                                                {hasData ? `${dept.attendanceRate}%` : 'Sin datos'}
                                            </Badge>
                                        </Group>
                                    </Group>
                                    <Progress
                                        value={dept.attendanceRate}
                                        color={hasData ? rateColor : 'gray'}
                                        size="sm"
                                        radius="xl"
                                        style={{ opacity: hasData ? 1 : 0.3 }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                </Paper>

                {/* Gráfica comparativa */}
                {chartData.length > 0 && (
                    <Paper p="xl" radius="xl" withBorder className="glass-card" style={{ overflow: 'hidden' }}>
                        <Stack gap={0} mb="xl">
                            <Title order={4}>Comparativa Visual</Title>
                            <Text size="xs" c="dimmed" fw={600}>Tasa de asistencia por departamento</Text>
                        </Stack>
                        <Box h={260} style={{ overflow: 'hidden' }}>
                            <BarChart
                                h="100%"
                                data={chartData}
                                dataKey="nombre"
                                series={[{ name: 'attendanceRate', color: 'gold.6', label: 'Tasa de Asistencia (%)' }]}
                                gridAxis="y"
                                tickLine="y"
                                yAxisProps={{ domain: [0, 100], tick: { fontSize: 11 }, width: 35 }}
                                xAxisProps={{ tick: { fontSize: 12, fontWeight: 700 } }}
                                tooltipProps={{ allowEscapeViewBox: { x: false, y: false }, offset: 10, wrapperStyle: { zIndex: 200 } }}
                            />
                        </Box>
                    </Paper>
                )}

                {/* Demografía + Recomendaciones */}
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    {/* Demografía global */}
                    <Paper p="xl" radius="xl" withBorder className="shell-glass">
                        <Group gap="xs" mb="lg">
                            <ThemeIcon color="indigo" variant="light" size="lg" radius="md"><IconUsers size={18} /></ThemeIcon>
                            <Stack gap={0}>
                                <Text fw={800} size="lg">Demografía Global</Text>
                                <Text size="xs" c="dimmed" fw={600}>Distribución de todos los miembros</Text>
                            </Stack>
                        </Group>

                        <Stack gap="md">
                            {/* Género */}
                            <Box>
                                <Group justify="space-between" mb={6}>
                                    <Group gap="xs">
                                        <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)' }} />
                                        <Text size="sm" fw={700}>Hombres</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Text size="sm" fw={800}>{demo.gender.male}</Text>
                                        <Badge variant="light" color="blue" size="sm">
                                            {totalMembers > 0 ? Math.round((demo.gender.male / totalMembers) * 100) : 0}%
                                        </Badge>
                                    </Group>
                                </Group>
                                <Progress value={totalMembers > 0 ? (demo.gender.male / totalMembers) * 100 : 0} color="blue" size="sm" radius="xl" />
                            </Box>
                            <Box>
                                <Group justify="space-between" mb={6}>
                                    <Group gap="xs">
                                        <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--mantine-color-pink-5)' }} />
                                        <Text size="sm" fw={700}>Mujeres</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Text size="sm" fw={800}>{demo.gender.female}</Text>
                                        <Badge variant="light" color="pink" size="sm">
                                            {totalMembers > 0 ? Math.round((demo.gender.female / totalMembers) * 100) : 0}%
                                        </Badge>
                                    </Group>
                                </Group>
                                <Progress value={totalMembers > 0 ? (demo.gender.female / totalMembers) * 100 : 0} color="pink" size="sm" radius="xl" />
                            </Box>

                            <Box mt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 12 }}>
                                <Text size="xs" c="dimmed" fw={700} mb="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }}>Rangos de edad</Text>
                                <Stack gap="xs">
                                    {ageEntries.map(([name, value], i) => {
                                        const pct = totalAge > 0 ? Math.round((value / totalAge) * 100) : 0;
                                        const color = AGE_COLORS[i % AGE_COLORS.length];
                                        return (
                                            <Group key={name} justify="space-between">
                                                <Group gap="xs">
                                                    <Box style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: `var(--mantine-color-${color}-5)`, flexShrink: 0 }} />
                                                    <Text size="xs" fw={700}>{name} años</Text>
                                                </Group>
                                                <Group gap="xs">
                                                    <Text size="xs" fw={800}>{value}</Text>
                                                    <Badge variant="light" color={color} size="xs">{pct}%</Badge>
                                                </Group>
                                            </Group>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Recomendaciones + estados críticos */}
                    <Stack gap="lg">
                        {criticalDepts.length > 0 && (
                            <Paper p="xl" radius="xl" withBorder className="glass-card">
                                <Group gap="xs" mb="lg">
                                    <ThemeIcon color="red" variant="light" size="lg" radius="md"><IconAlertTriangle size={18} /></ThemeIcon>
                                    <Stack gap={0}>
                                        <Text fw={800} size="lg">Departamentos Críticos</Text>
                                        <Text size="xs" c="dimmed" fw={600}>Requieren atención inmediata</Text>
                                    </Stack>
                                </Group>
                                <Stack gap="md">
                                    {criticalDepts.map(d => (
                                        <Box key={d.id}>
                                            <Group justify="space-between" mb={5}>
                                                <Text size="sm" fw={700}>{d.nombre}</Text>
                                                <Badge color="red" variant="filled" size="sm" fw={800}>{d.attendanceRate}%</Badge>
                                            </Group>
                                            <Progress value={d.attendanceRate} color="red" size="sm" radius="xl" />
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        )}

                        <Paper p="xl" radius="xl" withBorder className="glass-card" style={{ flex: 1 }}>
                            <Group gap="xs" mb="lg">
                                <ThemeIcon color="blue" variant="light" size="lg" radius="md"><IconInfoCircle size={18} /></ThemeIcon>
                                <Stack gap={0}>
                                    <Text fw={800} size="lg">Recomendaciones</Text>
                                    <Text size="xs" c="dimmed" fw={600}>Basadas en datos actuales</Text>
                                </Stack>
                            </Group>
                            <Stack gap="sm">
                                {recommendations.length > 0 ? recommendations.map((r, i) => (
                                    <Group key={i} gap="sm" align="flex-start" p="sm" style={{ borderRadius: 10, backgroundColor: `var(--mantine-color-${r.color}-0)`, border: `1px solid var(--mantine-color-${r.color}-2)` }}>
                                        <Badge color={r.color} variant="filled" size="sm" radius="sm" style={{ flexShrink: 0, marginTop: 1 }}>{r.label}</Badge>
                                        <Text size="sm" fw={600} style={{ flex: 1 }}>{r.text}</Text>
                                    </Group>
                                )) : (
                                    <Group gap="sm" align="flex-start" p="sm" style={{ borderRadius: 10, backgroundColor: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-2)' }}>
                                        <Badge color="gray" variant="filled" size="sm" radius="sm" style={{ flexShrink: 0, marginTop: 1 }}>Info</Badge>
                                        <Text size="sm" fw={600} style={{ flex: 1 }}>No hay suficientes datos de asistencia para generar recomendaciones.</Text>
                                    </Group>
                                )}
                            </Stack>
                        </Paper>
                    </Stack>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
