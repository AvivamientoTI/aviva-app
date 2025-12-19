import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    ThemeIcon,
    SimpleGrid,
    Card,
    RingProgress,
    Center,
    Loader
} from '@mantine/core';
import {
    IconCalendarEvent,
    IconChecklist,
    IconUsers,
    IconAlertCircle,
    IconTrendingUp
} from '@tabler/icons-react';
import { DonutChart, BarChart } from '@mantine/charts';
import { useUser } from '../../contexts/UserContext';
import { analyticsService } from '../../services/analyticsService';
import dayjs from 'dayjs';

export function Dashboard() {
    const { userProfile, managedDepartments, attendanceManagedDepartments } = useUser();
    const [upcoming, setUpcoming] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.usuario_id) {
            loadDashboardData();
        }
    }, [userProfile]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const upcomingData = await analyticsService.fetchUpcomingServices(userProfile.usuario_id);
            setUpcoming(upcomingData);

            if (attendanceManagedDepartments.length > 0) {
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
        ? Math.round((stats.summary.asistio / attendanceTotal) * 100)
        : 0;

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <div>
                    <Title order={2}>Bienvenido, {userProfile?.usuario?.nombre || 'Servidor'}</Title>
                    <Text c="dimmed">Aquí tienes un resumen de tu actividad y la de tu equipo.</Text>
                </div>

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
                        value={attendanceManagedDepartments.length}
                        icon={<IconUsers size={24} />}
                        color="grape"
                    />
                </SimpleGrid>

                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Paper withBorder p="md" radius="md">
                            <Title order={4} mb="md">Próximos Servicios</Title>
                            {upcoming.length > 0 ? (
                                <Stack gap="xs">
                                    {upcoming.map((service) => (
                                        <Card key={service.id} withBorder padding="sm" radius="md">
                                            <Group justify="space-between">
                                                <Stack gap={0}>
                                                    <Text fw={600}>{service.configuracion_dia.tipo_servicio}</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {dayjs(service.configuracion_dia.fecha).format('dddd, D [de] MMMM')}
                                                    </Text>
                                                </Stack>
                                                <Group>
                                                    <Badge variant="light">{service.posicion?.nombre}</Badge>
                                                    <Badge color="gray" variant="dot">{service.configuracion_dia.color_uniforme}</Badge>
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : (
                                <Text ta="center" py="xl" c="dimmed">No tienes asignaciones programadas próximamente.</Text>
                            )}
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper withBorder p="md" radius="md">
                            <Title order={4} mb="md">Estado de Asistencia</Title>
                            {stats ? (
                                <Stack align="center">
                                    <RingProgress
                                        size={220}
                                        thickness={20}
                                        roundCaps
                                        label={
                                            <Center>
                                                <Text fw={700} size="xl">{attendanceRate}%</Text>
                                            </Center>
                                        }
                                        sections={[
                                            { value: (stats.summary.asistio / attendanceTotal) * 100, color: 'teal' },
                                            { value: (stats.summary.faltoConAviso / attendanceTotal) * 100, color: 'orange' },
                                            { value: (stats.summary.faltoSinAviso / attendanceTotal) * 100, color: 'red' },
                                        ]}
                                    />
                                    <Group gap="xs">
                                        <Badge color="teal" variant="dot">Asistió</Badge>
                                        <Badge color="orange" variant="dot">Justificado</Badge>
                                        <Badge color="red" variant="dot">Faltó</Badge>
                                    </Group>
                                </Stack>
                            ) : (
                                <Text ta="center" py="xl" c="dimmed">No hay datos de asistencia todavía.</Text>
                            )}
                        </Paper>
                    </Grid.Col>

                    {stats && Object.keys(stats.byMonth).length > 0 && (
                        <Grid.Col span={12}>
                            <Paper withBorder p="md" radius="md">
                                <Title order={4} mb="md">Tendencia de Asistencia (Últimos Meses)</Title>
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
                            </Paper>
                        </Grid.Col>
                    )}
                </Grid>
            </Stack>
        </Container>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    {title}
                </Text>
                <ThemeIcon color={color} variant="light" size="lg" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
            <Group align="flex-end" gap="xs" mt={25}>
                <Text fw={700} size="xl">
                    {value}
                </Text>
            </Group>
        </Paper>
    );
}
