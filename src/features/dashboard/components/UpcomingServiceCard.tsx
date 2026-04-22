import { Card, Box, Stack, Group, Badge, ThemeIcon, Text, Title, Button, Menu } from '@mantine/core';
import { IconRocket, IconCalendarEvent, IconArrowRight, IconCalendarPlus, IconDownload, IconBrandGoogle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { UpcomingService } from '../../../hooks/useDashboardData';
import { downloadICS, googleCalendarUrl, outlookCalendarUrl } from '../../../utils/calendarSync';

// Helper to safely get the first item or the item itself
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

interface UpcomingServiceCardProps {
    nextService: UpcomingService | null;
    serverName?: string;
}

export function UpcomingServiceCard({ nextService, serverName = '' }: UpcomingServiceCardProps) {
    const navigate = useNavigate();

    if (!nextService) {
        return (
            <Card padding="xl" radius="xl" withBorder h="100%">
                <Stack align="center" justify="center" h="100%" gap="md">
                    <ThemeIcon size={60} radius="xl" color="stone" variant="light">
                        <IconCalendarEvent size={32} />
                    </ThemeIcon>
                    <Stack gap={4} align="center">
                        <Text fw={800} size="lg" c="dimmed">Sin servicios próximos</Text>
                        <Text size="sm" ta="center" c="dimmed" opacity={0.7}>Descansa y prepárate para el próximo rol.</Text>
                    </Stack>
                </Stack>
            </Card>
        );
    }

    const config = getSingle(nextService.configuracion_dia);
    const posicion = getSingle(nextService.posicion);
    const fecha: string = config?.fecha ?? '';
    const posicionNombre: string = posicion?.nombre ?? 'Servidor';
    const tipoServicio: string = config?.tipo_servicio ?? '';
    const uniforme: string = config?.color_uniforme ?? '';
    const departamento: string = getSingle(posicion?.departamento)?.nombre ?? '';

    const serviceEvent = { fecha, posicion: posicionNombre, departamento, tipoServicio, uniforme };

    const handleICS = () => {
        downloadICS([serviceEvent], serverName, `servicio-${fecha}.ics`);
    };

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
                            PRÓXIMO SERVICIO
                        </Badge>
                        <ThemeIcon variant="light" color="gold" radius="xl" size="lg">
                            <IconRocket size={20} />
                        </ThemeIcon>
                    </Group>

                    <Stack gap={2}>
                        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
                            {departamento}
                        </Text>
                        <Title order={3} style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1.7rem',
                            color: 'var(--mantine-color-gold-text)',
                            letterSpacing: '-0.01em'
                        }}>
                            {posicionNombre}
                        </Title>
                    </Stack>

                    <Group gap="xs" mt={8}>
                        <IconCalendarEvent size={18} color="#d97706" />
                        <Text size="md" fw={700} c="stone.7">
                            {fecha ? dayjs(fecha).format('dddd, D [de] MMMM') : '—'}
                        </Text>
                    </Group>

                    <Badge mt="md" size="md" variant="light" color="stone" p="md">
                        {tipoServicio}
                    </Badge>
                </div>

                <Stack gap="xs" mt="xl">
                    {/* Agregar al calendario */}
                    {fecha && (
                        <Menu shadow="md" radius="md" position="top-start">
                            <Menu.Target>
                                <Button
                                    fullWidth
                                    variant="light"
                                    color="blue"
                                    size="sm"
                                    radius="xl"
                                    leftSection={<IconCalendarPlus size={16} />}
                                >
                                    Agregar al Calendario
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Exportar a</Menu.Label>
                                <Menu.Item
                                    leftSection={<IconDownload size={14} />}
                                    onClick={handleICS}
                                >
                                    Descargar .ics (Apple / Outlook)
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconBrandGoogle size={14} />}
                                    component="a"
                                    href={googleCalendarUrl(serviceEvent)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Google Calendar
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconCalendarEvent size={14} />}
                                    component="a"
                                    href={outlookCalendarUrl(serviceEvent)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Outlook Web
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    )}

                    <Button
                        fullWidth
                        className="btn-premium"
                        size="md"
                        rightSection={<IconArrowRight size={18} />}
                        onClick={() => navigate('/calendar')}
                    >
                        Ver detalles del servicio
                    </Button>
                </Stack>
            </Stack>
        </Card>
    );
}
