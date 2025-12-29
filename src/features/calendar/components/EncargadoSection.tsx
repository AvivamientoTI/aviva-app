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
                background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                borderRadius: '12px 12px 0 0',
                padding: '10px 0 8px 0',
                marginBottom: 4,
                borderBottom: '1.5px solid #fcd34d',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
        >
            <Group gap={8} align="center" justify="center">
                <ThemeIcon size="sm" radius="xl" color="amber.6" variant="filled">
                    <IconStar size={14} style={{ fill: 'currentColor' }} />
                </ThemeIcon>
                <Text size="xs" fw={900} c="amber.9" style={{ letterSpacing: '0.05em' }} tt="uppercase">
                    Encargado(a):
                </Text>
                <Text size="sm" fw={800} c="slate.9" style={{ letterSpacing: '-0.01em' }}>
                    {displayName}
                </Text>
            </Group>
        </Box>
    );
}
