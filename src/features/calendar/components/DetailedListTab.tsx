import { useState, useMemo } from 'react';
import { Box, Stack, Text, Paper, Group, Title, Badge, Table, Divider, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import dayjs from 'dayjs';
import 'dayjs/locale/es';


import type { CalendarAssignment } from '../../../utils/calendar/transformerTypes';

interface DayData {
    servicio: string;
    assignments: CalendarAssignment[];
    encargado: string | null;
}

interface DetailedListTabProps {
    groupedAssignments: Record<string, DayData>;
}

export function DetailedListTab({ groupedAssignments }: DetailedListTabProps) {
    // State for current month navigation
    // Initialize to current month to start
    const [currentDate, setCurrentDate] = useState(dayjs());

    const handlePrevMonth = () => setCurrentDate(prev => prev.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentDate(prev => prev.add(1, 'month'));

    // Filter assignments for the CURRENT month only
    const currentMonthAssignments = useMemo(() => {
        const targetMonth = currentDate.format('YYYY-MM');

        // Filter keys that match this month
        const daysInMonth = Object.keys(groupedAssignments)
            .filter(date => dayjs(date).format('YYYY-MM') === targetMonth)
            .sort();

        // Return array of { date, data }
        return daysInMonth.map(date => ({
            date,
            data: groupedAssignments[date]
        }));
    }, [groupedAssignments, currentDate]);

    return (
        <Box p="md" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f3f5 100%)', borderRadius: 12 }}>
            <Stack gap="md">

                {/* Navigation Header */}
                <Group justify="center" mb="lg">
                    <ActionIcon variant="light" size="lg" radius="xl" onClick={handlePrevMonth} aria-label="Mes anterior">
                        <IconChevronLeft size={20} />
                    </ActionIcon>
                    <Title order={3} tt="capitalize" w={220} ta="center" c="slate.8" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {currentDate.locale('es').format('MMMM YYYY')}
                    </Title>
                    <ActionIcon variant="light" size="lg" radius="xl" onClick={handleNextMonth} aria-label="Siguiente mes">
                        <IconChevronRight size={20} />
                    </ActionIcon>
                </Group>

                <Divider mb="xl" color="gray.3" />

                {currentMonthAssignments.length === 0 ? (
                    <Paper p="xl" radius="lg" withBorder style={{
                        background: '#fff',
                        borderColor: '#e2e8f0',
                        borderStyle: 'dashed',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 200
                    }}>
                        <Text c="dimmed" size="lg" ta="center">
                            No hay asignaciones programadas para {currentDate.locale('es').format('MMMM YYYY')}
                        </Text>
                    </Paper>
                ) : (
                    <Stack gap="lg">
                        {currentMonthAssignments.map(({ date, data: dayData }) => (
                            <Paper key={date} p="xl" radius="lg" shadow="sm" withBorder style={{ background: '#fff', borderColor: '#e2e8f0' }}>
                                <Group justify="space-between" mb="lg">
                                    <Stack gap={4}>
                                        <Text size="xs" fw={800} c="gold.6" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                                            {dayjs(date).locale('es').format('dddd')}
                                        </Text>
                                        <Title order={3} c="slate.9" style={{ letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                                            {dayjs(date).format('DD')}
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
                                        <Badge size="xl" color="gold" variant="light" radius="md" p="md" fw={700} c="gold.9">
                                            {dayData.servicio || 'Servicio General'}
                                        </Badge>
                                    </Group>
                                </Group>


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
                        ))}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
