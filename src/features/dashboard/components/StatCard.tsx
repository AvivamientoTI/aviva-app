import React from 'react';
import { Card, Box, Stack, Group, Text, ThemeIcon } from '@mantine/core';
import { Sparkline } from '@mantine/charts';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trendData?: number[];
}

export function StatCard({ title, value, subtitle, icon, color, trendData }: StatCardProps) {
    return (
        <Card p="xl" radius="lg" withBorder className="animate-fade-in hover-card" style={{
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
                
                <Group align="flex-end" justify="space-between">
                    <div>
                        <Text fw={800} size="xl" style={{ fontSize: '2.1rem', letterSpacing: '-0.01em' }}>
                            {value}
                        </Text>
                        {subtitle && (
                            <Text size="xs" c="dimmed" fw={700} mt={-4}>
                                {subtitle}
                            </Text>
                        )}
                    </div>

                    {trendData && trendData.length > 0 && (
                        <Box w={80} mb={6}>
                            <Sparkline
                                data={trendData}
                                h={32}
                                curveType="monotone"
                                color={`${color}.6`}
                                fillOpacity={0.6}
                                strokeWidth={2}
                            />
                        </Box>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}
