import { ActionIcon, AppShell, Burger, Group, NavLink, Text, Stack, Divider, useMantineColorScheme, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';

export function DashboardLayout() {
    const [opened, { toggle }] = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, managedDepartments } = useUser();
    const { isLiderOrSublider, isLiderOrSubliderServidores, isLiderSubliderEncargadoServidores } = usePermissions();

    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Forzar recarga para limpiar el contexto y mostrar login
        window.location.replace('/login');
    };



    // Opciones visibles según rol
    const links = [
        { label: 'Dashboard', path: '/' },
        { label: 'Calendario', path: '/calendar' },
        ...(isLiderOrSublider ? [
            { label: 'Planificación', path: '/planning' },
            { label: 'Departamentos', path: '/departments' },
            { label: 'Estadísticas', path: '/analytics' },
        ] : []),
        ...(isLiderOrSubliderServidores ? [
            { label: 'Servidores', path: '/servers' },
            { label: 'Suspensiones', path: '/suspensions' },
        ] : []),
        ...(isLiderSubliderEncargadoServidores ? [
            { label: 'Asistencia', path: '/attendance' },
        ] : []),
    ];

    const userName = userProfile?.usuario
        ? `${userProfile.usuario.nombre} ${userProfile.usuario.apellido}`
        : '';

    return (
        <AppShell
            header={{ height: 80 }}
            navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header style={{
                backgroundColor: 'var(--mantine-color-body)',
                borderBottom: '1px solid var(--mantine-color-default-border)',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <Group justify="space-between" h="100%" px="xl">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="yellow.7" />
                        <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <ThemeIcon size={54} radius="xl" variant="gradient" gradient={{ from: 'orange.6', to: 'yellow.6', deg: 135 }} style={{ boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)', transition: 'transform 0.2s ease' }} className="hover:scale-105">
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
                                >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z" />
                                </svg>
                            </ThemeIcon>
                            <Stack gap={2} visibleFrom="xs">
                                <Text fw={900} size="xl" lh={0.9} c={dark ? 'white' : 'dark'} style={{ letterSpacing: '-0.02em', fontSize: '1.35rem' }}>SERVIDORES</Text>
                                <Text size="10px" c="orange.7" fw={800} style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>AVIVAMIENTO Y PODER</Text>
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
                            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
                        </ActionIcon>

                        <Stack gap={0} align="flex-end" visibleFrom="xs">
                            <Text size="sm" fw={800} c={dark ? 'gold.2' : 'stone.7'}>{userName}</Text>
                            <Text size="xs" c={dark ? 'gold.4' : 'gold.6'} fw={700} opacity={0.9} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {managedDepartments.length > 0 ? managedDepartments.map(d => d.nombre).join(', ') : 'Servidor'}
                            </Text>
                        </Stack>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 900,
                            boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                        }}>
                            {userName?.[0]}
                        </div>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{
                backgroundColor: 'var(--mantine-color-body)',
                borderRight: '1px solid var(--mantine-color-default-border)'
            }}>
                <Stack gap="xs" mt="md">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            label={link.label}
                            active={location.pathname === link.path}
                            onClick={() => {
                                navigate(link.path);
                                if (opened) toggle();
                            }}
                            styles={() => ({
                                root: {
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    fontWeight: 600,
                                    margin: '2px 0',
                                    backgroundColor: location.pathname === link.path ? (dark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : undefined,
                                    color: location.pathname === link.path ? (dark ? '#fbbf24' : '#b45309') : undefined,
                                    '&:hover': {
                                        backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : '#fff7ed',
                                        transform: 'translateX(4px)'
                                    }
                                },
                                label: { fontSize: '0.9rem' }
                            })}
                        />
                    ))}
                </Stack>
                <Divider my="sm" />
                <NavLink
                    label="Cerrar Sesión"
                    color="red.7"
                    onClick={handleLogout}
                    styles={{
                        root: { borderRadius: '8px', fontWeight: 700 }
                    }}
                />
            </AppShell.Navbar>

            <AppShell.Main className="animate-fade-in">
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
