import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    ThemeIcon,
    SimpleGrid,
    Card,
    Center,
    Loader,
    Box
} from '@mantine/core';
import {
    IconCalendarEvent,
    IconChecklist,
    IconUsers,
    IconTrendingUp
} from '@tabler/icons-react';
import { DonutChart, BarChart } from '@mantine/charts';
import { useUser } from '../../contexts/UserContext';
import { analyticsService } from '../../services/analyticsService';
import dayjs from 'dayjs';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <Card withBorder p="md" radius="md" style={{
            background: `linear-gradient(135deg, var(--mantine-color-${color}-6) 0%, var(--mantine-color-${color}-8) 100%)`,
            color: 'white'
        }}>
            <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase">
                    {title}
                </Text>
                <ThemeIcon color="white" variant="transparent" size="lg" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
            <Group align="flex-end" gap="xs" mt={25}>
                <Text fw={700} size="xl">
                    {value}
                </Text>
            </Group>
        </Card>
    );
}

interface UpcomingService {
    id: string | number;
    posicion?: {
        nombre: string;
    }[];
    configuracion_dia: {
        fecha: string;
        tipo_servicio: string;
        color_uniforme: string;
    }[];
}

interface MonthlyStat {
    month: string;
    asistio: number;
    faltas: number;
}

interface StatsData {
    summary: {
        total: number;
        asistio: number;
        faltoConAviso: number;
        faltoSinAviso: number;
    };
    byMonth: Record<string, MonthlyStat> | MonthlyStat[];
}

export function Dashboard() {
    const { userProfile, attendanceManagedDepartments } = useUser();
    const [upcoming, setUpcoming] = useState<UpcomingService[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.usuario_id) {
            loadDashboardData();
        }
    }, [userProfile]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            if (userProfile?.usuario_id) {
                const upcomingData = await analyticsService.fetchUpcomingServices(userProfile.usuario_id);
                setUpcoming(upcomingData);
            }

            if (attendanceManagedDepartments && attendanceManagedDepartments.length > 0) {
                const statsData = await analyticsService.fetchAttendanceStats(attendanceManagedDepartments[0].id);
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Center style={{ height: '80vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    const attendanceTotal = stats?.summary.total || 0;
    const attendanceRate = attendanceTotal > 0
        ? Math.round((stats!.summary.asistio / attendanceTotal) * 100)
        : 0;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Card style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-blue-5) 0%, var(--mantine-color-blue-7) 100%)',
                    color: 'white'
                }} padding="lg" radius="md">
                    <Stack gap="xs">
                        <Title order={2}>¡Bienvenido de nuevo, {userProfile?.usuario?.nombre || 'Servidor'}!</Title>
                        <div style={{
                            background: 'rgba(30, 58, 138, 0.18)', // azul oscuro translúcido
                            borderLeft: '4px solid #60a5fa', // azul claro
                            padding: '12px 18px',
                            borderRadius: '6px',
                            fontFamily: 'serif',
                            fontStyle: 'italic',
                            color: '#e0e7ff', // azul muy claro
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            marginBottom: '4px'
                        }}>
                            <span style={{ fontSize: '1.15rem', display: 'block', marginBottom: '4px' }}>
                                Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres;
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#ffd700' }}>
                                Colosenses 3:23
                            </span>
                        </div>
                        <Text c="blue.1">Aquí tienes un resumen de tu actividad y la de tu equipo.</Text>
                    </Stack>
                </Card>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                    <StatCard
                        title="Asistencia General"
                        value={`${attendanceRate}%`}
                        icon={<IconTrendingUp size={24} />}
                        color="teal"
                    />
                    <StatCard
                        title="Próximos Servicios"
                        value={upcoming.length}
                        icon={<IconCalendarEvent size={24} />}
                        color="blue"
                    />
                    <StatCard
                        title="Servicios del Mes"
                        value={attendanceTotal}
                        icon={<IconChecklist size={24} />}
                        color="indigo"
                    />
                    <StatCard
                        title="Departamentos"
                        value={attendanceManagedDepartments?.length || 0}
                        icon={<IconUsers size={24} />}
                        color="grape"
                    />
                </SimpleGrid>

                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Card withBorder p="md" radius="md">
                            <Title order={4} mb="md">Próximos Servicios</Title>
                            {upcoming.length > 0 ? (
                                <Stack gap="xs">
                                    {upcoming.map((service) => (
                                        <Card key={service.id} withBorder padding="sm" radius="md" style={{
                                            background: 'linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-blue-1) 100%)'
                                        }}>
                                            <Group justify="space-between">
                                                <Stack gap={0}>
                                                    <Text fw={600} c="blue.9">{service.configuracion_dia[0]?.tipo_servicio}</Text>
                                                    <Text size="sm" c="blue.8">
                                                        {dayjs(service.configuracion_dia[0]?.fecha).format('dddd, D [de] MMMM')}
                                                    </Text>
                                                </Stack>
                                                <Group>
                                                    <Badge color="blue" variant="light">{service.posicion?.[0]?.nombre}</Badge>
                                                    <Badge color="gray" variant="filled">{service.configuracion_dia[0]?.color_uniforme}</Badge>
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : (
                                <Text ta="center" py="xl" c="dimmed">No tienes asignaciones programadas próximamente.</Text>
                            )}
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card withBorder p="md" radius="md">
                            <Title order={4} mb="md">Estado de Asistencia</Title>
                            {stats ? (
                                <Stack align="center">
                                    <Box w="100%" role="img" aria-label={`Gráfico de donas mostrando: ${stats!.summary.asistio} asistieron, ${stats!.summary.faltoConAviso} faltas con aviso, ${stats!.summary.faltoSinAviso} faltas sin aviso.`}>
                                        <DonutChart
                                            h={220}
                                            data={[
                                                { name: 'Asistió', value: stats!.summary.asistio, color: 'teal.6' },
                                                { name: 'Justificado', value: stats!.summary.faltoConAviso, color: 'orange.6' },
                                                { name: 'Faltó', value: stats!.summary.faltoSinAviso, color: 'red.6' },
                                            ]}
                                            tooltipDataSource="segment"
                                            withLabelsLine
                                            withLabels
                                        />
                                    </Box>
                                    <Group gap="xs">
                                        <Badge color="teal" variant="dot">Asistió</Badge>
                                        <Badge color="orange" variant="dot">Justificado</Badge>
                                        <Badge color="red" variant="dot">Faltó</Badge>
                                    </Group>
                                </Stack>
                            ) : (
                                <Text ta="center" py="xl" c="dimmed">No hay datos de asistencia todavía.</Text>
                            )}
                        </Card>
                    </Grid.Col>

                    {stats && stats.byMonth && Object.keys(stats.byMonth).length > 0 && (
                        <Grid.Col span={12}>
                            <Card withBorder p="md" radius="md">
                                <Title order={4} mb="md">Tendencia de Asistencia (Últimos Meses)</Title>
                                <Box w="100%" role="img" aria-label="Gráfico de barras mostrando la tendencia de asistencia y faltas en los últimos meses.">
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
        </Container>
    );
}
