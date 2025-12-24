import React from 'react';
import { Paper, Box, Group, Text, Badge } from '@mantine/core';

export function CalendarCard({ date, dayOfWeek, assignmentsCount, isToday, onClick, children }) {
  const baseShadow = isToday ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.08)';
  const hoverShadow = isToday ? '0 10px 28px rgba(59, 130, 246, 0.3)' : '0 4px 16px rgba(0,0,0,0.12)';

  const isDisabled = !onClick;
  return (
    <Paper
      p={0}
      withBorder
      style={{
        borderRadius: '12px',
        border: '3px solid',
        borderColor: isToday ? '#2563eb' : '#e5e7eb',
        background: isToday
          ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.25s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: baseShadow,
        overflow: 'hidden',
        position: 'relative'
      }}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={isDisabled ? undefined : (e) => {
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = isToday ? '#1d4ed8' : '#3b82f6';
      }}
      onMouseLeave={isDisabled ? undefined : (e) => {
        e.currentTarget.style.boxShadow = baseShadow;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isToday ? '#2563eb' : '#e5e7eb';
      }}
    >
      {isToday && (
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
        p="sm"
        style={{
          borderBottom: `2px solid ${isToday ? '#bfdbfe' : '#e5e7eb'}`,
          background: isToday
            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
        }}
      >
        <Group justify="space-between" align="center">
          <Text fw={700} size="md" c={isToday ? 'blue.8' : 'gray.9'} tt="capitalize">
            {dayOfWeek}
          </Text>
          <Text fw={900} size="2.8rem" c={isToday ? 'blue.8' : 'gray.9'} lh={1}>
            {date.date()}
          </Text>
        </Group>
      </Box>

      {children}
    </Paper>
  );
}
