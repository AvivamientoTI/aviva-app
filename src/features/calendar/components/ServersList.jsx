import React, { useMemo } from 'react';
import { Box, Text, Stack } from '@mantine/core';

function groupByRole(assignments = []) {
  return assignments.reduce((acc, asig) => {
    const rol = asig.posicion || 'Sin rol';
    if (!acc[rol]) acc[rol] = [];
    acc[rol].push(asig);
    return acc;
  }, {});
}

export function ServersList({ assignments }) {
  const grouped = useMemo(() => groupByRole(assignments), [assignments]);
  const entries = Object.entries(grouped);

  return (
    <Box p="sm" style={{ flex: 1 }}>
      {entries.map(([rol, servidores], idx) => (
        <Box key={rol} mb={idx === entries.length - 1 ? 0 : 10}>
          <Text size="11px" fw={700} c="#4b5563" tt="uppercase" mb={5} style={{ letterSpacing: '0.8px' }}>
            {rol}
          </Text>
          <Stack gap={4}>
            {servidores.map((asig, i) => (
              <Text
                key={`${rol}-${i}`}
                size="13px"
                fw={500}
                c="gray.9"
                style={{ paddingLeft: '8px', lineHeight: 1.4 }}
              >
                • {asig.nombre}
              </Text>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
