import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// Force re-resolve
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/Login';
import { ScheduleView } from './features/calendar/ScheduleView';
import { AttendanceManager } from './features/attendance/AttendanceManager';
import { Dashboard } from './features/dashboard/Dashboard';
import { DepartmentsList } from './features/departments/DepartmentsList';
import { PlanningWizard } from './features/planning/PlanningWizard';
import { supabase } from './services/supabaseClient';
import { Loader, Center, Stack, Text } from '@mantine/core';
import { useUser, UserProvider } from './contexts/UserContext';
import { UsersList } from './features/users/UsersList';
import { SuspensionManager } from './features/users/SuspensionManager';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { RestrictedAccess } from './components/RestrictedAccess';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { userMemberships, loading: userLoading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                navigate('/login', { replace: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
    }, []);

    if (loading || userLoading) {
        return (
            <Center h="100vh" style={{ backgroundColor: '#fcfaf5' }}>
                <Stack align="center" gap="xl">
                    <Loader size="xl" color="yellow.7" type="dots" />
                    <Text size="2.4rem" fw={900} variant="gradient" gradient={{ from: '#d97706', to: '#b45309' }} style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
                        Servidores AYP
                    </Text>
                    <Text size="xs" fw={800} c="stone.5" tt="uppercase" style={{ letterSpacing: '0.15em' }}>
                        Iniciando Experiencia Premium
                    </Text>
                </Stack>
            </Center>
        );
    }

    // Verificar membresía en 'Servidores'
    const isServidoresMember = userMemberships?.some(m => m.departamento?.nombre === 'Servidores');

    // Verificar si es líder o sublíder de cualquier departamento
    const isLiderOrSublider = userMemberships?.some(m => {
        const r = m.rol_jerarquico?.toLowerCase();
        return r === 'líder' || r === 'lider' || r === 'sublíder' || r === 'sublider';
    });

    // Verificar si es líder, sublíder o encargado del departamento de Servidores
    const isLiderSubliderEncargadoServidores = userMemberships?.some(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === 'servidores' && (
            rol === 'líder' || rol === 'lider' || rol === 'sublíder' || rol === 'sublider' || rol === 'encargado' || rol === 'encargada'
        );
    });

    // Verificar si es líder o sublíder del departamento de Servidores
    const isLiderOrSubliderServidores = userMemberships?.some(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === 'servidores' && (
            rol === 'líder' || rol === 'lider' || rol === 'sublíder' || rol === 'sublider'
        );
    });

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={session ? <DashboardLayout /> : <Navigate to="/login" />}>
                <Route index element={isServidoresMember ? <Dashboard /> : <RestrictedAccess />} />
                <Route path="calendar" element={isServidoresMember ? <ScheduleView /> : <RestrictedAccess />} />
                <Route path="departments" element={isLiderOrSublider ? <DepartmentsList /> : <RestrictedAccess />} />
                <Route path="planning" element={isLiderOrSublider ? <PlanningWizard /> : <RestrictedAccess />} />
                <Route path="attendance" element={isLiderSubliderEncargadoServidores ? <AttendanceManager /> : <RestrictedAccess />} />
                <Route path="servers" element={isLiderOrSubliderServidores ? <UsersList /> : <RestrictedAccess />} />
                <Route path="suspensions" element={isLiderOrSubliderServidores ? <SuspensionManager /> : <RestrictedAccess />} />
                <Route path="analytics" element={isLiderOrSublider ? <AnalyticsDashboard /> : <RestrictedAccess />} />
                <Route path="*" element={isServidoresMember ? <Navigate to="/" /> : <RestrictedAccess />} />
            </Route>
        </Routes>
    );
}

const queryClient = new QueryClient();

function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <UserProvider>
                    <AppContent />
                </UserProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
