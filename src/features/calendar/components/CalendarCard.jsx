import React from 'react';
import { Paper, Box, Group, Text, Badge } from '@mantine/core';

export function CalendarCard({ date, dayOfWeek, assignmentsCount, isToday, onClick, children }) {
  const baseShadow = isToday ? '0 2px 8px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.08)';
  const hoverShadow = isToday ? '0 8px 24px rgba(59, 130, 246, 0.25)' : '0 4px 16px rgba(0,0,0,0.12)';

  return (
    <Paper
      p={0}
      withBorder
      style={{
        borderRadius: '10px',
        border: '2px solid',
        borderColor: isToday ? '#3b82f6' : '#e5e7eb',
        background: isToday
          ? 'linear-gradient(135deg, #f0f7ff 0%, #e0eeff 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: baseShadow,
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#3b82f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = baseShadow;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isToday ? '#3b82f6' : '#e5e7eb';
      }}
    >
      <Box
        p="sm"
        style={{
          borderBottom: '2px solid #e5e7eb',
          background: isToday
            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
        }}
      >
        <Group justify="space-between" align="center">
          <Text fw={700} size="xl" c={isToday ? 'blue.7' : 'gray.9'} tt="uppercase">
            {dayOfWeek} {date.date()}
          </Text>
          <Badge
            size="md"
            color="teal"
            variant="filled"
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              fontWeight: 700
            }}
          >
            {assignmentsCount}
          </Badge>
        </Group>
      </Box>

      {children}
    </Paper>
  );
}
