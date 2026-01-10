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
                        <Title order={1} style={{ fontFamily: 'Outfit, sans-serif', color: '#78350f', fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
                            Reporte de Impacto
                        </Title>
                        <Text size="xl" fw={800} c="stone.8">{deptName}</Text>
                        <Text size="sm" c="dimmed" mt={4} fw={600}>{reportDate} • Generado el {dayjs().format('DD/MM/YYYY')}</Text>
                    </Stack>
                    <ThemeIcon size={80} radius="xl" variant="light" color="gold">
                        <IconActivity size={48} />
                    </ThemeIcon>
                </Group>

                <Divider size="xs" color="gray.2" />

                {/* Stats Grid */}
                <Grid gutter="md">
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asistencia Promedio</Text>
                                <Text size="xl" fw={900} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>{stats.teamAttendanceAvg}%</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Servicios Realizados</Text>
                                <Text size="xl" fw={900} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>{stats.totalServices}</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Miembros Activos</Text>
                                <Text size="xl" fw={900} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>{stats.activeMembers}</Text>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Paper withBorder p="md" radius="md" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                            <Stack gap={2} align="center">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Salud de Equipo</Text>
                                <Badge color={stats.teamAttendanceAvg > 80 ? 'gold' : 'orange'} variant="filled" radius="sm" c="white">
                                    {stats.teamAttendanceAvg > 80 ? 'Excelente' : 'Estable'}
                                </Badge>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Top Performers Section */}
                {topPerformers.length > 0 && (
                    <Paper p="lg" radius="md" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '6px solid #d97706' }}>
                        <Group gap="sm" mb="md">
                            <IconTrophy color="#d97706" size={24} />
                            <Title order={4} style={{ fontFamily: 'Outfit, sans-serif', color: '#78350f' }}>Compromiso Destacado (100% Asistencia)</Title>
                        </Group>
                        <Group gap="xs">
                            {topPerformers.map(m => (
                                <Badge key={m.usuario_id} variant="white" color="gold" size="lg" radius="md" style={{ border: '1px solid #fde68a', fontWeight: 700, color: '#92400e' }}>
                                    {m.nombre} {m.apellido}
                                </Badge>
                            ))}
                        </Group>
                    </Paper>
                )}

                {/* Main Table */}
                <Stack gap="md">
                    <Group gap="xs">
                        <IconCalendarCheck size={24} color="#d97706" />
                        <Title order={3} style={{ fontFamily: 'Outfit, sans-serif', color: '#44403c' }}>Desglose Mensual de Asistencia</Title>
                    </Group>
                    <Table verticalSpacing="md" withColumnBorders={false}>
                        <thead>
                            <tr style={{ background: '#fcfaf5', borderBottom: '2px solid #e7e5e4' }}>
                                <th style={{ padding: '16px', color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Miembo / Posicionamiento</th>
                                <th style={{ textAlign: 'center', color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Asistencias</th>
                                <th style={{ textAlign: 'center', color: '#78716c', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Consistencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.usuario_id} style={{ borderBottom: '1px solid #e7e5e4' }}>
                                    <td style={{ padding: '16px' }}>
                                        <Text fw={700} color="#292524">{m.nombre} {m.apellido}</Text>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Text fw={600} color="#57534e">{m.asistencias} / {stats.totalServices}</Text>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Badge
                                            variant="light"
                                            color={m.porcentaje > 79 ? 'gold' : m.porcentaje > 49 ? 'orange' : 'red'}
                                            size="lg"
                                            radius="sm"
                                            fw={800}
                                            c={m.porcentaje > 79 ? 'gold.9' : undefined}
                                        >
                                            {m.porcentaje}%
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Stack>

                {/* Bottom Quote */}
                <Stack align="center" mt="auto" gap={6} style={{ opacity: 0.8 }}>
                    <IconPray size={32} color="#d97706" />
                    <Text size="sm" fs="italic" ta="center" ml="xl" mr="xl" fw={500} c="#78716c">
                        "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                    </Text>
                    <Text size="xs" fw={800} c="gold.8" style={{ letterSpacing: '0.05em' }}>COLOSENSES 3:23</Text>
                </Stack>
            </Stack>
        </div>
    );
});

ImpactReportTemplate.displayName = 'ImpactReportTemplate';
