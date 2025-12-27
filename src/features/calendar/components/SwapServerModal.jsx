import React from 'react';
import { Modal, Stack, Text, Group, Button, Select } from '@mantine/core';

export function SwapServerModal({
    opened,
    onClose,
    userOptions,
    selectedUserId,
    onSelectedUserIdChange,
    onSwap,
    loading
}) {
    return (
        <Modal opened={opened} onClose={onClose} title="Cambiar servidor(a)" centered>
            <Stack gap="sm">
                <Text size="sm" c="dimmed">
                    Selecciona un(a) servidor(a) disponible para esta asignación.
                </Text>
                <Group justify="space-between" gap="xs">
                    <Text size="sm" fw={600}>
                        Disponibles: {userOptions.length}
                    </Text>
                    <Text size="xs" c="dimmed">
                        (excluye los ya asignados ese día)
                    </Text>
                </Group>
                <Select
                    placeholder="Elige servidor(a) disponible"
                    data={userOptions}
                    value={selectedUserId}
                    onChange={onSelectedUserIdChange}
                    searchable
                    nothingFoundMessage={userOptions.length === 0 ? "No hay servidores(as) disponibles ese día" : undefined}
                />
                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>Cancelar</Button>
                    <Button loading={loading} onClick={onSwap} disabled={!selectedUserId}>Guardar cambio</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
