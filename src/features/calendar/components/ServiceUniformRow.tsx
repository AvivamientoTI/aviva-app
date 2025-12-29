import { Box, Group, Badge, Text } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';
import { getServiceColor } from '../../../utils/calendar/labelColorMapper';

interface ServiceUniformRowProps {
    servicio: string;
    uniforme: string;
}

export function ServiceUniformRow({ servicio, uniforme }: ServiceUniformRowProps) {
    return (
        <Box
            p="xs"
            style={{
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                padding: '10px 16px',
            }}
        >
            <Group gap={10} wrap="nowrap" align="center">
                <Text fw={800} size="md" c="blue.9" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.2px' }}>
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
