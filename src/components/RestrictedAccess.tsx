import { Center, Paper, Title, Text, Stack, Divider } from '@mantine/core';

export function RestrictedAccess() {
    return (
        <Center h="100vh" w="100vw" style={{ backgroundColor: '#f8fafc' }}>
            <Paper shadow="xl" p="xl" radius="lg" withBorder style={{
                minWidth: 320,
                maxWidth: 400,
                backgroundColor: '#ffffff',
                borderTop: '4px solid #ef4444'
            }}>
                <Stack align="center" gap="md">
                    <Title order={3} ta="center" c="gray.9" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
                        Acceso Denegado
                    </Title>
                    <Text ta="center" c="slate.8" size="md" fw={700}>
                        Lo sentimos, no tienes los permisos necesarios para acceder a esta sección.
                    </Text>
                    <Divider w="100%" />
                    <Text ta="center" c="slate.6" size="sm" fw={600}>
                        Comunícate con el administrador si necesitas acceso adicional.
                    </Text>
                </Stack>
            </Paper>
        </Center>
    );
}
