import React, { type ReactNode } from 'react';
import { Container, Title, Text, Button, Group, Paper, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

import * as Sentry from "@sentry/react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        // Actualiza el estado para que el siguiente renderizado muestre la UI de repuesto
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        Sentry.captureException(error, { extra: { ...errorInfo } });
        
        // Auto-fix para White Screen / Chunk Error en Vercel
        const isChunkError = error.name === 'ChunkLoadError' || 
                             error.message.includes('fetch') || 
                             error.message.includes('dynamically imported module');
                             
        if (isChunkError) {
            const hasReloaded = sessionStorage.getItem('chunk_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_reload', 'true');
                window.location.reload();
                return;
            }
        }
        
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

                            {import.meta.env.DEV && this.state.error && (
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
