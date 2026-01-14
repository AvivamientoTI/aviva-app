import { useMemo } from 'react';
import { ActionIcon, Avatar, Badge, Center, Group, Paper, RingProgress, Stack, Table, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconEdit, IconUser, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';

import type { Position } from '../../../types';

interface DraftAssignment {
    id: string;
    usuario_id: number | string;
    posicion_id: number | string;
    fecha: string;
    posicion?: Position;
    usuario?: { nombre: string; apellido: string };
    configuracion_dia?: { fecha: string };
}

interface Props {
    assignments: DraftAssignment[];
    serviceConfigs: Record<string, { type: string; uniform: string }[]>;
    handleEdit: (assignment: DraftAssignment) => void;
    handleDelete: (id: string) => void;
    conflicts?: Record<string, string[]>;
}

export const PlanningStepReview = ({
    assignments,
    serviceConfigs,
    handleEdit,
    conflicts = {}
}: Props) => {
    if (assignments.length === 0) {
        return (
            <Paper p="xl" withBorder style={{ textAlign: 'center', opacity: 0.7 }}>
                <IconUser size={48} />
                <Text mt="md">No se generaron asignaciones.</Text>
                <Text size="sm" color="dimmed">Vuelve atrás y revisa la configuración de fechas y cupos.</Text>
            </Paper>
        );
    }

    // 1. Group by Date -> Service Index
    const grouped = useMemo(() => {
        const groups: Record<string, Record<number, DraftAssignment[]>> = {};

        assignments.forEach(a => {
            const dateStr = a.fecha || a.configuracion_dia?.fecha;
            if (!dateStr) return;

            // Resolve Service Index
            let sIdx = 0;
            const configIdStr = String(a.configuracion_dia?.id || a.configuracion_dia_id || '');
            if (configIdStr.startsWith('temp-')) {
                const part = configIdStr.split('-').pop();
                sIdx = parseInt(part || '0') || 0;
            }
            // Note: If using real DB IDs later, this grouping logic might need adjustment 
            // to map DB ID -> Service Index via a lookup, but for Draft mode this works.

            if (!groups[dateStr]) groups[dateStr] = {};
            if (!groups[dateStr][sIdx]) groups[dateStr][sIdx] = [];

            groups[dateStr][sIdx].push(a);
        });

        return groups;
    }, [assignments]);

    const sortedDates = Object.keys(grouped).sort();

    const uniqueUsers = new Set(assignments.map(a => a.usuario_id)).size;
    const totalAssignments = assignments.length;

    return (
        <Stack gap="xl">
            {/* Stats Summary */}
            <Group grow>
                <Paper p="md" radius="lg" withBorder bg="var(--mantine-color-body)">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'gold.6' }]}
                            label={<Center><IconUser size={20} color="var(--mantine-color-gold-6)" /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Voluntarios</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--mantine-color-text)', lineHeight: 1 }}>{uniqueUsers}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="lg" withBorder bg="var(--mantine-color-body)">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'teal.4' }]}
                            label={<Center><IconCheck size={20} color="var(--mantine-color-teal-4)" /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asignaciones</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--mantine-color-text)', lineHeight: 1 }}>{totalAssignments}</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            {/* Render Groups */}
            <Stack gap="lg">
                {sortedDates.map(dateKey => {
                    const servicesMap = grouped[dateKey];
                    const serviceIndices = Object.keys(servicesMap).map(Number).sort((a, b) => a - b);
                    const displayDate = dayjs(dateKey).locale('es');

                    return (
                        <Paper key={dateKey} shadow="sm" radius="lg" withBorder style={{ overflow: 'hidden' }}>
                            {/* Date Header */}
                            <div style={{ backgroundColor: 'var(--mantine-color-default-hover)', padding: '12px 20px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconCalendar size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                        <Text fw={800} size="lg" c="text" tt="capitalize">
                                            {displayDate.format('dddd, D [de] MMMM')}
                                        </Text>
                                    </Group>
                                    <Badge variant="default" size="lg" radius="sm">
                                        {Object.values(servicesMap).flat().length} Asignaciones
                                    </Badge>
                                </Group>
                            </div>

                            <Stack gap={0}>
                                {serviceIndices.map((sIdx, idx) => {
                                    const serviceAssignments = servicesMap[sIdx];
                                    const configs = serviceConfigs[dateKey] || [];
                                    const config = configs[sIdx] || { type: 'Desconocido', uniform: 'N/A' };

                                    return (
                                        <div key={sIdx} style={{
                                            borderTop: idx > 0 ? '2px dashed var(--mantine-color-default-border)' : 'none',
                                            padding: 0
                                        }}>
                                            {/* Service Sub-Header */}
                                            <div style={{ padding: '16px 20px', backgroundColor: 'var(--mantine-color-body)', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                                <Group justify="space-between">
                                                    <Group gap="md">
                                                        <ThemeIcon size={36} radius="md" color={sIdx === 0 ? 'blue' : 'orange'} variant="light">
                                                            <Text fw={900} size="sm">#{sIdx + 1}</Text>
                                                        </ThemeIcon>

                                                        <Badge
                                                            size="lg"
                                                            radius="sm"
                                                            variant="filled"
                                                            color={sIdx === 0 ? 'blue' : 'orange'}
                                                            className="shadow-sm"
                                                            style={{ fontSize: '14px', height: '28px' }}
                                                        >
                                                            {config.type}
                                                        </Badge>

                                                        <Badge
                                                            variant="light"
                                                            color={getUniformeColor(config.uniform)}
                                                            size="lg"
                                                            radius="sm"
                                                            style={{ fontSize: '14px', height: '28px' }}
                                                            leftSection={<div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: `var(--mantine-color-${getUniformeColor(config.uniform)}-6)` }}></div>}
                                                        >
                                                            {config.uniform}
                                                        </Badge>
                                                    </Group>
                                                </Group>
                                            </div>

                                            {/* Assignments Table */}
                                            <Table verticalSpacing="sm">
                                                <Table.Tbody>
                                                    {serviceAssignments.map(assignment => {
                                                        const conflictDepts = conflicts[assignment.id];
                                                        return (
                                                            <Table.Tr key={assignment.id} style={conflictDepts ? { backgroundColor: 'var(--mantine-color-red-0)' } : {}}>
                                                                <Table.Td width="40%" style={{ paddingLeft: 20 }}>
                                                                    <Group gap="sm">
                                                                        <Avatar color="gold" radius="xl" size="sm">
                                                                            {assignment.usuario?.nombre?.[0]}{assignment.usuario?.apellido?.[0]}
                                                                        </Avatar>
                                                                        <div>
                                                                            <Text size="sm" fw={600} c="text">{assignment.usuario?.nombre} {assignment.usuario?.apellido}</Text>
                                                                            {conflictDepts && (
                                                                                <Text size="xs" c="red.6" fw={700}>
                                                                                    ⚠️ Ocupado: {conflictDepts.join(', ')}
                                                                                </Text>
                                                                            )}
                                                                        </div>
                                                                    </Group>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Text size="sm" c="dimmed">Posición:</Text>
                                                                    <Text size="sm" fw={700} c="text">{assignment.posicion?.nombre || 'General'}</Text>
                                                                </Table.Td>
                                                                <Table.Td align="right" style={{ paddingRight: 20 }}>
                                                                    <ActionIcon
                                                                        variant="subtle"
                                                                        color="gray"
                                                                        onClick={() => handleEdit(assignment)}
                                                                        aria-label="Editar"
                                                                    >
                                                                        <IconEdit size={18} />
                                                                    </ActionIcon>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        );
                                                    })}
                                                </Table.Tbody>
                                            </Table>
                                        </div>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    );
                })}
            </Stack>
        </Stack>
    );
};
