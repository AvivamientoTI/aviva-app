import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, TextInput, Select, Group, Title, Badge, ActionIcon, Alert, Paper, Avatar, Text, Menu, SimpleGrid, Card, ThemeIcon, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { supabase } from '../../services/supabaseClient';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconUserPlus, IconEdit, IconTrash, IconDotsVertical, IconUsers, IconUser, IconFilter } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { MembershipsManager } from './MembershipsManager';
import { AbsencesManager } from './AbsencesManager';
import { calculateAge } from '../../utils/ageCalculator';
import { usePermissions } from '../../hooks/usePermissions';

export function UsersList() {
  const permissions = usePermissions();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterDept, setFilterDept] = useState(null);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState(null);
  const [initialPassword, setInitialPassword] = useState('');
  const [hasAuth, setHasAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    username: '',
    email_personal: '',
    genero: 'M',
    telefono: '',
    fecha_nacimiento: null
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, membresias(rol_jerarquico, departamento:departamentos(id, nombre))')
      .order('nombre');
    if (data) setUsers(data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      fecha_nacimiento: formData.fecha_nacimiento ? dayjs(formData.fecha_nacimiento).format('YYYY-MM-DD') : null
    };

    let error;
    if (editingUser) {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', editingUser.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert(payload);
      error = insertError;
    }

    if (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } else {
      notifications.show({ title: 'Éxito', message: 'Usuario guardado', color: 'green' });
      close();
      fetchUsers();
      resetForm();
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      username: user.username || '',
      email_personal: user.email_personal || '',
      genero: user.genero,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento ? new Date(user.fecha_nacimiento) : null
    });
    checkAuthStatus(user.id);
    open();
  };

  const checkAuthStatus = async (usuarioId) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();
    setHasAuth(!!data);
  };

  const handleCreateAuth = async () => {
    if (!initialPassword || initialPassword.length < 6) {
      notifications.show({ title: 'Error', message: 'La contraseña debe tener al menos 6 caracteres', color: 'red' });
      return;
    }

    setAuthLoading(true);
    const { data, error } = await supabase.functions.invoke('create-user-auth', {
      body: { 
        usuario_id: editingUser.id, 
        username: formData.username, 
        password: initialPassword 
      }
    });

    if (error || data?.error) {
      notifications.show({ 
        title: 'Error al crear acceso', 
        message: error?.message || data?.error, 
        color: 'red' 
      });
    } else {
      notifications.show({ 
        title: 'Éxito', 
        message: 'Cuenta de acceso creada correctamente', 
        color: 'green' 
      });
      setHasAuth(true);
      setInitialPassword('');
    }
    setAuthLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        notifications.show({ title: 'Error', message: error.message, color: 'red' });
      } else {
        fetchUsers();
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      nombre: '',
      apellido: '',
      username: '',
      email_personal: '',
      genero: 'M',
      telefono: '',
      fecha_nacimiento: null
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. Check department match (respecting permissions)
      let matchesDept = false;
      if (filterDept) {
        matchesDept = u.membresias?.some(m => String(m.departamento?.id) === filterDept);
      } else {
        // If no filter selected, show only what user CAN manage
        // If user has NO memberships that match their permissions, they see nothing (correct)
        matchesDept = u.membresias?.some(m => permissions.canManageDepartment(m.departamento?.id));
      }

      const matchesSearch = search.toLowerCase().trim() === '' ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [users, filterDept, search, permissions]);

  const stats = [
    { label: 'Total Servidores(as)', value: filteredUsers.length, icon: IconUsers, color: 'gold' },
    { label: 'Hombres', value: filteredUsers.filter(u => u.genero === 'M').length, icon: IconUser, color: 'teal' },
    { label: 'Mujeres', value: filteredUsers.filter(u => u.genero === 'F').length, icon: IconUser, color: 'pink' },
  ];

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Gestión de Servidores(as)</Title>
          <Text c="dimmed" size="sm">Administra el directorio de voluntarios</Text>
        </div>
        <Button
          leftSection={<IconUserPlus size={18} />}
          onClick={() => { resetForm(); open(); }}
          disabled={!permissions.canManageUsers}
        >
          Nuevo(a) Servidor(a)
        </Button>
      </Group>

      {!permissions.canManageUsers && (
        <Alert color="yellow" title="Acceso de Lectura" mb="md" icon={<IconFilter size={16} />}>
          Tienes permisos limitados. Solo puedes ver el directorio.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {stat.label}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
              <ThemeIcon color={stat.color} variant="light" size="lg" radius="md">
                <stat.icon size={22} stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder mb="md">
        <Group>
          <TextInput
            placeholder="Buscar por nombre..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Todos los departamentos"
            data={departments}
            value={filterDept}
            onChange={setFilterDept}
            clearable
            leftSection={<IconFilter size={16} />}
            style={{ width: 250 }}
          />
        </Group>
      </Paper>

      <Paper shadow="sm" radius="md" withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Servidor(a)</Table.Th>
                <Table.Th>Edad</Table.Th>
                <Table.Th>Contacto</Table.Th>
                <Table.Th>Membresías</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="gold" radius="xl">
                          {user.nombre[0]}{user.apellido[0]}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>{user.nombre} {user.apellido}</Text>
                          <Badge
                            size="xs"
                            variant="dot"
                            color={user.genero === 'M' ? 'teal' : 'pink'}
                          >
                            {user.genero === 'M' ? 'Masculino' : 'Femenino'}
                          </Badge>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{calculateAge(user.fecha_nacimiento) || '-'} años</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{user.telefono || 'Sin teléfono'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={5}>
                        {user.membresias?.length > 0 ? (
                          user.membresias.map((m, i) => (
                            <Badge key={i} size="sm" variant="outline" color="gray">
                              {m.departamento?.nombre}
                            </Badge>
                          ))
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic">Sin asignación</Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Opciones</Menu.Label>
                          <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(user)} disabled={!permissions.canManageUsers}>
                            Editar Perfil
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(user.id)}
                            disabled={!permissions.canManageUsers}
                          >
                            Eliminar
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="xl">
                      No se encontraron resultados para la búsqueda.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal opened={opened} onClose={close} title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Nombre"
            placeholder="Ej. Juan"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
          <TextInput
            label="Apellido"
            placeholder="Ej. Pérez"
            required
            mt="sm"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
          />
          <Select
            label="Género"
            placeholder="Selecciona el género"
            data={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]}
            required
            mt="sm"
            value={formData.genero}
            onChange={(val) => setFormData({ ...formData, genero: val })}
          />
          <TextInput
            label="Nombre de Usuario (Login)"
            placeholder="ej. juan.perez"
            required
            mt="sm"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
          />
          <TextInput
            label="Email Personal (Notificaciones)"
            placeholder="ej. juan@gmail.com"
            required
            mt="sm"
            value={formData.email_personal}
            onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
          />
          <TextInput
            label="Teléfono"
            placeholder="Ej. 0981 123 456"
            mt="sm"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
          <DatePickerInput
            label="Fecha de Nacimiento"
            placeholder="Selecciona una fecha"
            required
            mt="sm"
            value={formData.fecha_nacimiento}
            onChange={(val) => setFormData({ ...formData, fecha_nacimiento: val })}
            locale="es"
          />
          <Button type="submit" fullWidth mt="xl">Guardar</Button>
        </form>

        {editingUser && (
          <>
            <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
              <Text size="sm" fw={800} c="slate.9" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credenciales de Acceso</Text>
              
              {hasAuth ? (
                <Alert color="green" icon={<IconUser size={16} />}>
                  Este usuario ya tiene una cuenta de acceso activa.
                </Alert>
              ) : (
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Genera una cuenta para que el servidor pueda iniciar sesión con su nombre de usuario.</Text>
                  <Group align="flex-end">
                    <TextInput
                      label="Contraseña Inicial"
                      placeholder="Ej. Aviva2026*"
                      password
                      style={{ flex: 1 }}
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                    />
                    <Button 
                      variant="filled" 
                      color="blue" 
                      onClick={handleCreateAuth} 
                      loading={authLoading}
                      disabled={!formData.username}
                    >
                      Activar Acceso
                    </Button>
                  </Group>
                </Stack>
              )}
            </div>

            <MembershipsManager userId={editingUser.id} />
            <AbsencesManager userId={editingUser.id} />
          </>
        )}
      </Modal>
    </div>
  );
}
