import React from 'react';
import { Box, Text } from '@mantine/core';

export function EncargadoSection({ encargado }) {
  if (!encargado) return null;

  return (
    <Box
      p="sm"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderBottom: '2px solid #fbbf24'
      }}
    >
      <Text size="xs" fw={700} c="amber.9">
        Encargado(a): {encargado}
      </Text>
    </Box>
  );
}
