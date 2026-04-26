import { Box, Group, Badge, Text, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { formatTime12h } from '../../../utils/timeFormat';

interface ServiceUniformRowProps {
    servicio: string;
    uniforme: string;
    hora_llegada?: string | null;
}

export function ServiceUniformRow({ servicio, uniforme, hora_llegada }: ServiceUniformRowProps) {
    return (
        <Box
            p="md"
            style={{
                background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
                borderBottom: '2px solid #e2e8f0',
                padding: '16px',
            }}
        >
            <Stack gap="xs">
                <Text fw={900} size="1.1rem" c="slate.9" ta="center" style={{
                    lineHeight: 1.2,
                    letterSpacing: '-0.025em',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {servicio || 'Sin servicio'}
                </Text>

                <Group gap={6} wrap="nowrap" align="center">
                    <Badge
                        fullWidth
                        size="lg"
                        color={getUniformeColor(uniforme)}
                        variant="filled"
                        radius="md"
                        style={{
                            height: '28px',
                            fontWeight: 900,
                            fontSize: '12px',
                            letterSpacing: '0.05em',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            textTransform: 'uppercase'
                        }}
                    >
                        {uniforme ? uniforme : 'Uniforme no definido'}
                    </Badge>
                </Group>

                {hora_llegada && (
                    <Group gap={6} justify="center" align="center"
                        style={{
                            background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            border: '1px solid #fcd34d',
                        }}
                    >
                        <IconClock size={16} color="#b45309" />
                        <Text size="sm" fw={900} c="orange.8">
                            Llegada: {formatTime12h(hora_llegada)}
                        </Text>
                        <Badge size="md" variant="filled" color="orange" radius="sm" style={{ fontWeight: 800 }}>
                            {hora_llegada < '12:00' ? 'Mañana' : hora_llegada < '17:00' ? 'Tarde' : 'Noche'}
                        </Badge>
                    </Group>
                )}
            </Stack>
        </Box>
    );
}
