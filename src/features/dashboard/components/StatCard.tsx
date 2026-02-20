import React from 'react';
import { Card, Box, Stack, Group, Text, ThemeIcon } from '@mantine/core';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

export function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
    return (
        <Card p="xl" radius="lg" withBorder className="animate-fade-in" style={{
            backgroundColor: 'var(--mantine-color-body)',
            borderBottom: `4px solid var(--mantine-color-${color}-6)`,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <Box style={{
                position: 'absolute',
                top: -15,
                right: -15,
                opacity: 0.03,
                transform: 'rotate(15deg)',
                color: `var(--mantine-color-${color}-9)`
            }}>
                {React.cloneElement(icon as React.ReactElement, { size: 110 })}
            </Box>

            <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                <Group justify="space-between" align="center">
                    <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.1em' }}>
                        {title}
                    </Text>
                    <ThemeIcon color={color} variant="light" size="lg" radius="md">
                        {icon}
                    </ThemeIcon>
                </Group>
                <div>
                    <Text fw={900} size="xl" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                        {value}
                    </Text>
                    {subtitle && (
                        <Text size="xs" c="dimmed" fw={700} mt={-4}>
                            {subtitle}
                        </Text>
                    )}
                </div>
            </Stack>
        </Card>
    );
}
