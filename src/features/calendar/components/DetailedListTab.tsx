import { useState, useMemo } from 'react';
import { Box, Stack, Text, Paper, Group, Title, Badge, Table, Divider, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { formatTime12h } from '../../../utils/timeFormat';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import type { DayGroup } from '../../../utils/calendar/dataTransformers';

function shortName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] ?? '';
}

const SERVICE_COLORS = ['blue', 'orange', 'violet', 'teal'];

interface DetailedListTabProps {
    groupedAssignments: Record<string, DayGroup>;
}

export function DetailedListTab({ groupedAssignments }: DetailedListTabProps) {
    const [currentDate, setCurrentDate] = useState(dayjs());

    const handlePrevMonth = () => setCurrentDate(prev => prev.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentDate(prev => prev.add(1, 'month'));

    const currentMonthAssignments = useMemo(() => {
        const targetMonth = currentDate.format('YYYY-MM');
        return Object.keys(groupedAssignments)
            .filter(date => dayjs(date).format('YYYY-MM') === targetMonth)
            .sort()
            .map(date => ({ date, dayGroup: groupedAssignments[date] }));
    }, [groupedAssignments, currentDate]);

    return (
        <Box p={{ base: 'xs', sm: 'md' }} style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f3f5 100%)', borderRadius: 12 }}>
            <Stack gap="md">
                <Group justify="space-between" mb="lg" align="center">
                    <Group justify="center" gap="sm" align="center">
                        <ActionIcon variant="filled" color="slate" size="md" radius="xl" onClick={handlePrevMonth} aria-label="Mes anterior">
                            <IconChevronLeft size={18} />
                        </ActionIcon>
                        <Title order={3} tt="capitalize" w={{ base: 140, sm: 220 }} ta="center" c="slate.8"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(1rem, 4vw, 1.2rem)', lineHeight: 1.2 }}>
                            {currentDate.locale('es').format('MMMM YYYY')}
                        </Title>
                        <ActionIcon variant="filled" color="slate" size="md" radius="xl" onClick={handleNextMonth} aria-label="Siguiente mes">
                            <IconChevronRight size={18} />
                        </ActionIcon>
                    </Group>
                </Group>

                <Divider mb="xl" color="gray.2" />

                {currentMonthAssignments.length === 0 ? (
                    <Paper p="xl" radius="lg" withBorder style={{ background: 'rgba(255,255,255,0.5)', borderColor: '#e2e8f0', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <Text c="dimmed" size="lg" ta="center" fw={500}>
                            No hay asignaciones programadas para {currentDate.locale('es').format('MMMM YYYY')}
                        </Text>
                    </Paper>
                ) : (
                    <Stack gap="lg">
                        {currentMonthAssignments.map(({ date, dayGroup }) => (
                            <Paper key={date} p={{ base: 'md', sm: 'xl' }} radius="lg" shadow="sm" withBorder style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                                {/* Date header */}
                                <Group mb="lg" gap="md" align="center">
                                    <Stack gap={2}>
                                        <Text size="xs" fw={800} c="gold.6" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                                            {dayjs(date).locale('es').format('dddd')}
                                        </Text>
                                        <Title order={2} c="slate.9" style={{ letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif', fontSize: '1.8rem', lineHeight: 1 }}>
                                            {dayjs(date).format('DD')}
                                        </Title>
                                    </Stack>
                                    {dayGroup.services.length > 1 && (
                                        <Badge size="lg" color="orange" variant="light" radius="md">
                                            {dayGroup.services.length} servicios
                                        </Badge>
                                    )}
                                </Group>

                                <Stack gap="lg">
                                    {dayGroup.services.map((svc, svcIdx) => (
                                        <Box key={svc.configuracion_dia_id}>
                                            {svcIdx > 0 && <Divider my="md" color="orange.2" style={{ borderStyle: 'dashed' }} />}

                                            {/* Service header */}
                                            <Group mb="sm" gap="sm" align="center" wrap="wrap">
                                                {dayGroup.services.length > 1 && (
                                                    <Badge
                                                        size="md"
                                                        color={SERVICE_COLORS[svcIdx] || 'gray'}
                                                        variant="filled"
                                                        radius="sm"
                                                    >
                                                        {svcIdx === 0 ? '1er Servicio' : svcIdx === 1 ? '2do Servicio' : `Servicio ${svcIdx + 1}`}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    color={getUniformeColor(svc.uniforme)}
                                                    variant="filled"
                                                    size="md"
                                                    radius="md"
                                                    style={{ fontWeight: 800, textTransform: 'uppercase' }}
                                                >
                                                    {svc.uniforme || 'Sin uniforme'}
                                                </Badge>
                                                <Badge size="md" color="gold" variant="light" radius="md" fw={700} c="gold.9">
                                                    {svc.servicio || 'Servicio General'}
                                                </Badge>
                                                {svc.hora_llegada && (
                                                    <Group gap={4}>
                                                        <IconClock size={14} color="var(--mantine-color-gold-6)" />
                                                        <Text size="sm" fw={700} c="gold.7">
                                                            Llegada: {formatTime12h(svc.hora_llegada)}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Group>

                                            <Table.ScrollContainer minWidth={300}>
                                                <Table verticalSpacing="sm" horizontalSpacing="md" style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                                    <Table.Thead style={{ height: 44, background: '#f8fafc' }}>
                                                        <Table.Tr>
                                                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Servidor(a)</Table.Th>
                                                            <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Posición</Table.Th>
                                                        </Table.Tr>
                                                    </Table.Thead>
                                                    <Table.Tbody>
                                                        {svc.assignments.map((asig) => (
                                                            <Table.Tr key={asig.id}>
                                                                <Table.Td fw={700} style={{ fontSize: '14px', color: '#1e293b' }}>{shortName(asig.nombre)}</Table.Td>
                                                                <Table.Td>
                                                                    <Group justify="center">
                                                                        <Badge
                                                                            variant="filled"
                                                                            bg="#ffedd5"
                                                                            c="#9a3412"
                                                                            size="sm"
                                                                            radius="sm"
                                                                            style={{ border: '1px solid #fed7aa', fontWeight: 700, width: '100%', maxWidth: '120px', textAlign: 'center' }}
                                                                        >
                                                                            {asig.posicion}
                                                                        </Badge>
                                                                    </Group>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        ))}
                                                    </Table.Tbody>
                                                </Table>
                                            </Table.ScrollContainer>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
