import React from 'react';
import { Card, Image, Text, Badge, Group, Button } from '@mantine/core';
import { calculateAge } from '../utils/ageCalculator';

export function UserCard({ user, onEdit, onDelete }) {
  const age = calculateAge(user.fecha_nacimiento);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{user.nombre} {user.apellido}</Text>
        <Badge color={user.genero === 'M' ? 'blue' : 'pink'}>{user.genero}</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        Edad: {age} años
      </Text>
      <Text size="sm" c="dimmed">
        Tel: {user.telefono || 'N/A'}
      </Text>

      <Group mt="md" grow>
        <Button variant="light" color="blue" onClick={() => onEdit(user)}>
          Editar
        </Button>
        <Button variant="light" color="red" onClick={() => onDelete(user.id)}>
          Eliminar
        </Button>
      </Group>
    </Card>
  );
}
