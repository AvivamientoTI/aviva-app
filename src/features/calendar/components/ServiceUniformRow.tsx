import { Box, Group, Badge, Text } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';

interface ServiceUniformRowProps {
    servicio: string;
    uniforme: string;
}

export function ServiceUniformRow({ servicio, uniforme }: ServiceUniformRowProps) {
    return (
        <Box
            p="xs"
            style={{
                background: '#fffbe6',
                borderBottom: '1.5px solid #fde047',
                borderRadius: '0 0 8px 8px',
            }}
        >
            <Group gap={10} wrap="nowrap" align="center">
                <Text fw={700} size="md" c="orange.8" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {servicio || 'Sin servicio'}
                </Text>
                <Badge
                    size="md"
                    color={getUniformeColor(uniforme)}
                    variant="filled"
                    style={{ fontWeight: 700, fontSize: '13px', letterSpacing: 0.5 }}
                >
                    {uniforme ? `Uniforme: ${uniforme}` : 'Sin uniforme'}
                </Badge>
            </Group>
        </Box>
    );
}
