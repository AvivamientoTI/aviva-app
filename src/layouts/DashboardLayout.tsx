import { AppShell, Burger, Group, NavLink, Title, Text, Stack, Divider } from '@mantine/core';
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
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <Group justify="space-between" h="100%" px="xl">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="blue.6" />
                        <Title order={3} fw={900} variant="gradient" gradient={{ from: '#1d4ed8', to: '#2563eb' }} style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                            SERV AYP
                        </Title>
                    </Group>
                    {!loading && userName && (
                        <Group gap="sm">
                            <Stack gap={0} align="flex-end" visibleFrom="xs">
                                <Text size="sm" fw={800} c="gray.9">{userName}</Text>
                                <Text size="xs" c="blue.7" fw={700} opacity={0.8} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {managedDepartments.length > 0 ? managedDepartments.map(d => d.nombre).join(', ') : 'Servidor'}
                                </Text>
                            </Stack>
                            <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}>
                                {userName?.[0]}
                            </div>
                        </Group>
                    )}
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{
                backgroundColor: '#f8fafc',
                borderRight: '1px solid #e2e8f0'
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
                                        backgroundColor: '#eff6ff',
                                        color: '#1d4ed8',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            height: '24px',
                                            width: '4px',
                                            backgroundColor: '#2563eb',
                                            borderRadius: '0 4px 4px 0'
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: '#f1f5f9',
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

            <AppShell.Main className="animate-fade-in" style={{ backgroundColor: '#fcfcfd' }}>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
