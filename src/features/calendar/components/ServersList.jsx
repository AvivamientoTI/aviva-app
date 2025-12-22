import React, { useMemo, useState } from 'react';
import { Box, Text, Stack, Group, ThemeIcon, Badge, Button, Collapse } from '@mantine/core';
import { IconStar, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

function groupByRole(assignments = []) {
  return assignments.reduce((acc, asig) => {
    const rol = asig.posicion || 'Sin rol';
    if (!acc[rol]) acc[rol] = [];
    acc[rol].push(asig);
    return acc;
  }, {});
}

function RoleSection({ rol, servidores }) {
  const [opened, { toggle }] = useDisclosure(false);
  const isEncargado = rol.toLowerCase() === 'encargado';
  const visibleServers = opened ? servidores : servidores.slice(0, 3);

  return (
    <Box mb={12}>
      <Group mb={6} position="center" spacing={6} style={{
        width: '100%',
        background: isEncargado ? 'linear-gradient(90deg, #fef08a 0%, #fde047 100%)' : '#e0e7ff',
        color: isEncargado ? '#b45309' : '#3730a3',
        fontWeight: 800,
        fontSize: '13px',
        borderRadius: '6px',
        padding: '4px 0',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        boxShadow: isEncargado ? '0 1px 8px rgba(251, 191, 36, 0.15)' : '0 1px 4px rgba(59, 130, 246, 0.07)',
        textAlign: 'center',
        border: isEncargado ? '2px solid #f59e0b' : 'none',
        position: 'relative',
      }}>
        {isEncargado && (
          <ThemeIcon size="sm" radius="xl" color="yellow" variant="filled">
            <IconStar size={16} style={{ fill: '#f59e0b' }} />
          </ThemeIcon>
        )}
        <Text style={{ fontWeight: 900 }}>{rol}</Text>
        {isEncargado && (
          <Badge color="yellow" variant="filled" size="sm" style={{ fontWeight: 700, marginLeft: 4 }}>
            Encargado(a)
          </Badge>
        )}
      </Group>
      <Stack gap={6}>
        {visibleServers.map((asig, i) => (
          <Box
            key={`${rol}-${i}`}
            style={{
              padding: '4px 0',
              marginLeft: 4
            }}
          >
            <Text
              size="13px"
              fw={isEncargado ? 900 : 600}
              c={isEncargado ? '#b45309' : '#1e293b'}
              style={{ lineHeight: 1.4 }}
            >
              {asig.nombre}
            </Text>
          </Box>
        ))}
      </Stack>
      {servidores.length > 3 && (
        <Button
          mt={6}
          fullWidth
          variant="light"
          color="blue"
          size="xs"
          onClick={toggle}
          rightSection={opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        >
          {opened ? 'Ver menos' : `Ver ${servidores.length - 3} más`}
        </Button>
      )}
    </Box>
  );
}

export function ServersList({ assignments }) {
  const grouped = useMemo(() => groupByRole(assignments), [assignments]);
  const entries = Object.entries(grouped).sort(([a], [b]) => {
    if (a.toLowerCase() === 'encargado') return -1;
    if (b.toLowerCase() === 'encargado') return 1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });

  return (
    <Box p="sm" style={{ flex: 1 }}>
      {entries.map(([rol, servidores]) => (
        <RoleSection key={rol} rol={rol} servidores={servidores} />
      ))}
    </Box>
  );
}
