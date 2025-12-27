import React from 'react';
import { Box, Stack, Text, Paper, Group, Title, Badge, Table } from '@mantine/core';
import dayjs from 'dayjs';

export function DetailedListTab({ groupedAssignments, userMemberships }) {
    return (
        <Box p="md" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f3f5 100%)', borderRadius: 12 }}>
            <Stack gap="xl">
                {Object.keys(groupedAssignments).length === 0 ? (
                    <Text c="dimmed" ta="center">No hay asignaciones para este departamento</Text>
                ) : (
                    Object.entries(groupedAssignments).map(([fecha, dayData]) => (
                        <Paper key={fecha} p="lg" radius="md" shadow="sm" withBorder style={{ background: '#fff', borderLeft: '6px solid #228be6' }}>
                            <Group justify="space-between" mb="md">
                                <Group gap="sm">
                                    <Title order={4} c="blue.8">{dayjs(fecha).format('dddd, DD [de] MMMM [de] YYYY')}</Title>
                                    <Badge size="lg" color="orange" variant="filled" radius="sm">{dayData.servicio || 'N/A'}</Badge>
                                </Group>
                                <Badge size="lg" color="gray" variant="light" radius="sm">
                                    {dayData.assignments.length} servidor{dayData.assignments.length !== 1 ? 'es(as)' : '(a)'}
                                </Badge>
                            </Group>
                            {dayData.encargado && (
                                <Paper p="sm" mb="md" style={{ backgroundColor: '#fffbe6', border: '1.5px solid #ffe066' }}>
                                    <Group gap="xs">
                                        <Text size="sm" fw={700} c="yellow.9">Encargado(a):</Text>
                                        <Text size="sm" fw={600} c="yellow.9">{dayData.encargado}</Text>
                                    </Group>
                                </Paper>
                            )}
                            <Table highlightOnHover striped withColumnBorders withRowBorders style={{ borderRadius: 8, overflow: 'hidden' }}>
                                <Table.Thead style={{ position: 'sticky', top: 0, background: '#f1f3f5', zIndex: 1 }}>
                                    <Table.Tr>
                                        <Table.Th style={{ width: '30%' }}>Servidor(a)</Table.Th>
                                        <Table.Th style={{ width: '25%' }}>Posición</Table.Th>
                                        <Table.Th style={{ width: '25%' }}>Uniforme</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {dayData.assignments.map((asig) => {
                                        let rolMensual = '';
                                        const membership = (userMemberships || []).find(m =>
                                            String(m.usuario_id) === String(asig.usuario_id) &&
                                            String(m.departamento?.id) === String(asig.departamento_id)
                                        );
                                        if (membership) {
                                            const rawRol = membership.rol_jerarquico ? membership.rol_jerarquico.trim().toLowerCase() : '';
                                            if (!rawRol || rawRol === 'servidor') {
                                                rolMensual = 'Servidor';
                                            } else {
                                                rolMensual = membership.rol_jerarquico;
                                            }
                                        }
                                        return (
                                            <Table.Tr key={asig.id}>
                                                <Table.Td fw={600} style={{ fontSize: 15 }}>{asig.nombre}</Table.Td>
                                                <Table.Td>
                                                    <Badge variant="filled" color="blue" size="md" radius="sm">{asig.posicion}</Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge color="grape" size="md" radius="sm">{asig.uniforme}</Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    ))
                )}
            </Stack>
        </Box>
    );
}
