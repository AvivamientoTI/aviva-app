import React from 'react';
import { Badge } from '@mantine/core';

const statusColors = {
  Aprobado: 'green',
  Planificado: 'blue',
  Borrador: 'yellow',
};

export function StatusBadge({ status }) {
  const color = statusColors[status] || 'gray';
  return <Badge color={color}>{status}</Badge>;
}

