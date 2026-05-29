import React from 'react';
import { ActionIcon, AppShell, Burger, Group, NavLink, Text, Stack, Divider, useMantineColorScheme, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon, IconShieldLock, IconLayoutDashboard, IconCalendar, IconCalendarStats, IconBuildingCommunity, IconChartBar, IconUsers, IconCalendarCancel, IconTrendingUp, IconClipboardList, IconCalendarEvent, IconCalendarCheck } from '@tabler/icons-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { PasswordChangeModal } from '../features/auth/components/PasswordChangeModal';
import { useQueryClient } from '@tanstack/react-query';
import { AgendaNotificationModal } from '../features/agenda/AgendaNotificationModal';

export function DashboardLayout() {
    const [opened, { toggle }] = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, managedDepartments } = useUser();
    const { isSystemAdmin, isLiderOrSublider, isLiderOrSubliderServidores, isLiderSubliderEncargadoServidores } = usePermissions();
    const [pwdModalOpened, { open: openPwd, close: closePwd }] = useDisclosure(false);
    const queryClient = useQueryClient();

    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        queryClient.clear();
        window.location.replace('/login');
    };



    // Grupos de navegación por función — agrupados con microdividers
    const personalLinks = [
        { label: 'Panel', path: '/', icon: <IconLayoutDashboard size={20} stroke={1.5} /> },
        { label: 'Agenda', path: '/agenda', icon: <IconCalendarEvent size={20} stroke={1.5} /> },
        { label: 'Calendario', path: '/calendar', icon: <IconCalendar size={20} stroke={1.5} /> },
        { label: 'Mi Asistencia', path: '/attendance/personal', icon: <IconCalendarCheck size={20} stroke={1.5} /> },
    ];

    const equipoLinks = [
        ...(isSystemAdmin || isLiderOrSublider ? [
            { label: 'Planificación', path: '/planning', icon: <IconCalendarStats size={20} stroke={1.5} /> },
            { label: 'Departamentos', path: '/departments', icon: <IconBuildingCommunity size={20} stroke={1.5} /> },
            { label: 'Servidores', path: '/servers', icon: <IconUsers size={20} stroke={1.5} /> },
        ] : []),
        ...(isSystemAdmin || isLiderOrSublider || isLiderOrSubliderServidores ? [
            { label: 'Suspensiones', path: '/suspensions', icon: <IconCalendarCancel size={20} stroke={1.5} /> },
        ] : []),
    ];

    const asistenciaLinks = [
        ...(isSystemAdmin || isLiderSubliderEncargadoServidores ? [
            { label: 'Asistencia', path: '/attendance', icon: <IconClipboardList size={20} stroke={1.5} /> },
        ] : []),
        ...(isSystemAdmin || isLiderOrSublider ? [
            { label: 'Registro de Asistencia', path: '/attendance/registry', icon: <IconCalendarCheck size={20} stroke={1.5} /> },
        ] : []),
    ];

    const analisisLinks = [
        ...(isSystemAdmin || isLiderOrSublider ? [
            { label: 'Estadísticas', path: '/analytics', icon: <IconChartBar size={20} stroke={1.5} /> },
        ] : []),
        ...(isSystemAdmin ? [
            { label: 'Analítica Global', path: '/admin/analytics', icon: <IconTrendingUp size={20} stroke={1.5} /> },
        ] : []),
    ];

    const renderNavLink = (link: { label: string; path: string; icon: React.ReactNode }) => (
        <NavLink
            key={link.path}
            label={link.label}
            leftSection={link.icon}
            active={location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))}
            onClick={() => { navigate(link.path); if (opened) toggle(); }}
            className="nav-item-premium"
        />
    );

    const userName = userProfile?.usuario
        ? `${userProfile.usuario.nombre} ${userProfile.usuario.apellido}`
        : '';

    return (
        <AppShell
            header={{ height: { base: 60, sm: 80 } }}
            navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding={{ base: 'xs', sm: 'md' }}
        >
            <AppShell.Header className="shell-glass" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between" h="100%" px={{ base: 'md', sm: 'xl' }}>
                    <Group gap="xs">
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                            color="gold.7"
                            aria-label={opened ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                        />
                        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <ThemeIcon size={54} radius="xl" variant="gradient" gradient={{ from: 'orange.6', to: 'yellow.6', deg: 135 }} className="logo-icon" style={{ boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)', transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1)' }} aria-label="Ir al panel principal">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <title>Llama — Servidores Avivamiento y Poder</title>
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z" />
                                </svg>
                            </ThemeIcon>
                            <Stack gap={2} visibleFrom="xs">
                                <Text fw={900} size="xl" lh={0.9} c={dark ? 'white' : 'dark'} style={{ letterSpacing: 'var(--ls-display)', fontSize: '1.35rem' }}>SERVIDORES</Text>
                                <Text size="10px" c="orange.7" fw={800} style={{ letterSpacing: 'var(--ls-tag)', textTransform: 'uppercase' }}>AVIVAMIENTO Y PODER</Text>
                            </Stack>
                        </Group>
                    </Group>
                    <Group gap="sm">
                        <ActionIcon
                            variant="light"
                            color="gold"
                            onClick={() => setColorScheme(dark ? 'light' : 'dark')}
                            size="lg"
                            radius="md"
                            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
                        </ActionIcon>

                        <Stack gap={0} align="flex-end" visibleFrom="xs">
                            <Text size="sm" fw={800} c={dark ? 'white' : 'dark'}>{userName}</Text>
                            <Text size="xs" c={dark ? 'gold.4' : 'gold.6'} fw={700} opacity={0.9} style={{ textTransform: 'uppercase', letterSpacing: 'var(--ls-label)' }}>
                                {isSystemAdmin ? 'ADMINISTRADOR DEL SISTEMA' : (managedDepartments.length > 0 ? managedDepartments.map(d => d.nombre).join(', ') : 'Servidor')}
                            </Text>
                        </Stack>
                        <div
                            role="img"
                            aria-label={`Avatar de ${userName}`}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)',
                                flexShrink: 0,
                            }}
                        >
                            <span aria-hidden="true">{userName?.[0] ?? '?'}</span>
                        </div>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar
                p="md"
                className="sidebar-glass"
                component="nav"
                aria-label="Navegación principal"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
                {/* Links con scroll — agrupados por función */}
                <Stack gap="xs" mt="md" style={{ flex: 1, overflowY: 'auto', overflowX: 'visible', paddingBottom: '8px', paddingInline: '2px' }}>
                    {personalLinks.map(renderNavLink)}

                    {equipoLinks.length > 0 && (
                        <>
                            <Divider
                                label={<Text className="section-label">Equipo</Text>}
                                labelPosition="left"
                                mt="xs"
                                mb={2}
                            />
                            {equipoLinks.map(renderNavLink)}
                        </>
                    )}

                    {asistenciaLinks.length > 0 && (
                        <>
                            <Divider
                                label={<Text className="section-label">Asistencia</Text>}
                                labelPosition="left"
                                mt="xs"
                                mb={2}
                            />
                            {asistenciaLinks.map(renderNavLink)}
                        </>
                    )}

                    {analisisLinks.length > 0 && (
                        <>
                            <Divider
                                label={<Text className="section-label">Análisis</Text>}
                                labelPosition="left"
                                mt="xs"
                                mb={2}
                            />
                            {analisisLinks.map(renderNavLink)}
                        </>
                    )}
                </Stack>

                {/* Acciones fijas al fondo */}
                <div style={{ flexShrink: 0 }}>
                    <Divider my="sm" />
                    <NavLink
                        label="Cambiar Contraseña"
                        leftSection={<IconShieldLock size={18} />}
                        onClick={openPwd}
                        className="nav-item-premium"
                        styles={{
                            root: { color: dark ? 'var(--mantine-color-gold-4)' : 'var(--mantine-color-gold-9)' }
                        }}
                    />
                    <NavLink
                        label="Cerrar Sesión"
                        onClick={handleLogout}
                        className="nav-item-premium"
                        styles={{
                            root: { color: 'var(--mantine-color-red-7)', fontWeight: 700 }
                        }}
                    />
                </div>
                <PasswordChangeModal opened={pwdModalOpened} onClose={closePwd} />
                <AgendaNotificationModal />
            </AppShell.Navbar>


            <AppShell.Main className="animate-fade-in">
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
