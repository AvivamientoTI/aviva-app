import { Container, Title, Text, Card, Stack, Badge, Table, ScrollArea, Group, ThemeIcon } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { useUser } from '../../contexts/UserContext';
import { IconCalendarCheck, IconAlertCircle, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { JUSTIFICATION_TYPES } from '../../constants/attendance';

const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;
const JUSTIF_LABELS = Object.fromEntries(JUSTIFICATION_TYPES.map(j => [j.value, j.label]));

export default function PersonalAttendance() {
    const { userProfile } = useUser();
    const usuarioId = userProfile?.usuario_id;

    const { data: attendance, isLoading } = useQuery({
        queryKey: ['personalAttendance', usuarioId],
        queryFn: () => attendanceService.fetchPersonalAttendance(usuarioId!),
        enabled: !!usuarioId,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Asistió': return 'teal';
            case 'Faltó con Aviso': return 'yellow';
            case 'Faltó sin Aviso': return 'red';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Asistió': return <IconCheck size={16} />;
            case 'Faltó con Aviso': return <IconInfoCircle size={16} />;
            case 'Faltó sin Aviso': return <IconX size={16} />;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <Container size="xl" py="md">
                <Text>Cargando historial de asistencia...</Text>
            </Container>
        );
    }

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                <Group justify="space-between" align="flex-end">
                    <Stack gap={0}>
                        <Badge variant="filled" color="gold" size="lg" radius="sm" mb={4}>
                            MI HISTORIAL
                        </Badge>
                        <Title order={2} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
                            Mi Asistencia
                        </Title>
                    </Stack>
                    <ThemeIcon size={54} radius="xl" variant="light" color="gold">
                        <IconCalendarCheck size={32} />
                    </ThemeIcon>
                </Group>

                <Card withBorder radius="md" p="md" className="shadow-sm">
                    <ScrollArea>
                        <Table verticalSpacing="md" horizontalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Fecha</Table.Th>
                                    <Table.Th>Culto / Servicio</Table.Th>
                                    <Table.Th>Estado</Table.Th>
                                    <Table.Th>Justificación</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {attendance && attendance.length > 0 ? (
                                    attendance.map((record) => {
                                        const config = getSingle(record.configuracion_dia);
                                        return (
                                            <Table.Tr key={record.id}>
                                                <Table.Td>
                                                    <Text fw={700} size="sm">
                                                        {dayjs(config?.fecha).locale('es').format('dddd, D [de] MMMM, YYYY')}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="light" color="blue" radius="xs">
                                                        {config?.tipo_servicio || 'N/A'}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge 
                                                        color={getStatusColor(record.estado)} 
                                                        variant="filled"
                                                        leftSection={getStatusIcon(record.estado)}
                                                    >
                                                        {record.estado}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    {(record as any).tipo_justificacion ? (
                                                        <Group gap={4} wrap="nowrap">
                                                            <Badge variant="light" color="gray" size="xs">
                                                                {JUSTIF_LABELS[(record as any).tipo_justificacion] ?? (record as any).tipo_justificacion}
                                                            </Badge>
                                                            {record.justificacion && (
                                                                <Text size="xs" c="dimmed" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {record.justificacion}
                                                                </Text>
                                                            )}
                                                        </Group>
                                                    ) : record.justificacion ? (
                                                        <Group gap={4} wrap="nowrap">
                                                            <IconAlertCircle size={14} color="var(--mantine-color-gray-6)" />
                                                            <Text size="xs" c="dimmed" style={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                                                {record.justificacion}
                                                            </Text>
                                                        </Group>
                                                    ) : (
                                                        <Text size="xs" c="dimmed" fs="italic">—</Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })
                                ) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={4}>
                                            <Stack align="center" py="xl" gap="xs">
                                                <IconCalendarCheck size={40} color="var(--mantine-color-dimmed)" stroke={1.5} />
                                                <Text ta="center" c="dimmed">No se encontraron registros de asistencia.</Text>
                                            </Stack>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card>
            </Stack>
        </Container>
    );
}
