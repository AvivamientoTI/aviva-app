import React from 'react';
import { Table, Group, ActionIcon, Text, Badge, Paper, Avatar, RingProgress, Stack, Center } from '@mantine/core';
import { IconEdit, IconTrash, IconUser, IconCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';

export const PlanningStepReview = ({
    assignments,
    serviceConfigs,
    handleEdit,
    handleDelete,
    conflicts = {}
}) => {
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
    const sorted = [...assignments].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Stats
    const uniqueUsers = new Set(sorted.map(a => a.usuario_id)).size;
    const totalAssignments = sorted.length;

    return (
        <Stack spacing="xl">
            {/* Stats Summary */}
            <Group grow>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'blue' }]}
                            label={<Center><IconUser size={20} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Voluntarios</Text>
                            <Text fw={800} size="xl" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{uniqueUsers}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <RingProgress
                            size={60}
                            roundCaps
                            thickness={6}
                            sections={[{ value: 100, color: 'teal' }]}
                            label={<Center><IconCheck size={20} /></Center>}
                        />
                        <div>
                            <Text c="dimmed" size="xs" tt="uppercase" fw={800} style={{ letterSpacing: '0.05em' }}>Asignaciones</Text>
                            <Text fw={800} size="xl" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{totalAssignments}</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            <Paper shadow="sm" radius="md" withBorder>
                <Table verticalSpacing="sm" striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Voluntario</Table.Th>
                            <Table.Th>Posición</Table.Th>
                            <Table.Th>Detalles</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sorted.map((assignment) => {
                            const displayDate = dayjs(assignment.fecha || assignment.configuracion_dia?.fecha);
                            const dateKey = displayDate.format('YYYY-MM-DD');
                            const config = serviceConfigs[dateKey] || {};
                            const conflictDepts = conflicts[assignment.id];

                            return (
                                <Table.Tr key={assignment.id} style={conflictDepts ? { backgroundColor: 'var(--mantine-color-red-light)' } : {}}>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Text fw={500} size="sm">{displayDate.format('dddd D')}</Text>
                                        <Text c="dimmed" size="xs">{displayDate.format('MMMM')}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Group gap="sm">
                                            <Avatar color="blue" radius="xl">
                                                {assignment.usuario?.nombre?.[0]}{assignment.usuario?.apellido?.[0]}
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={500}>{assignment.usuario?.nombre} {assignment.usuario?.apellido}</Text>
                                                {conflictDepts && (
                                                    <Badge variant="light" color="orange" size="xs" mt={4} leftSection="⚠️">
                                                        Ocupado en: {conflictDepts.join(', ')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Badge variant="dot" color="gray" size="lg">{assignment.posicion?.nombre || 'General'}</Badge>
                                    </Table.Td>
                                    <Table.Td style={{ verticalAlign: 'middle' }}>
                                        <Group gap="xs">
                                            <Badge variant="outline" size="sm">{config.type}</Badge>
                                            <Text size="xs" c="dimmed">Unif: {config.uniform}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                        <ActionIcon
                                            variant="light"
                                            color="blue"
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
