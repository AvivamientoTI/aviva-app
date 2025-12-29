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
    Box,
    Button
} from '@mantine/core';
import {
    IconCalendarEvent,
    IconChecklist,
    IconUsers,
    IconTrendingUp,
    IconRocket,
    IconArrowRight
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
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
        <Card p="xl" radius="lg" withBorder style={{
            backgroundColor: '#ffffff',
            borderBottom: `4px solid var(--mantine-color-${color}-6)`,
            color: '#0f172a',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <Box style={{
                position: 'absolute',
                top: -15,
                right: -15,
                opacity: 0.03,
                transform: 'rotate(15deg)',
                color: `var(--mantine-color-${color}-9)`
            }}>
                {React.cloneElement(icon as React.ReactElement, { size: 110 })}
            </Box>

            <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between" align="center">
                    <Text size="xs" fw={800} tt="uppercase" c="slate.7" style={{ letterSpacing: '0.1em' }}>
                        {title}
                    </Text>
                    <ThemeIcon color={color} variant="light" size="lg" radius="md">
                        {icon}
                    </ThemeIcon>
                </Group>
                <Text fw={900} size="xl" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif', color: '#1e293b' }}>
                    {value}
                </Text>
            </Stack>
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
    const navigate = useNavigate();
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

    const nextService = upcoming.length > 0 ? upcoming[0] : null;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Card style={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                            color: 'white',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
                        }} padding="xl" radius="lg" withBorder={false}>
                            <Box style={{
                                position: 'absolute',
                                top: -40,
                                right: -40,
                                opacity: 0.1,
                                transform: 'rotate(15deg)'
                            }}>
                                <IconRocket size={240} />
                            </Box>

                            <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                                <Badge variant="filled" color="blue.4" radius="sm" size="lg" style={{ width: 'fit-content', color: '#1e3a8a' }}>
                                    PLATAFORMA LIDERAZGO
                                </Badge>
                                <Title order={1} style={{
                                    fontFamily: 'Outfit, sans-serif',
                                    fontSize: '3rem',
                                    lineHeight: 1,
                                    letterSpacing: '-0.04em'
                                }}>
                                    Hola,<br />
                                    <Text span c="white" inherit style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                        {userProfile?.usuario?.nombre || 'Servidor'}
                                    </Text>
                                </Title>

                                <Box style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderLeft: '4px solid #ffffff',
                                    padding: '24px',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    maxWidth: '90%'
                                }}>
                                    <Text size="lg" fs="italic" fw={700} c="blue.0" style={{ lineHeight: 1.6 }}>
                                        "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                                    </Text>
                                    <Group gap="xs" mt={12}>
                                        <Text fw={900} size="xs" c="cyan.1" style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                            COLOSENSES 3:23
                                        </Text>
                                    </Group>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 5 }}>
                        {nextService ? (
                            <Card padding="xl" radius="xl" withBorder style={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                backdropFilter: 'blur(20px)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Box style={{
                                    position: 'absolute',
                                    top: -20,
                                    right: -20,
                                    opacity: 0.03,
                                    transform: 'rotate(15deg)'
                                }}>
                                    <IconRocket size={160} color="var(--mantine-color-blue-9)" />
                                </Box>

                                <Stack justify="space-between" h="100%">
                                    <div>
                                        <Group justify="space-between" mb="lg">
                                            <Badge variant="filled" color="orange" size="lg" radius="md">
                                                PRÓXIMA MISIÓN
                                            </Badge>
                                            <ThemeIcon variant="light" color="blue" radius="xl" size="lg">
                                                <IconRocket size={20} />
                                            </ThemeIcon>
                                        </Group>

                                        <Title order={3} style={{
                                            fontFamily: 'Outfit, sans-serif',
                                            fontSize: '1.8rem',
                                            color: 'var(--mantine-color-blue-9)',
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {nextService.posicion?.[0]?.nombre || 'Servidor'}
                                        </Title>

                                        <Group gap="xs" mt={8}>
                                            <IconCalendarEvent size={18} color="var(--mantine-color-blue-6)" />
                                            <Text size="md" fw={700} c="slate.8">
                                                {dayjs(nextService.configuracion_dia[0]?.fecha).format('dddd, D [de] MMMM')}
                                            </Text>
                                        </Group>

                                        <Badge mt="md" size="md" variant="dot" color="indigo" p="md">
                                            {nextService.configuracion_dia[0]?.tipo_servicio}
                                        </Badge>
                                    </div>

                                    <Button
                                        fullWidth
                                        variant="filled"
                                        color="blue"
                                        mt="xl"
                                        size="md"
                                        rightSection={<IconArrowRight size={18} />}
                                        onClick={() => navigate('/calendar')}
                                    >
                                        Ver Detalles
                                    </Button>
                                </Stack>
                            </Card>
                        ) : (
                            <Card padding="xl" radius="xl" withBorder h="100%">
                                <Stack align="center" justify="center" h="100%" gap="md">
                                    <ThemeIcon size={60} radius="xl" color="gray" variant="light">
                                        <IconCalendarEvent size={32} />
                                    </ThemeIcon>
                                    <Stack gap={4} align="center">
                                        <Text fw={800} size="lg" c="dimmed">Sin misiones próximas</Text>
                                        <Text size="sm" ta="center" c="dimmed" opacity={0.7}>Descansa y prepárate para el próximo rol.</Text>
                                    </Stack>
                                </Stack>
                            </Card>
                        )}
                    </Grid.Col>
                </Grid>

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
