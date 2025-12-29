import React from 'react';
import { Paper, Title, Text, Grid, Stack, Group, Table, Badge, Divider, ThemeIcon } from '@mantine/core';
import { IconTrophy, IconActivity, IconCalendarCheck, IconPray } from '@tabler/icons-react';
import type { MonthlyStats, MemberImpact, ServiceDetail } from '../../services/ImpactReportService';
import dayjs from 'dayjs';

interface ImpactReportTemplateProps {
    stats: MonthlyStats;
    members: MemberImpact[];
    services: ServiceDetail[];
    month: number;
    year: number;
    deptName: string;
}

export const ImpactReportTemplate = React.forwardRef<HTMLDivElement, ImpactReportTemplateProps>(({
    stats,
    members,
    services,
    month,
    year,
    deptName
}, ref) => {
    const reportDate = dayjs(`${year}-${month}-01`).format('MMMM YYYY');
    const topPerformers = members.filter(m => m.porcentaje === 100);

    return (
        <div style={{ padding: '40px', background: 'white', color: '#1a1a1a', width: '800px', minHeight: '1100px' }} ref={ref}>
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Title order={1} style={{ fontFamily: 'Outfit, sans-serif', color: '#6366f1', fontSize: '2.5rem' }}>
                            Reporte de Impacto
                        </Title>
                        <Text size="xl" fw={700} c="dimmed">{deptName}</Text>
                        <Text size="sm" c="dimmed" mt={4}>{reportDate} • Generado el {dayjs().format('DD/MM/YYYY')}</Text>
                    </Stack>
                    <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                        <IconActivity size={48} />
                    </ThemeIcon>
                </Group>

                <Divider size="xs" />

                {/* Stats Grid */}
                <Grid gutter="md">
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md">
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Asistencia Promedio</Text>
                                <Text size="xl" fw={800} style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.teamAttendanceAvg}%</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md">
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Servicios Realizados</Text>
                                <Text size="xl" fw={800} style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.totalServices}</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md">
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Miembros Activos</Text>
                                <Text size="xl" fw={800} style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.activeMembers}</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md">
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Salud de Equipo</Text>
                                <Badge color={stats.teamAttendanceAvg > 80 ? 'green' : 'orange'} variant="filled">
                                    {stats.teamAttendanceAvg > 80 ? 'Excelente' : 'Estable'}
                                </Badge>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Top Performers Section */}
                {topPerformers.length > 0 && (
                    <Paper p="md" radius="md" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                        <Group gap="sm" mb="sm">
                            <IconTrophy color="#f59e0b" size={24} />
                            <Title order={4} style={{ fontFamily: 'Outfit, sans-serif' }}>Compromiso Destacado (100% Asistencia)</Title>
                        </Group>
                        <Group gap="xs">
                            {topPerformers.map(m => (
                                <Badge key={m.usuario_id} variant="white" color="blue" size="lg" radius="md" style={{ border: '1px solid #dbeafe' }}>
                                    {m.nombre} {m.apellido}
                                </Badge>
                            ))}
                        </Group>
                    </Paper>
                )}

                {/* Main Table */}
                <Stack gap="xs">
                    <Group gap="xs">
                        <IconCalendarCheck size={20} color="#6366f1" />
                        <Title order={3} style={{ fontFamily: 'Outfit, sans-serif' }}>Desglose de Mensual de Asistencia</Title>
                    </Group>
                    <Table verticalSpacing="sm">
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '12px' }}>Posicionamiento / Miembro</th>
                                <th style={{ textAlign: 'center' }}>Asistencias</th>
                                <th style={{ textAlign: 'center' }}>Consistencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.usuario_id}>
                                    <td style={{ padding: '12px' }}>
                                        <Text fw={600}>{m.nombre} {m.apellido}</Text>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{m.asistencias} / {stats.totalServices}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Group gap={4} justify="center">
                                            <Text fw={700} color={m.porcentaje > 79 ? 'green' : m.porcentaje > 49 ? 'orange' : 'red'}>
                                                {m.porcentaje}%
                                            </Text>
                                        </Group>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Stack>

                {/* Bottom Quote */}
                <Stack align="center" mt="auto" gap={4} style={{ opacity: 0.6 }}>
                    <IconPray size={32} color="#6366f1" />
                    <Text size="sm" italic ta="center" ml="xl" mr="xl">
                        "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                    </Text>
                    <Text size="xs" fw={700}>COLO SENSES 3:23</Text>
                </Stack>
            </Stack>
        </div>
    );
});

ImpactReportTemplate.displayName = 'ImpactReportTemplate';
