import { Box, Stack, Text, Paper, Group, Title, Badge, Table } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import dayjs from 'dayjs';
import type { Membership } from '../../../types';

interface Assignment {
    id: string | number;
    usuario_id: string | number;
    departamento_id: string | number;
    nombre: string;
    posicion: string;
    uniforme: string;
    orden?: number;
}

interface DayData {
    servicio: string;
    assignments: Assignment[];
    encargado: string | null;
}

interface DetailedListTabProps {
    groupedAssignments: Record<string, DayData>;
    userMemberships: Membership[];
}

export function DetailedListTab({ groupedAssignments }: DetailedListTabProps) {
    return (
        <Box p="md" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f3f5 100%)', borderRadius: 12 }}>
            <Stack gap="xl">
                {Object.keys(groupedAssignments).length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">No hay asignaciones para este departamento</Text>
                ) : (
                    Object.entries(groupedAssignments).map(([fecha, dayData]) => (
                        <Paper key={fecha} p="xl" radius="lg" shadow="sm" withBorder style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                            <Group justify="space-between" mb="lg">
                                <Stack gap={4}>
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" ls="0.5px">
                                        {dayjs(fecha).format('MMMM YYYY')}
                                    </Text>
                                    <Title order={3} c="blue.9" style={{ letterSpacing: '-0.5px' }}>
                                        {dayjs(fecha).format('dddd, DD')}
                                    </Title>
                                </Stack>
                                <Badge size="xl" color="indigo" variant="light" radius="md" p="md">
                                    {dayData.servicio || 'Servicio General'}
                                </Badge>
                            </Group>

                            {dayData.encargado && (
                                <Paper p="md" mb="lg" radius="md" style={{
                                    background: 'linear-gradient(90deg, #fefce8 0%, #fef9c3 100%)',
                                    border: '1px solid #fde047'
                                }}>
                                    <Group gap="xs">
                                        <Text size="sm" fw={800} c="yellow.9">ENCARGADO(A):</Text>
                                        <Text size="md" fw={700} c="yellow.9">{dayData.encargado}</Text>
                                    </Group>
                                </Paper>
                            )}

                            <Table verticalSpacing="sm" horizontalSpacing="md" style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                <Table.Thead height={44} style={{ background: '#f8fafc' }}>
                                    <Table.Tr>
                                        <Table.Th style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Servidor(a)</Table.Th>
                                        <Table.Th style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Posición</Table.Th>
                                        <Table.Th style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Uniforme</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {dayData.assignments.map((asig) => (
                                        <Table.Tr key={asig.id}>
                                            <Table.Td fw={700} style={{ fontSize: '15px', color: '#1e293b' }}>{asig.nombre}</Table.Td>
                                            <Table.Td>
                                                <Group justify="center">
                                                    <Badge
                                                        variant="filled"
                                                        bg="#ffedd5"
                                                        c="#9a3412"
                                                        size="md"
                                                        radius="sm"
                                                        style={{
                                                            border: '1px solid #fed7aa',
                                                            fontWeight: 700,
                                                            width: '140px',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        {asig.posicion}
                                                    </Badge>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group justify="center">
                                                    <Badge
                                                        color={getUniformeColor(asig.uniforme)}
                                                        variant="dot"
                                                        size="md"
                                                        fw={700}
                                                        style={{
                                                            width: '140px',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {asig.uniforme}
                                                    </Badge>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    ))
                )}
            </Stack>
        </Box>
    );
}
