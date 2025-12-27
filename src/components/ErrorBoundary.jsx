import React from 'react';
import { Container, Title, Text, Button, Group, Paper, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // También puedes registrar el error en un servicio de reporte de errores
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container size="md" py={80}>
                    <Paper p="xl" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-red-3)' }}>
                        <Stack align="center" gap="lg">
                            <ThemeIcon size={80} radius="100%" color="red" variant="light">
                                <IconAlertTriangle size={50} />
                            </ThemeIcon>

                            <Title order={2} ta="center">¡Algo salió mal!</Title>

                            <Text c="dimmed" ta="center" size="lg">
                                Ha ocurrido un error inesperado en la aplicación. No te preocupes, hemos registrado el problema.
                            </Text>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Paper bg="gray.0" p="md" w="100%" withBorder>
                                    <Text c="red" fw={600} mb="xs">Error: {this.state.error.toString()}</Text>
                                    <Text size="xs" component="pre" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                                        {this.state.errorInfo?.componentStack}
                                    </Text>
                                </Paper>
                            )}

                            <Group>
                                <Button onClick={() => window.location.href = '/'} variant="default">
                                    Ir al Inicio
                                </Button>
                                <Button onClick={this.handleReset} color="red">
                                    Recargar Página
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}
