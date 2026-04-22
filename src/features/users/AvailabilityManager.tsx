import { useState, useEffect } from 'react';
import { Table, Button, Group, Text, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

const TURNOS = [
  { value: 'Mañana', label: 'Mañana' },
  { value: 'Tarde', label: 'Tarde' },
  { value: 'Noche', label: 'Noche' },
];

export function AvailabilityManager({ userId }: { userId: number }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [turno, setTurno] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSchedules();
    }
  }, [userId]);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('horarios_no_disponibilidad')
      .select('*')
      .eq('usuario_id', userId)
      .order('dia_semana', { ascending: true });
    if (data) setSchedules(data);
  };

  const handleAdd = async () => {
    if (!day || !turno) {
      notifications.show({ title: 'Error', message: 'Selecciona un día y un turno', color: 'red' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('horarios_no_disponibilidad').insert({
      usuario_id: userId,
      dia_semana: parseInt(day),
      turno: turno
    });

    if (error) {
      notifications.show({ title: 'Error', message: 'No se pudo agregar o el horario ya existe', color: 'red' });
    } else {
      fetchSchedules();
      setDay(null);
      setTurno(null);
      notifications.show({ title: 'Éxito', message: 'Bloqueo de disponibilidad registrado', color: 'green' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('horarios_no_disponibilidad').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  const getDayName = (d: number) => DAYS_OF_WEEK.find(x => x.value === String(d))?.label;

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
      <Text size="sm" fw={800} c="slate.9" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Horarios No Disponibles
      </Text>

      {schedules.length > 0 ? (
        <Table.ScrollContainer minWidth={400}>
          <Table highlightOnHover style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }} mb="md">
            <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Día</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Turno</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {schedules.map(s => (
                <Table.Tr key={s.id}>
                  <Table.Td fw={700} c="slate.9">{getDayName(s.dia_semana)}</Table.Td>
                  <Table.Td c="slate.7">{s.turno}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button color="red" variant="light" size="xs" onClick={() => handleDelete(s.id)}>Eliminar</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text c="dimmed" size="sm" mb="md">El usuario está disponible siempre.</Text>
      )}

      <Group align="flex-end">
        <Select
          label="Día de la semana"
          placeholder="Selecciona"
          data={DAYS_OF_WEEK}
          value={day}
          onChange={setDay}
          style={{ flex: 1 }}
        />
        <Select
          label="Turno"
          placeholder="Selecciona"
          data={TURNOS}
          value={turno}
          onChange={setTurno}
          style={{ flex: 1 }}
        />
        <Button onClick={handleAdd} loading={loading}>Bloquear</Button>
      </Group>
    </div>
  );
}
