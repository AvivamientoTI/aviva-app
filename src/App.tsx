import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Routes, Route, Navigate, useNavigate, BrowserRouter, useLocation } from 'react-router-dom';
// Force re-resolve
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/Login';
import { ScheduleView } from './features/calendar/ScheduleView';
import { AttendanceManager } from './features/attendance/AttendanceManager';
import { Dashboard } from './features/dashboard/Dashboard';
import { DepartmentsList } from './features/departments/DepartmentsList';
import { PlanningWizard } from './features/planning/PlanningWizard';
import { supabase } from './services/supabaseClient';
import { useUser, UserProvider } from './contexts/UserContext';
import { usePermissions } from './hooks/usePermissions';
import { UsersList } from './features/users/UsersList';
import { SuspensionManager } from './features/users/SuspensionManager';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';

import { RestrictedAccess } from './components/RestrictedAccess';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullScreenLoader } from './components/FullScreenLoader';

function AppContent() {
    const location = useLocation();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { loading: userLoading, userProfile, userMemberships } = useUser();
    const perms = usePermissions();
    const {
        isServidoresMember,
        isLiderOrSublider,
        isLiderSubliderEncargadoServidores,
        isLiderOrSubliderServidores
    } = perms;
    const navigate = useNavigate();

    console.log('[AppContent] Render:', {
        pathname: location.pathname,
        hasSession: !!session,
        perms,
        membershipsCount: userMemberships?.length,
        userLoading
    });

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
        return <FullScreenLoader />;
    }



    // Si no hay perfil vinculado (usuario huérfano)
    if (session && userProfile === null) {
        return <RestrictedAccess type="no-profile" />;
    }

    // Si tiene perfil pero no es miembro de ningún departamento válido y no es administrador global
    if (session && !isServidoresMember && !perms.isSystemAdmin && location.pathname !== '/login') {
        const { userMemberships } = useUser();
        return <RestrictedAccess type="no-permissions" memberships={userMemberships} isMember={isServidoresMember} />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={session ? <DashboardLayout /> : <Navigate to="/login" />}>
                <Route index element={<Dashboard />} />
                <Route path="calendar" element={<ScheduleView />} />
                <Route path="departments" element={perms.isSystemAdmin || isLiderOrSublider ? <DepartmentsList /> : <RestrictedAccess />} />
                <Route path="planning" element={perms.isSystemAdmin || isLiderOrSublider ? <PlanningWizard /> : <RestrictedAccess />} />
                <Route path="attendance" element={perms.isSystemAdmin || isLiderSubliderEncargadoServidores ? <AttendanceManager /> : <RestrictedAccess />} />
                <Route path="servers" element={perms.isSystemAdmin || isLiderOrSubliderServidores ? <UsersList /> : <RestrictedAccess />} />
                <Route path="suspensions" element={perms.isSystemAdmin || isLiderOrSubliderServidores ? <SuspensionManager /> : <RestrictedAccess />} />
                <Route path="analytics" element={perms.isSystemAdmin || isLiderOrSublider ? <AnalyticsDashboard /> : <RestrictedAccess />} />
                <Route path="*" element={<Navigate to="/" />} />
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
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <AppContent />
                    </BrowserRouter>
                </UserProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
