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
                        <Title order={1} style={{ fontFamily: 'Outfit, sans-serif', color: '#2563eb', fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
                            Reporte de Impacto
                        </Title>
                        <Text size="xl" fw={800} c="slate.9">{deptName}</Text>
                        <Text size="sm" c="dimmed" mt={4} fw={600}>{reportDate} • Generado el {dayjs().format('DD/MM/YYYY')}</Text>
                    </Stack>
                    <ThemeIcon size={80} radius="xl" variant="light" color="blue.6">
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
                                <Badge color={stats.teamAttendanceAvg > 80 ? 'blue.6' : 'orange.6'} variant="filled" radius="sm">
                                    {stats.teamAttendanceAvg > 80 ? 'Excelente' : 'Estable'}
                                </Badge>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Top Performers Section */}
                {topPerformers.length > 0 && (
                    <Paper p="lg" radius="md" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '6px solid #2563eb' }}>
                        <Group gap="sm" mb="md">
                            <IconTrophy color="#2563eb" size={24} />
                            <Title order={4} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Compromiso Destacado (100% Asistencia)</Title>
                        </Group>
                        <Group gap="xs">
                            {topPerformers.map(m => (
                                <Badge key={m.usuario_id} variant="white" color="blue" size="lg" radius="md" style={{ border: '1px solid #e2e8f0', fontWeight: 700 }}>
                                    {m.nombre} {m.apellido}
                                </Badge>
                            ))}
                        </Group>
                    </Paper>
                )}

                {/* Main Table */}
                <Stack gap="md">
                    <Group gap="xs">
                        <IconCalendarCheck size={24} color="#2563eb" />
                        <Title order={3} style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>Desglose Mensual de Asistencia</Title>
                    </Group>
                    <Table verticalSpacing="md" withColumnBorders={false}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '16px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Miembo / Posicionamiento</th>
                                <th style={{ textAlign: 'center', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Asistencias</th>
                                <th style={{ textAlign: 'center', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>Consistencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.usuario_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px' }}>
                                        <Text fw={700} color="#1e293b">{m.nombre} {m.apellido}</Text>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Text fw={600} color="#64748b">{m.asistencias} / {stats.totalServices}</Text>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Badge
                                            variant="light"
                                            color={m.porcentaje > 79 ? 'blue' : m.porcentaje > 49 ? 'orange' : 'red'}
                                            size="lg"
                                            radius="sm"
                                            fw={800}
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
                    <IconPray size={32} color="#2563eb" />
                    <Text size="sm" italic ta="center" ml="xl" mr="xl" fw={500} color="#64748b">
                        "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres..."
                    </Text>
                    <Text size="xs" fw={800} c="blue.7" style={{ letterSpacing: '0.05em' }}>COLOSENSES 3:23</Text>
                </Stack>
            </Stack>
        </div>
    );
});

ImpactReportTemplate.displayName = 'ImpactReportTemplate';
