
import { Card, Box, Stack, Group, Badge, ThemeIcon, Text, Title, Button } from '@mantine/core';
import { IconRocket, IconCalendarEvent, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UpcomingService } from '../../../hooks/useDashboardData';

// Helper to safely get the first item or the item itself
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

interface UpcomingServiceCardProps {
    nextService: UpcomingService | null;
}

export function UpcomingServiceCard({ nextService }: UpcomingServiceCardProps) {
    const navigate = useNavigate();

    if (!nextService) {
        return (
            <Card padding="xl" radius="xl" withBorder h="100%">
                <Stack align="center" justify="center" h="100%" gap="md">
                    <ThemeIcon size={60} radius="xl" color="stone" variant="light">
                        <IconCalendarEvent size={32} />
                    </ThemeIcon>
                    <Stack gap={4} align="center">
                        <Text fw={800} size="lg" c="dimmed">Sin misiones próximas</Text>
                        <Text size="sm" ta="center" c="dimmed" opacity={0.7}>Descansa y prepárate para el próximo rol.</Text>
                    </Stack>
                </Stack>
            </Card>
        );
    }

    return (
        <Card padding="xl" radius="xl" withBorder className="animate-fade-in" style={{
            background: 'var(--mantine-color-body)',
            borderColor: 'var(--mantine-color-default-border)',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box style={{
                position: 'absolute',
                top: -20,
                right: -20,
                opacity: 0.05,
                transform: 'rotate(15deg)'
            }}>
                <IconRocket size={160} color="#d97706" />
            </Box>

            <Stack justify="space-between" h="100%">
                <div>
                    <Group justify="space-between" mb="lg">
                        <Badge variant="gradient" gradient={{ from: 'orange.6', to: 'yellow.6' }} size="lg" radius="md">
                            PRÓXIMA MISIÓN
                        </Badge>
                        <ThemeIcon variant="light" color="gold" radius="xl" size="lg">
                            <IconRocket size={20} />
                        </ThemeIcon>
                    </Group>

                    <Stack gap={2}>
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
                            {getSingle(getSingle(nextService.posicion)?.departamento)?.nombre}
                        </Text>
                        <Title order={3} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1.7rem',
                            color: 'var(--mantine-color-gold-text)',
                            letterSpacing: '-0.01em'
                        }}>
                            {getSingle(nextService.posicion)?.nombre || 'Servidor'}
                        </Title>
                    </Stack>

                    <Group gap="xs" mt={8}>
                        <IconCalendarEvent size={18} color="#d97706" />
                        <Text size="md" fw={700} c="stone.7">
                            {dayjs(getSingle(nextService.configuracion_dia)?.fecha).format('dddd, D [de] MMMM')}
                        </Text>
                    </Group>

                    <Badge mt="md" size="md" variant="light" color="stone" p="md">
                        {getSingle(nextService.configuracion_dia)?.tipo_servicio}
                    </Badge>
                </div>

                <Button
                    fullWidth
                    className="btn-premium"
                    mt="xl"
                    size="md"
                    rightSection={<IconArrowRight size={18} />}
                    onClick={() => navigate('/calendar')}
                >
                    Ver Detalles de Misión
                </Button>
            </Stack>
        </Card>
    );
}
