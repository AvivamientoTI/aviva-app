import { ActionIcon, Avatar, Badge, Center, Group, Paper, RingProgress, Stack, Table, Text } from '@mantine/core';
import { IconCheck, IconEdit, IconUser } from '@tabler/icons-react';
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
    serviceConfigs: Record<string, { type: string; uniform: string }>;
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

    // Sort by date
    const sorted = [...assignments].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Stats
    const uniqueUsers = new Set(sorted.map(a => a.usuario_id)).size;
    const totalAssignments = sorted.length;

    return (
        <Stack gap="xl">
            {/* Stats Summary */}
            <Group grow>
                <Paper withBorder p="md" radius="lg" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'gold.6' }]}
                            label={<Center><IconUser size={20} color="var(--mantine-color-gold-6)" /></Center>}
                        />
                        <div>
                            <Text c="slate.7" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Voluntarios</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', lineHeight: 1 }}>{uniqueUsers}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="lg" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'teal.4' }]}
                            label={<Center><IconCheck size={20} color="var(--mantine-color-teal-4)" /></Center>}
                        />
                        <div>
                            <Text c="slate.7" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asignaciones</Text>
                            <Text fw={900} size="xl" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', lineHeight: 1 }}>{totalAssignments}</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            <Paper shadow="sm" radius="lg" withBorder style={{ borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
                        <Table.Tr>
                            <Table.Th style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Fecha</Table.Th>
                            <Table.Th style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Voluntario</Table.Th>
                            <Table.Th style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Posición</Table.Th>
                            <Table.Th style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Detalles</Table.Th>
                            <Table.Th style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sorted.map((assignment) => {
                            const displayDate = dayjs(assignment.fecha || assignment.configuracion_dia?.fecha);
                            const dateKey = displayDate.format('YYYY-MM-DD');
                            const config = serviceConfigs[dateKey] || {};
                            const conflictDepts = conflicts[assignment.id];

                            return (
                                <Table.Tr key={assignment.id} style={conflictDepts ? { backgroundColor: '#fff5f5' } : {}}>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Text fw={800} size="sm" c="slate.9">{displayDate.format('dddd D')}</Text>
                                        <Text c="slate.7" size="xs" fw={700} tt="capitalize">{displayDate.format('MMMM')}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Group gap="sm">
                                            <Avatar color="gold" radius="md" size="sm" variant="light">
                                                {assignment.usuario?.nombre?.[0]}{assignment.usuario?.apellido?.[0]}
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={700} c="slate.9">{assignment.usuario?.nombre} {assignment.usuario?.apellido}</Text>
                                                {conflictDepts && (
                                                    <Badge variant="light" color="red" size="xs" mt={4} radius="sm">
                                                        ⚠️ Ocupado en: {conflictDepts.join(', ')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Badge variant="light" color="gold" size="md" radius="sm" fw={800} c="gold.9">{assignment.posicion?.nombre || 'General'}</Badge>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Stack gap={4}>
                                            <Text size="xs" fw={800} c="slate.9" tt="uppercase" style={{ letterSpacing: '0.05em' }}>{config.type}</Text>
                                            <Badge
                                                variant="filled"
                                                color={getUniformeColor(config.uniform)}
                                                size="xs"
                                                radius="sm"
                                                fw={800}
                                                style={{ textTransform: 'uppercase' }}
                                            >
                                                Uniforme: {config.uniform}
                                            </Badge>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                        <ActionIcon
                                            variant="light"
                                            color="gold"
                                            radius="md"
                                            size="lg"
                                            onClick={() => handleEdit(assignment)}
                                            title="Cambiar servidor"
                                        >
                                            <IconEdit size={18} />
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Stack>
    );
};
