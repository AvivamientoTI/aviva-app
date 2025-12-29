import { Modal, Text, Group, Button, Badge } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
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
                    <Group mb="xs">
                        <Text size="sm" fw={800} c="slate.6" tt="uppercase">Tipo:</Text>
                        <Text size="md" fw={700} c="blue.7">{selectedEvent.resource?.configuracion_dia?.tipo_servicio || 'N/A'}</Text>
                    </Group>
                    <Group mb="md">
                        <Badge
                            color={getUniformeColor(selectedEvent.resource?.configuracion_dia?.color_uniforme)}
                            variant="filled"
                            size="lg"
                            radius="md"
                            style={{ fontWeight: 800, textTransform: 'uppercase' }}
                        >
                            Uniforme: {selectedEvent.resource?.configuracion_dia?.color_uniforme || 'Sin uniforme'}
                        </Badge>
                    </Group>
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
