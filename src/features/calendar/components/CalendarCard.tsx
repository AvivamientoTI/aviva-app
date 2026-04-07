import type { ReactNode } from 'react';
import { Paper, Box, Group, Text, Stack } from '@mantine/core';
import dayjs from 'dayjs';

interface CalendarCardProps {
    date: dayjs.Dayjs;
    dayOfWeek: string;
    assignmentsCount?: number;
    isToday: boolean;
    onClick?: () => void;
    children?: ReactNode;
}

export function CalendarCard({ date, dayOfWeek, assignmentsCount, isToday, onClick, children }: CalendarCardProps) {
    // Bordes siempre negros, sin colores dinámicos
    const baseShadow = isToday ? '0 4px 12px rgba(217, 119, 6, 0.2)' : '0 1px 3px rgba(0,0,0,0.08)';
    const hoverShadow = isToday ? '0 10px 28px rgba(217, 119, 6, 0.3)' : '0 4px 16px rgba(0,0,0,0.12)';

    const isDisabled = !onClick;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
        }
    };

    const label = `Día ${date.date()} de ${date.format('MMMM')}, ${dayOfWeek}. ${assignmentsCount ? `${assignmentsCount} asignaciones.` : 'Sin asignaciones.'}`;

    return (
        <Paper
            p={0}
            withBorder
            role={isDisabled ? undefined : 'button'}
            tabIndex={isDisabled ? undefined : 0}
            aria-label={label}
            aria-disabled={isDisabled}
            onKeyDown={handleKeyDown}
            style={{
                borderRadius: '16px',
                border: `1.5px solid ${isToday ? '#d97706' : '#e2e8f0'}`,
                background: '#fff',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: baseShadow,
                overflow: 'hidden',
                position: 'relative'
            }}
            onClick={isDisabled ? undefined : onClick}
            onMouseEnter={isDisabled ? undefined : (e) => {
                e.currentTarget.style.boxShadow = hoverShadow;
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = isToday ? '#b45309' : '#cbd5e1';
            }}
            onMouseLeave={isDisabled ? undefined : (e) => {
                e.currentTarget.style.boxShadow = baseShadow;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isToday ? '#d97706' : '#e2e8f0';
            }}
        >
            {isToday && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
                        zIndex: 2
                    }}
                />
            )}
            
            <Box
                p="sm"
                style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: isToday ? 'linear-gradient(135deg, #fffcf0 0%, #fff 100%)' : '#fff'
                }}
            >
                <Group justify="space-between" align="center">
                    <Stack gap={0}>
                        <Text fw={800} size="sm" c="slate.7" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                            {dayOfWeek}
                        </Text>
                        {isToday && <Text size="xs" fw={900} c="orange.7">Hoy</Text>}
                    </Stack>
                    <Text fw={900} size="2.4rem" c="slate.9" lh={1} style={{ letterSpacing: '-0.04em' }}>
                        {date.date()}
                    </Text>
                </Group>
            </Box>

            {children}
        </Paper>
    );
}
