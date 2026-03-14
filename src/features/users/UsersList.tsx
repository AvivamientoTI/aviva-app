import React, { useState, useEffect, useMemo } from 'react';
import { 
    Table, Button, Modal, TextInput, Select, Group, Title, Badge, 
    ActionIcon, Alert, Paper, Avatar, Text, Menu, SimpleGrid, 
    ThemeIcon, Stack, Container, Box, Center, NumberInput 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { supabase } from '../../services/supabaseClient';
import { notifications } from '@mantine/notifications';
import { 
    IconSearch, IconUserPlus, IconEdit, IconTrash, 
    IconDotsVertical, IconUsers, IconUser, IconFilter,
    IconPhone, IconMail, IconCake
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { MembershipsManager } from './MembershipsManager';
import { AbsencesManager } from './AbsencesManager';
import { calculateAge } from '../../utils/ageCalculator';
import { usePermissions } from '../../hooks/usePermissions';
import { useUsers } from '../../hooks/queries/useUsers';
import { useDepartments } from '../../hooks/queries/useDepartments';
import { useQueryClient } from '@tanstack/react-query';

export default function UsersList() {
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  
  // Queries
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: deptsData } = useDepartments();
  const departmentsOptions = deptsData?.options || [];

  // Filter state
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [filterAgeMin, setFilterAgeMin] = useState<number | string | null>(null);
  const [filterAgeMax, setFilterAgeMax] = useState<number | string | null>(null);
  const [search, setSearch] = useState('');

  const [opened, { open, close }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<any>(null);
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
    fecha_nacimiento: null as Date | null
  });

  // Manual fetches removed in favor of useQuery

  const handleSubmit = async (e: React.FormEvent) => {
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    }
  };

  const handleEdit = (user: any) => {
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

  const checkAuthStatus = async (usuarioId: number) => {
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
    const { data, error } = await (supabase.functions as any).invoke('create-user-auth', {
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

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        notifications.show({ title: 'Error', message: error.message, color: 'red' });
      } else {
        queryClient.invalidateQueries({ queryKey: ['users'] });
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
    const users = usersData || [];
    return users.filter(u => {
      // Dept Filter
      let matchesDept = false;
      if (filterDept) {
        matchesDept = u.membresias?.some((m: any) => String(m.departamento?.id) === filterDept);
      } else {
        matchesDept = u.membresias?.some((m: any) => permissions.canManageDepartment(m.departamento?.id));
      }

      // Gender Filter
      const matchesGender = !filterGender || u.genero === filterGender;

      // Age Filter
      const age = calculateAge(u.fecha_nacimiento);
      const matchesAgeMin = filterAgeMin === null || filterAgeMin === '' || (age !== null && age >= Number(filterAgeMin));
      const matchesAgeMax = filterAgeMax === null || filterAgeMax === '' || (age !== null && age <= Number(filterAgeMax));

      // Search Query
      const matchesSearch = search.toLowerCase().trim() === '' ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase());

      return matchesDept && matchesGender && matchesAgeMin && matchesAgeMax && matchesSearch;
    });
  }, [usersData, filterDept, filterGender, filterAgeMin, filterAgeMax, search, permissions]);

  const stats = [
    { label: 'Total Servidores(as)', value: filteredUsers.length, icon: IconUsers, color: 'gold' },
    { label: 'Hombres', value: filteredUsers.filter(u => u.genero === 'M').length, icon: IconUser, color: 'teal' },
    { label: 'Mujeres', value: filteredUsers.filter(u => u.genero === 'F').length, icon: IconUser, color: 'pink' },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="lg">
            <Stack gap={0}>
                <Title order={1} style={{ 
                    fontFamily: 'Inter, sans-serif', 
                    fontSize: '2.4rem',
                    color: 'var(--mantine-color-text)', 
                    letterSpacing: '-0.02em' 
                }}>
                    Directorio de Servidores 👥
                </Title>
                <Text c="dimmed" size="md" fw={500}>Gestión y administración de voluntarios por departamento</Text>
            </Stack>

            <Paper p="md" radius="lg" withBorder className="shell-glass" style={{
                backgroundColor: 'var(--mantine-glass-bg, rgba(255, 255, 255, 0.7))',
                backdropFilter: 'blur(10px)',
            }}>
                <Button
                    leftSection={<IconUserPlus size={18} />}
                    onClick={() => { resetForm(); open(); }}
                    disabled={!permissions.canManageUsers}
                    radius="md"
                    size="md"
                    className="btn-premium"
                >
                    Nuevo(a) Servidor(a)
                </Button>
            </Paper>
        </Group>

        {!permissions.canManageUsers && (
            <Alert color="yellow" radius="md" title="Acceso de Lectura" icon={<IconFilter size={16} />}>
                Tienes permisos limitados. Solo puedes visualizar el directorio.
            </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {stats.map((stat) => (
            <Paper key={stat.label} p="lg" radius="xl" withBorder className="glass-card">
                <Group justify="space-between">
                <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                    {stat.label}
                    </Text>
                    <Text fw={900} size="2.2rem" style={{ letterSpacing: '-0.02em' }}>
                    {stat.value}
                    </Text>
                </Stack>
                <ThemeIcon color={stat.color} variant="light" size="xl" radius="lg">
                    <stat.icon size={26} stroke={1.5} />
                </ThemeIcon>
                </Group>
            </Paper>
            ))}
        </SimpleGrid>

        <Paper p="md" radius="xl" withBorder className="shell-glass" style={{
            backgroundColor: 'var(--mantine-glass-bg, rgba(255, 255, 255, 0.5))',
            backdropFilter: 'blur(10px)',
        }}>
            <Stack gap="md">
                <Group grow gap="md" align="flex-end">
                    <TextInput
                        placeholder="Buscar por nombre o apellido..."
                        leftSection={<IconSearch size={18} color="var(--mantine-color-gold-6)" />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        radius="md"
                        size="md"
                        styles={{ input: { border: 'none', backgroundColor: 'transparent' } }}
                    />
                    <Select
                        placeholder="Departamento"
                        data={departmentsOptions}
                        value={filterDept}
                        onChange={setFilterDept}
                        clearable
                        radius="md"
                        size="md"
                        leftSection={<IconFilter size={18} color="var(--mantine-color-gold-6)" />}
                        styles={{ input: { border: 'none', backgroundColor: 'transparent' } }}
                    />
                    <Select
                        placeholder="Género"
                        data={[
                            { value: 'M', label: 'Masculino' },
                            { value: 'F', label: 'Femenino' }
                        ]}
                        value={filterGender}
                        onChange={setFilterGender}
                        clearable
                        radius="md"
                        size="md"
                        leftSection={<IconUser size={18} color="var(--mantine-color-gold-6)" />}
                        styles={{ input: { border: 'none', backgroundColor: 'transparent' } }}
                    />
                </Group>
                
                <Group gap="md">
                    <Text size="sm" fw={700} c="dimmed" style={{ minWidth: '80px' }}>Rango de Edad:</Text>
                    <Group gap="xs">
                        <NumberInput
                            placeholder="Mín"
                            min={0}
                            max={120}
                            value={filterAgeMin as any}
                            onChange={setFilterAgeMin}
                            radius="md"
                            size="sm"
                            style={{ width: '100px' }}
                        />
                        <Text size="sm" fw={700} c="dimmed">-</Text>
                        <NumberInput
                            placeholder="Máx"
                            min={0}
                            max={120}
                            value={filterAgeMax as any}
                            onChange={setFilterAgeMax}
                            radius="md"
                            size="sm"
                            style={{ width: '100px' }}
                        />
                    </Group>
                    
                    {(search || filterDept || filterGender || filterAgeMin || filterAgeMax) && (
                        <Button 
                            variant="subtle" 
                            color="gray" 
                            size="xs" 
                            onClick={() => {
                                setSearch('');
                                setFilterDept(null);
                                setFilterGender(null);
                                setFilterAgeMin(null);
                                setFilterAgeMax(null);
                            }}
                        >
                            Limpiar Filtros
                        </Button>
                    )}
                </Group>
            </Stack>
        </Paper>

        <Paper shadow="md" radius="xl" withBorder className="glass-card" style={{
            backgroundColor: 'var(--mantine-color-body)',
            overflow: 'hidden'
        }}>
            <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead style={{ backgroundColor: 'var(--mantine-color-dark-filled)' }}>
                <Table.Tr>
                    <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '24px' }}>Servidor(a)</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Info Personal</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contacto</Table.Th>
                    <Table.Th style={{ color: 'var(--mantine-color-dimmed)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right', paddingRight: '24px' }}>Acciones</Table.Th>
                </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <Table.Tr key={user.id}>
                        <Table.Td style={{ paddingLeft: '24px' }}>
                        <Group gap="sm">
                            <Avatar color="gold" radius="lg" size="lg" style={{ border: '2px solid var(--mantine-color-gold-2)' }}>
                                {user.nombre[0]}{user.apellido[0]}
                            </Avatar>
                            <Stack gap={0}>
                                <Text size="md" fw={800} style={{ color: 'var(--mantine-color-text)' }}>{user.nombre} {user.apellido}</Text>
                                <Badge
                                    size="xs"
                                    variant="dot"
                                    color={user.genero === 'M' ? 'teal' : 'pink'}
                                    fw={700}
                                >
                                    {user.genero === 'M' ? 'MASCULINO' : 'FEMENINO'}
                                </Badge>
                            </Stack>
                        </Group>
                        </Table.Td>
                        <Table.Td>
                            <Stack gap={4}>
                                <Group gap={6} align="center">
                                    <IconCake size={14} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm" fw={600}>{calculateAge(user.fecha_nacimiento) || '-'} años</Text>
                                </Group>
                            </Stack>
                        </Table.Td>
                        <Table.Td>
                            <Stack gap={4}>
                                <Group gap={6} align="center">
                                    <IconPhone size={14} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm" fw={600}>{user.telefono || 'Sin teléfono'}</Text>
                                </Group>
                                <Group gap={6} align="center">
                                    <IconMail size={14} color="var(--mantine-color-dimmed)" />
                                    <Text size="xs" c="dimmed" fw={500}>{user.email_personal || 'Sin email'}</Text>
                                </Group>
                            </Stack>
                        </Table.Td>
                        <Table.Td style={{ paddingRight: '24px' }}>
                            <Group justify="flex-end" gap="xs">
                                <Button variant="light" size="xs" radius="md" leftSection={<IconEdit size={14} />} onClick={() => handleEdit(user)} disabled={!permissions.canManageUsers}>
                                    Perfil
                                </Button>
                                <Menu position="bottom-end" shadow="md">
                                    <Menu.Target>
                                    <ActionIcon variant="subtle" color="gray" radius="md" size="lg">
                                        <IconDotsVertical size={18} />
                                    </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                    <Menu.Label>Administración</Menu.Label>
                                    <Menu.Item
                                        leftSection={<IconTrash size={14} />}
                                        color="red"
                                        onClick={() => handleDelete(user.id)}
                                        disabled={!permissions.canManageUsers}
                                    >
                                        Eliminar Servidor
                                    </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                    ))
                ) : (
                    <Table.Tr>
                    <Table.Td colSpan={4}>
                        <Center py="xl">
                            <Stack align="center" gap="xs" opacity={0.6}>
                                <IconUsers size={48} />
                                <Text ta="center" fw={600}>
                                    {usersLoading ? "Cargando servidores..." : "No se encontraron servidores en esta búsqueda."}
                                </Text>
                            </Stack>
                        </Center>
                    </Table.Td>
                    </Table.Tr>
                )}
                </Table.Tbody>
            </Table>
            </Table.ScrollContainer>
        </Paper>

        <Modal opened={opened} onClose={close} title={editingUser ? "Ficha de Servidor(a)" : "Alta de Nuevo(a) Servidor(a)"} size="lg" radius="xl">
            <Paper p={0}>
                <form onSubmit={handleSubmit}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <TextInput
                            label="Nombre"
                            placeholder="Ej. Juan"
                            required
                            radius="md"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                        <TextInput
                            label="Apellido"
                            placeholder="Ej. Pérez"
                            required
                            radius="md"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        />
                        <Select
                            label="Género"
                            placeholder="Selecciona"
                            data={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]}
                            required
                            radius="md"
                            value={formData.genero}
                            onChange={(val) => setFormData({ ...formData, genero: val as string })}
                        />
                        <TextInput
                            label="Nombre de Usuario (Login)"
                            placeholder="ej. juan.perez"
                            required
                            radius="md"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                        />
                        <TextInput
                            label="Email Personal"
                            placeholder="ej. juan@gmail.com"
                            required
                            radius="md"
                            value={formData.email_personal}
                            onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                        />
                        <TextInput
                            label="Teléfono"
                            placeholder="Ej. 0981 123 456"
                            radius="md"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                        <DatePickerInput
                            label="Fecha de Nacimiento"
                            placeholder="Selecciona una fecha"
                            required
                            radius="md"
                            value={formData.fecha_nacimiento}
                            onChange={(val) => setFormData({ ...formData, fecha_nacimiento: val as Date | null })}
                            locale="es"
                            leftSection={<IconCake size={16} />}
                        />
                    </SimpleGrid>
                    
                    <Button type="submit" fullWidth mt="xl" radius="md" size="md">
                        {editingUser ? "Actualizar Datos" : "Registrar Servidor(a)"}
                    </Button>
                </form>

                {editingUser && (
                <Stack mt="xl" gap="xl">
                    <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', pt: 'xl' }}>
                        <Text fw={800} tt="uppercase" size="sm" mb="md" mt="xl" c="dimmed">Seguridad y Acceso</Text>
                        
                        {hasAuth ? (
                            <Alert color="teal" variant="light" radius="md" icon={<IconUser size={16} />}>
                            Este usuario posee una cuenta de acceso activa.
                            </Alert>
                        ) : (
                            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                            <Stack gap="xs">
                                <Text size="sm" fw={600}>Generar credenciales de acceso</Text>
                                <Group align="flex-end">
                                    <TextInput
                                        label="Contraseña Inicial"
                                        placeholder="Mínimo 6 caracteres"
                                        type="password"
                                        style={{ flex: 1 }}
                                        radius="md"
                                        value={initialPassword}
                                        onChange={(e) => setInitialPassword(e.target.value)}
                                    />
                                    <Button 
                                        variant="filled" 
                                        onClick={handleCreateAuth} 
                                        loading={authLoading}
                                        disabled={!formData.username}
                                        radius="md"
                                    >
                                        Activar Link
                                    </Button>
                                </Group>
                            </Stack>
                            </Paper>
                        )}
                    </Box>

                    <MembershipsManager userId={editingUser.id} />
                    <AbsencesManager userId={editingUser.id} />
                </Stack>
                )}
            </Paper>
        </Modal>
      </Stack>
    </Container>
  );
}
