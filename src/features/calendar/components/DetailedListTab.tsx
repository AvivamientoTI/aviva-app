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
                                    <Text size="xs" fw={800} c="blue.6" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                                        {dayjs(fecha).format('MMMM YYYY')}
                                    </Text>
                                    <Title order={3} c="slate.9" style={{ letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                                        {dayjs(fecha).format('dddd, DD')}
                                    </Title>
                                </Stack>
                                <Group gap="sm">
                                    <Badge
                                        color={getUniformeColor(dayData.assignments[0]?.uniforme)}
                                        variant="filled"
                                        size="lg"
                                        radius="md"
                                        style={{
                                            height: 40,
                                            padding: '0 20px',
                                            fontWeight: 800,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Uniforme: {dayData.assignments[0]?.uniforme || 'N/A'}
                                    </Badge>
                                    <Badge size="xl" color="blue" variant="light" radius="md" p="md" fw={700}>
                                        {dayData.servicio || 'Servicio General'}
                                    </Badge>
                                </Group>
                            </Group>

                            {dayData.encargado && (
                                <Paper p="md" mb="lg" radius="md" withBorder style={{
                                    background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                                    borderColor: '#fde047',
                                    borderLeft: '4px solid #f59e0b'
                                }}>
                                    <Group gap="xs">
                                        <Text size="xs" fw={900} c="amber.9" tt="uppercase" style={{ letterSpacing: '0.05em' }}>Encargado(a):</Text>
                                        <Text size="md" fw={700} c="slate.9">{dayData.encargado}</Text>
                                    </Group>
                                </Paper>
                            )}

                            <Table verticalSpacing="sm" horizontalSpacing="md" style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                <Table.Thead style={{ height: 44, background: '#f8fafc' }}>
                                    <Table.Tr>
                                        <Table.Th style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Servidor(a)</Table.Th>
                                        <Table.Th style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Posición</Table.Th>
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
