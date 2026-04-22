import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Group, Text, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { supabase } from '../../services/supabaseClient';
import { calculateAge } from '../../utils/ageCalculator';
import { ROLES } from '../../constants/roles';
import { usePermissions } from '../../hooks/usePermissions';

export function MembershipsManager({ userId }) {
  const permissions = usePermissions();
  const [memberships, setMemberships] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState(null);
  const [newRole, setNewRole] = useState(ROLES.SERVIDOR);
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
    const { data } = await supabase
      .from('membresias')
      .select('*, departamento:departamentos(id, nombre)')
      .eq('usuario_id', userId);
    if (data) setMemberships(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departamentos').select('*');
    if (data) {
      const filtered = data
        .filter(d => permissions.canManageDepartment(d.id))
        .map(d => ({ value: String(d.id), label: d.nombre }));
      setDepartments(filtered);
    }
  };

  const handleAdd = async () => {
    if (!newDept) return;

    if (!permissions.canManageDepartment(Number(newDept))) {
      notifications.show({ title: 'Acceso Denegado', message: 'No puedes agregar membresías en este departamento.', color: 'red' });
      return;
    }

    if ([ROLES.LIDER, 'Lider', ROLES.SUBLIDER, 'Sublider', ROLES.ENCARGADO].includes(newRole)) {
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
      setNewRole(ROLES.SERVIDOR);
    }
    setLoading(false);
  };

  const handleDelete = async (m) => {
    if (!permissions.canManageDepartment(m.departamento_id)) {
      notifications.show({ title: 'Acceso Denegado', message: 'No tienes permiso para gestionar este departamento.', color: 'red' });
      return;
    }
    const { error } = await supabase.from('membresias').delete().eq('id', m.id);
    if (!error) fetchMemberships();
    else notifications.show({ title: 'Error', message: error.message, color: 'red' });
  };

  // Leaders see only memberships in departments they manage
  const visibleMemberships = permissions.isSystemAdmin
    ? memberships
    : memberships.filter(m => permissions.canManageDepartment(m.departamento?.id ?? m.departamento_id));

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
      <Text size="sm" fw={800} c="slate.9" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Membresías y Roles
      </Text>

{visibleMemberships.length > 0 ? (
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
              {visibleMemberships.map(m => (
                <Table.Tr key={m.id}>
                  <Table.Td fw={700} c="slate.9">{m.departamento?.nombre}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gold" radius="sm" fw={800} c="gold.9">{m.rol_jerarquico}</Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => handleDelete(m)}
                      disabled={!permissions.canManageDepartment(m.departamento_id)}
                    >
                      Eliminar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Text c="dimmed" size="sm" mb="md">Sin membresías en tus departamentos.</Text>
      )}

      <Stack gap="xs">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>Agregar membresía</Text>
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
              { value: ROLES.LIDER, label: ROLES.LIDER, disabled: !permissions.isSystemAdmin && !permissions.isLider },
              { value: ROLES.SUBLIDER, label: ROLES.SUBLIDER, disabled: !permissions.isSystemAdmin && !permissions.isLider && !permissions.isSublider },
              { value: ROLES.ENCARGADO, label: ROLES.ENCARGADO },
              { value: ROLES.SERVIDOR, label: ROLES.SERVIDOR }
            ]}
            value={newRole}
            onChange={setNewRole}
            style={{ width: 120 }}
          />
          <Button onClick={handleAdd} loading={loading}>Agregar</Button>
        </Group>
      </Stack>
    </div>
  );
}
