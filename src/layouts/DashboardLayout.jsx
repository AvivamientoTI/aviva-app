import React from 'react';
import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useUser } from '../contexts/UserContext';

export function DashboardLayout() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, managedDepartments, userMemberships, loading } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Forzar recarga para limpiar el contexto y mostrar login
    window.location.replace('/login');
  };

  // Determinar roles del usuario
  const roles = userMemberships?.map(m => m.rol_jerarquico?.toLowerCase()) || [];
  const isLider = userMemberships?.some(m => {
    const r = m.rol_jerarquico?.toLowerCase();
    return (r === 'líder' || r === 'lider') && m.departamento?.nombre === 'Servidores';
  });
  const isSublider = userMemberships?.some(m => {
    const r = m.rol_jerarquico?.toLowerCase();
    return (r === 'sublíder' || r === 'sublider') && m.departamento?.nombre === 'Servidores';
  });
  const isEncargado = userMemberships?.some(m => {
    const r = m.rol_jerarquico?.toLowerCase();
    return (r === 'encargado' || r === 'encargada') && m.departamento?.nombre === 'Servidores';
  });

  // Opciones visibles según rol
  const links = [
    { label: 'Dashboard', path: '/' },
    { label: 'Calendario', path: '/calendar' },
    ...(roles.includes('líder') || roles.includes('sublíder') || roles.includes('lider') || roles.includes('sublider') ? [
      { label: 'Planificación', path: '/planning' },
      { label: 'Departamentos', path: '/departments' },
    ] : []),
    ...((isLider || isSublider || isEncargado) ? [
      { label: 'Asistencia', path: '/attendance' },
    ] : []),
  ];

  const userName = userProfile?.usuario
    ? `${userProfile.usuario.nombre} ${userProfile.usuario.apellido}`
    : '';

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} fw={800} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Ujieres AYP</Title>
          </Group>
          {!loading && userName && (
            <Title order={6} c="dimmed">
              {userName}
              {managedDepartments.length > 0 && ` · Líder: ${managedDepartments.map(d => d.nombre).join(', ')}`}
            </Title>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {links.map((link) => (
          <NavLink
            key={link.path}
            label={link.label}
            active={location.pathname === link.path}
            onClick={() => {
              navigate(link.path);
              if (opened) toggle();
            }}
          />
        ))}
        <NavLink
          label="Cerrar Sesión"
          color="red"
          onClick={handleLogout}
          mt="auto"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
