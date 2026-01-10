import { ActionIcon, AppShell, Burger, Group, NavLink, Title, Text, Stack, Divider, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useUser } from '../contexts/UserContext';

export function DashboardLayout() {
    const [opened, { toggle }] = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, managedDepartments, userMemberships } = useUser();

    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

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
        ...((isLider || isSublider) ? [
            { label: 'Servidores', path: '/servers' },
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
            header={{ height: 70 }}
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
                        <Title order={3} fw={900} style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #d97706, #b45309)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            SERV AYP
                        </Title>
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
                            styles={{
                                root: {
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    fontWeight: 600,
                                    margin: '2px 0',
                                    '&[data-active]': {
                                        backgroundColor: dark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7', // Amber 100/200
                                        color: dark ? '#fbbf24' : '#b45309', // Amber 700
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            height: '24px',
                                            width: '4px',
                                            backgroundColor: '#f59e0b', // Amber 500
                                            borderRadius: '0 4px 4px 0'
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: dark ? 'rgba(255, 255, 255, 0.05)' : '#fff7ed', // Orange 50
                                        transform: 'translateX(4px)'
                                    }
                                },
                                label: { fontSize: '0.9rem' }
                            }}
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
