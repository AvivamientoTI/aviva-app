import { Box, Group, Badge, Text, Stack } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { IconShirt, IconTimeline } from '@tabler/icons-react';

interface ServiceUniformRowProps {
    servicio: string;
    uniforme: string;
}

export function ServiceUniformRow({ servicio, uniforme }: ServiceUniformRowProps) {
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
                {/* Tipo de Servicio */}
                <Group gap={6} wrap="nowrap" align="center" justify="center">
                    <IconTimeline size={20} color="#64748b" style={{ flexShrink: 0 }} />
                    <Text fw={900} size="1.1rem" c="slate.9" ta="center" style={{
                        lineHeight: 1.2,
                        letterSpacing: '-0.025em',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        {servicio || 'Sin servicio'}
                    </Text>
                </Group>

                {/* Uniforme */}
                <Group gap={6} wrap="nowrap" align="center">
                    <IconShirt size={18} color="#64748b" style={{ flexShrink: 0 }} />
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
            </Stack>
        </Box>
    );
}
