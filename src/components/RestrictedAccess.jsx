import React from 'react';
import { Center, Paper, Title, Text } from '@mantine/core';

export function RestrictedAccess() {
  return (
    <Center h="100vh" w="100vw" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
      <Paper shadow="md" p="xl" radius="md" style={{ minWidth: 320, maxWidth: 400 }}>
        <Title order={3} ta="center" mb="md" color="red">
          Acceso restringido
        </Title>
        <Text ta="center" color="dimmed">
          No tienes permisos para acceder a esta aplicación.<br />
          Si crees que esto es un error, contacta al administrador.
        </Text>
      </Paper>
    </Center>
  );
}
