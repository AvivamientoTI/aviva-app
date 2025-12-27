import React from 'react';
import { Modal, Text, Group, Button } from '@mantine/core';
import dayjs from 'dayjs';

export function AssignmentDetailModal({
    opened,
    onClose,
    selectedEvent,
    onDelete,
    canModify
}) {
    return (
        <Modal opened={opened} onClose={onClose} title="Detalles de Asignación">
            {selectedEvent && (
                <>
                    <Text size="lg" fw={500} mb="xs">{selectedEvent.title}</Text>
                    <Text size="sm" c="dimmed" mb="xs">
                        Fecha: {dayjs(selectedEvent.start).format('DD/MM/YYYY')}
                    </Text>
                    <Text size="md" fw={600} c="orange" mb="md">
                        Tipo de servicio: <span style={{ fontSize: '18px' }}>{selectedEvent.resource?.configuracion_dia?.tipo_servicio || 'N/A'}</span>
                    </Text>
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
