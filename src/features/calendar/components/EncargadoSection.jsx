import React from 'react';
import { Box, Text, Group, ThemeIcon } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

export function EncargadoSection({ encargado }) {
  if (!encargado) return null;

  return (
    <Box
      p="sm"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderBottom: '2px solid #fbbf24',
        borderTop: '2px solid #fbbf24',
      }}
    >
      <Group gap={8} align="center">
        <ThemeIcon size="sm" radius="xl" color="yellow" variant="light">
          <IconStar size={14} style={{ fill: '#f59e0b' }} />
        </ThemeIcon>
        <Text size="xs" fw={700} c="amber.9">
          Encargado(a):
        </Text>
        <Text size="xs" fw={600} c="amber.9">
          {encargado}
        </Text>
      </Group>
    </Box>
  );
}
