import { Modal, Text, Group, Button, Badge, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { formatTime12h } from '../../../utils/timeFormat';
import dayjs from 'dayjs';

interface AssignmentDetailModalProps {
    opened: boolean;
    onClose: () => void;
    selectedEvent: any; // TODO: Define Event interface
    onDelete: () => void;
    canModify: boolean;
}

export function AssignmentDetailModal({
    opened,
    onClose,
    selectedEvent,
    onDelete,
    canModify
}: AssignmentDetailModalProps) {
    return (
        <Modal opened={opened} onClose={onClose} title="Detalles de Asignación">
            {selectedEvent && (
                <>
                    <Text size="lg" fw={500} mb="xs">{selectedEvent.title}</Text>
                    <Text size="sm" c="dimmed" mb="xs">
                        Fecha: {dayjs(selectedEvent.start).format('DD/MM/YYYY')}
                    </Text>
                    <Stack gap="xs" mb="md">
                        <Group>
                            <Text size="sm" fw={800} c="slate.6" tt="uppercase">Tipo:</Text>
                            <Text size="md" fw={700} c="blue.7">{selectedEvent.resource?.configuracion_dia?.tipo_servicio || 'N/A'}</Text>
                        </Group>
                        {selectedEvent.resource?.configuracion_dia?.hora_llegada && (
                            <Group gap="xs">
                                <IconClock size={16} color="var(--mantine-color-gold-6)" />
                                <Text size="sm" fw={700} c="gold.7">
                                    Llegada: {formatTime12h(selectedEvent.resource.configuracion_dia.hora_llegada)}
                                </Text>
                                <Badge size="sm" variant="light" color="gold" radius="sm">
                                    {selectedEvent.resource.configuracion_dia.hora_llegada < '12:00' ? 'Mañana'
                                        : selectedEvent.resource.configuracion_dia.hora_llegada < '17:00' ? 'Tarde'
                                        : 'Noche'}
                                </Badge>
                            </Group>
                        )}
                        <Badge
                            color={getUniformeColor(selectedEvent.resource?.configuracion_dia?.color_uniforme)}
                            variant="filled"
                            size="lg"
                            radius="md"
                            style={{ fontWeight: 800, textTransform: 'uppercase' }}
                        >
                            Uniforme: {selectedEvent.resource?.configuracion_dia?.color_uniforme || 'Sin uniforme'}
                        </Badge>
                    </Stack>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>Cerrar</Button>
                        <Button color="red" onClick={onDelete} disabled={!canModify}>
                            Eliminar Asignación
                        </Button>
                    </Group>
                </>
            )}
        </Modal>
    );
}
