import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Group, ActionIcon, Text, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';
import { calculateAge } from '../../utils/ageCalculator';

export function MembershipsManager({ userId }) {
  const [memberships, setMemberships] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState(null);
  const [newRole, setNewRole] = useState('Servidor');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const MIN_LEADER_AGE = 18;

  useEffect(() => {
    if (userId) {
      fetchMemberships();
      fetchDepartments();
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('fecha_nacimiento, nombre, apellido')
      .eq('id', userId)
      .maybeSingle();
    if (data) setUserInfo(data);
  };

  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .from('membresias')
      .select('*, departamento:departamentos(nombre)')
      .eq('usuario_id', userId);
    if (data) setMemberships(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departamentos').select('*');
    if (data) setDepartments(data.map(d => ({ value: String(d.id), label: d.nombre })));
  };

  const handleAdd = async () => {
    if (!newDept) return;

    if (['Lider', 'Sublider', 'Encargado'].includes(newRole)) {
      if (!userInfo?.fecha_nacimiento) {
        notifications.show({ title: 'Error', message: 'No hay fecha de nacimiento para validar la edad.', color: 'red' });
        return;
      }
      const age = calculateAge(userInfo.fecha_nacimiento);
      if (age < MIN_LEADER_AGE) {
        notifications.show({ title: 'No permitido', message: `Se requiere al menos ${MIN_LEADER_AGE} años para asignar el rol ${newRole}.`, color: 'yellow' });
        return;
      }
    }

    setLoading(true);
    // Ahora usamos insert simple porque permitimos múltiples roles distintos por departamento
    const { error } = await supabase.from('membresias').insert({
      usuario_id: userId,
      departamento_id: newDept,
      rol_jerarquico: newRole
    });

    if (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } else {
      fetchMemberships();
      setNewDept(null);
      setNewRole('Servidor');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('membresias').delete().eq('id', id);
    if (!error) fetchMemberships();
  };

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
      <Text size="sm" fw={800} c="slate.9" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membresías y Roles</Text>

      {memberships.length > 0 ? (
        <Table.ScrollContainer minWidth={400}>
          <Table highlightOnHover style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }} mb="md">
            <Table.Thead style={{ backgroundColor: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Departamento</Table.Th>
                <Table.Th style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Rol</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {memberships.map(m => (
                <Table.Tr key={m.id}>
                  <Table.Td fw={700} c="slate.9">{m.departamento?.nombre}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gold" radius="sm" fw={800} c="gold.9">{m.rol_jerarquico}</Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button color="red" variant="light" size="xs" onClick={() => handleDelete(m.id)}>Eliminar</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text c="dimmed" size="sm" mb="md">Sin membresías asignadas.</Text>
      )}

      <Group align="flex-end">
        <Select
          label="Departamento"
          placeholder="Seleccionar"
          data={departments}
          value={newDept}
          onChange={setNewDept}
          style={{ flex: 1 }}
        />
        <Select
          label="Rol"
          data={[
            { value: 'Lider', label: 'Líder' },
            { value: 'Sublider', label: 'Sublíder' },
            { value: 'Encargado', label: 'Encargado(a)' },
            { value: 'Servidor', label: 'Servidor(a)' }
          ]}
          value={newRole}
          onChange={setNewRole}
          style={{ width: 120 }}
        />
        <Button onClick={handleAdd} loading={loading}>Agregar</Button>
      </Group>
    </div>
  );
}
