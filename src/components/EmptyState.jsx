import React from 'react';
import { Center, Stack, ThemeIcon, Text, Button } from '@mantine/core';
import { IconCalendarOff, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function EmptyState({
    icon: Icon = IconCalendarOff,
    title = 'No hay datos disponibles',
    description = 'Aún no se han creado registros',
    actionLabel,
    actionPath,
    onAction
}) {
    const navigate = useNavigate();

    const handleAction = () => {
        if (onAction) {
            onAction();
        } else if (actionPath) {
            navigate(actionPath);
        }
    };

    return (
        <Center p="xl" style={{ minHeight: 400 }}>
            <Stack align="center" gap="md">
                <ThemeIcon
                    size={80}
                    radius="xl"
                    variant="light"
                    color="gray"
                    styles={{
                        root: {
                            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        }
                    }}
                >
                    <Icon size={40} stroke={1.5} />
                </ThemeIcon>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <Text size="lg" fw={600} mb="xs">
                        {title}
                    </Text>
                    <Text size="sm" c="dimmed" mb="md">
                        {description}
                    </Text>
                    {actionLabel && (
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAction}
                            variant="light"
                        >
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </Stack>
        </Center>
    );
}
