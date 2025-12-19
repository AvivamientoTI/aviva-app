import React from 'react';
import { Badge } from '@mantine/core';

export function StatusBadge({ status }) {
  let color = 'gray';
  switch (status) {
    case 'Aprobado':
      color = 'green';
      break;
    case 'Planificado':
      color = 'blue';
      break;
    case 'Borrador':
      color = 'yellow';
      break;
    default:
      color = 'gray';
  }

  return <Badge color={color}>{status}</Badge>;
}
