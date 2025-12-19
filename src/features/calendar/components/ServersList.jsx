import React, { useMemo } from 'react';
import { Box, Text, Stack, Group, Avatar } from '@mantine/core';

function groupByRole(assignments = []) {
  return assignments.reduce((acc, asig) => {
    const rol = asig.posicion || 'Sin rol';
    if (!acc[rol]) acc[rol] = [];
    acc[rol].push(asig);
    return acc;
  }, {});
}

// Función para obtener color del avatar basado en el nombre
function getAvatarColor(name) {
  const colors = ['blue', 'grape', 'pink', 'orange', 'teal', 'cyan', 'indigo'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function ServersList({ assignments }) {
  const grouped = useMemo(() => groupByRole(assignments), [assignments]);
  const entries = Object.entries(grouped);

  return (
    <Box p="sm" style={{ flex: 1 }}>
      {entries.map(([rol, servidores], idx) => (
        <Box key={rol} mb={idx === entries.length - 1 ? 0 : 12}>
          <Text size="11px" fw={700} c="#4b5563" tt="uppercase" mb={6} style={{ letterSpacing: '0.8px' }}>
            {rol}
          </Text>
          <Stack gap={6}>
            {servidores.map((asig, i) => (
              <Group
                key={`${rol}-${i}`}
                gap={8}
                style={{
                  padding: '4px 0',
                }}
              >
                <Avatar
                  size="sm"
                  radius="xl"
                  color={getAvatarColor(asig.nombre)}
                  styles={{
                    placeholder: {
                      fontSize: '11px',
                      fontWeight: 600,
                    }
                  }}
                >
                  {asig.nombre.charAt(0).toUpperCase()}
                </Avatar>
                <Text
                  size="13px"
                  fw={500}
                  c="gray.9"
                  style={{ lineHeight: 1.4 }}
                >
                  {asig.nombre}
                </Text>
              </Group>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
