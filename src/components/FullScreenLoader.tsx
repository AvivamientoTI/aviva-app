import { Center, Stack, Loader, Text } from '@mantine/core';

interface FullScreenLoaderProps {
    message?: string;
    subMessage?: string;
}

export function FullScreenLoader({ 
    message = 'Servidores AYP', 
    subMessage = 'Iniciando Sesión' 
}: FullScreenLoaderProps) {
    return (
        <Center h="100vh" w="100vw" style={{ backgroundColor: '#fcfaf5', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
            <Stack align="center" gap="xl">
                <Loader size="xl" color="yellow.7" type="dots" />
                <Text size="2.4rem" fw={800} variant="gradient" gradient={{ from: '#d97706', to: '#b45309' }} style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
                    {message}
                </Text>
                {subMessage && (
                    <Text size="xs" fw={800} c="stone.5" tt="uppercase" style={{ letterSpacing: '0.15em' }}>
                        {subMessage}
                    </Text>
                )}
            </Stack>
        </Center>
    );
}
