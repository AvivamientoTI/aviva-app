import { Center, Paper, Title, Text, Stack, Divider, Button } from '@mantine/core';
import { supabase } from '../services/supabaseClient';

interface RestrictedAccessProps {
    type?: 'no-profile' | 'no-permissions';
}

export function RestrictedAccess({ type = 'no-permissions' }: RestrictedAccessProps) {
    const isNoProfile = type === 'no-profile';

    return (
        <Center h="100vh" w="100vw" style={{ backgroundColor: '#f8fafc' }}>
            <Paper shadow="xl" p="xl" radius="lg" withBorder style={{
                minWidth: 320,
                maxWidth: 400,
                backgroundColor: '#ffffff',
                borderTop: `4px solid ${isNoProfile ? '#f59e0b' : '#ef4444'}`
            }}>
                <Stack align="center" gap="md">
                    <Title order={3} ta="center" c="gray.9" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
                        {isNoProfile ? 'Perfil no vinculado' : 'Acceso Denegado'}
                    </Title>
                    <Text ta="center" c="slate.8" size="md" fw={700}>
                        {isNoProfile
                            ? 'Tu cuenta de acceso no está vinculada a un perfil de servidor en la base de datos.'
                            : 'Lo sentimos, no tienes los permisos necesarios para acceder a esta sección.'}
                    </Text>
                    <Divider w="100%" />
                    <Text ta="center" c="slate.6" size="sm" fw={600}>
                        {isNoProfile
                            ? 'Por favor, contacta a tu líder o administrador para que vincule tu correo electrónico.'
                            : 'Comunícate con el administrador si necesitas acceso adicional.'}
                    </Text>
                    {isNoProfile && (
                        <Button
                            variant="light"
                            color="orange"
                            fullWidth
                            onClick={() => supabase.auth.signOut().then(() => window.location.replace('/login'))}
                        >
                            Volver al inicio
                        </Button>
                    )}
                </Stack>
            </Paper>
        </Center>
    );
}
