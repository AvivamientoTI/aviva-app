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
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                padding: '10px 16px',
            }}
        >
            <Group gap={8} wrap="nowrap" align="center">
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={900} size="lg" c="slate.9" style={{ overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                        {servicio || 'Sin servicio'}
                    </Text>
                </Box>
                <Badge
                    size="lg"
                    color={getUniformeColor(uniforme)}
                    variant="filled"
                    radius="md"
                    style={{
                        fontWeight: 900,
                        fontSize: '13px',
                        letterSpacing: '0.02em',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        textTransform: 'uppercase'
                    }}
                >
                    Uniforme: {uniforme ? uniforme : 'Sin uniforme'}
                </Badge>
            </Group>
        </Box>
    );
}
