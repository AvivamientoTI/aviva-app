import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';
import dayjs from 'dayjs';

export function AbsencesManager({ userId }) {
  const [absences, setAbsences] = useState([]);
  const [dates, setDates] = useState([null, null]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAbsences();
    }
  }, [userId]);

  const fetchAbsences = async () => {
    const { data, error } = await supabase
      .from('ausencias')
      .select('*')
      .eq('usuario_id', userId)
      .order('fecha_inicio', { ascending: false });
    if (data) setAbsences(data);
  };

  const handleAdd = async () => {
    if (!dates[0] || !dates[1]) {
      notifications.show({ title: 'Error', message: 'Selecciona un rango de fechas', color: 'red' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('ausencias').insert({
      usuario_id: userId,
      fecha_inicio: dayjs(dates[0]).format('YYYY-MM-DD'),
      fecha_fin: dayjs(dates[1]).format('YYYY-MM-DD'),
      motivo: reason
    });

    if (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } else {
      fetchAbsences();
      setDates([null, null]);
      setReason('');
      notifications.show({ title: 'Éxito', message: 'Ausencia registrada', color: 'green' });
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('ausencias').delete().eq('id', id);
    if (!error) fetchAbsences();
  };

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
      <Text size="sm" fw={800} c="slate.9" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ausencias y Vacaciones</Text>

      {absences.length > 0 ? (
        <Table.ScrollContainer minWidth={400}>
          <Table highlightOnHover style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }} mb="md">
            <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Desde</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Hasta</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Motivo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {absences.map(a => (
                <Table.Tr key={a.id}>
                  <Table.Td fw={700} c="slate.9">{dayjs(a.fecha_inicio).format('DD/MM/YY')}</Table.Td>
                  <Table.Td fw={700} c="slate.9">{dayjs(a.fecha_fin).format('DD/MM/YY')}</Table.Td>
                  <Table.Td c="slate.7">{a.motivo}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button color="red" variant="light" size="xs" onClick={() => handleDelete(a.id)}>Eliminar</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text c="dimmed" size="sm" mb="md">Sin ausencias registradas.</Text>
      )}

      <Group align="flex-end">
        <DatePickerInput
          type="range"
          label="Fechas"
          placeholder="Selecciona rango"
          value={dates}
          onChange={setDates}
          style={{ flex: 1 }}
        />
        <TextInput
          label="Motivo"
          placeholder="Ej. Vacaciones"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleAdd} loading={loading}>Agregar</Button>
      </Group>
    </div>
  );
}
