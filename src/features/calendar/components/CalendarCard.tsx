import type { ReactNode } from 'react';
import { Paper, Box, Group, Text, Badge } from '@mantine/core';
import dayjs from 'dayjs';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';

interface CalendarCardProps {
    date: dayjs.Dayjs;
    dayOfWeek: string;
    uniforme?: string;
    assignmentsCount?: number;
    isToday: boolean;
    onClick?: () => void;
    children?: ReactNode;
}

export function CalendarCard({ date, dayOfWeek, uniforme, assignmentsCount, isToday, onClick, children }: CalendarCardProps) {
    // Bordes siempre negros, sin colores dinámicos
    const baseShadow = isToday ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.08)';
    const hoverShadow = isToday ? '0 10px 28px rgba(59, 130, 246, 0.3)' : '0 4px 16px rgba(0,0,0,0.12)';

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
                border: `1.5px solid ${isToday ? '#2563eb' : '#e2e8f0'}`,
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
                e.currentTarget.style.borderColor = isToday ? '#1d4ed8' : '#cbd5e1';
            }}
            onMouseLeave={isDisabled ? undefined : (e) => {
                e.currentTarget.style.boxShadow = baseShadow;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isToday ? '#2563eb' : '#e2e8f0';
            }}
        >
            {uniforme && (() => {
                const uniformeColor = getUniformeColor(uniforme);
                const isHexColor = /^#([0-9A-Fa-f]{3}){1,2}$/.test(uniformeColor);

                return isHexColor ? (
                    <Badge
                        variant="filled"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 1,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            backgroundColor: uniformeColor,
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        {uniforme}
                    </Badge>
                ) : (
                    <Badge
                        color={uniformeColor}
                        variant="filled"
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 1,
                            boxShadow: `0 4px 12px var(--mantine-color-${uniformeColor}-2)`,
                            border: '1.5px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        {uniforme}
                    </Badge>
                );
            })()}
            {isToday && !uniforme && (
                <Badge
                    color="blue"
                    variant="filled"
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    Hoy
                </Badge>
            )}
            <Box
                p="md"
                style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: isToday ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : '#fff'
                }}
            >
                <Group justify="space-between" align="center">
                    <Text fw={700} size="md" c="#000" tt="capitalize">
                        {dayOfWeek}
                    </Text>
                    <Text fw={900} size="2.8rem" c="#000" lh={1}>
                        {date.date()}
                    </Text>
                </Group>
            </Box>

            {children}
        </Paper>
    );
}
