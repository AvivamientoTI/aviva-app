import { Box, Group, Text, ThemeIcon } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

interface EncargadoSectionProps {
    encargado: string;
}

export function EncargadoSection({ encargado }: EncargadoSectionProps) {
    const displayName = encargado && String(encargado).trim() ? encargado : 'Sin encargado';
    return (
        <Box
            style={{
                width: '100%',
                background: 'linear-gradient(90deg, #fef08a 0%, #fde047 100%)',
                borderRadius: '8px 8px 0 0',
                padding: '8px 0 6px 0',
                marginBottom: 4,
                boxShadow: '0 1px 4px rgba(251, 191, 36, 0.10)'
            }}
        >
            <Group gap={8} align="center" justify="center">
                <ThemeIcon size="md" radius="xl" color="yellow" variant="filled">
                    <IconStar size={18} style={{ fill: '#f59e0b' }} />
                </ThemeIcon>
                <Text size="md" fw={900} c="#b45309" style={{ letterSpacing: 1 }}>
                    Encargado(a):
                </Text>
                <Text size="md" fw={900} c="#b45309" style={{ letterSpacing: 1 }}>
                    {displayName}
                </Text>
            </Group>
        </Box>
    );
}
