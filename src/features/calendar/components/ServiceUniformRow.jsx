import React from 'react';
import { Box, Stack, Group, Badge, Text } from '@mantine/core';
import { getUniformeColor } from '../../../utils/calendar/colorMapper';

export function ServiceUniformRow({ servicio, uniforme }) {
  return (
    <Box
      p="sm"
      style={{
        background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
        borderBottom: '2px solid #fde047'
      }}
    >
      <Stack gap={6}>
        <Group gap={8} wrap="nowrap">
          <Badge
            size="sm"
            color="orange"
            variant="filled"
            style={{
              fontSize: '11px',
              flex: 1,
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
              fontWeight: 600
            }}
          >
            {servicio || 'N/A'}
          </Badge>
          <Badge
            size="sm"
            color={getUniformeColor(uniforme)}
            variant="filled"
            style={{
              fontSize: '11px',
              flex: 1,
              fontWeight: 600
            }}
          >
            Uniforme: {uniforme || 'N/A'}
          </Badge>
        </Group>
      </Stack>
    </Box>
  );
}
