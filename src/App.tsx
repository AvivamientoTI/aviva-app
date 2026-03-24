import { useState, useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Routes, Route, Navigate, useNavigate, BrowserRouter, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { useUser, UserProvider } from './contexts/UserContext';
import { usePermissions } from './hooks/usePermissions';

// Layouts & Global Components
import { DashboardLayout } from './layouts/DashboardLayout';
import { RestrictedAccess } from './components/RestrictedAccess';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullScreenLoader } from './components/FullScreenLoader';

// Lazy Loaded Features
const Login = lazy(() => import('./features/auth/Login'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const ScheduleView = lazy(() => import('./features/calendar/ScheduleView'));
const AttendanceManager = lazy(() => import('./features/attendance/AttendanceManager'));
const DepartmentsList = lazy(() => import('./features/departments/DepartmentsList'));
const PlanningWizard = lazy(() => import('./features/planning/PlanningWizard'));
const UsersList = lazy(() => import('./features/users/UsersList'));
const SuspensionManager = lazy(() => import('./features/users/SuspensionManager'));
const AnalyticsDashboard = lazy(() => import('./features/analytics/AnalyticsDashboard'));
const AdminAnalytics = lazy(() => import('./features/analytics/AdminAnalytics'));


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
        return <RestrictedAccess type="no-permissions" memberships={userMemberships} isMember={isServidoresMember} />;
    }

    return (
        <Suspense fallback={<FullScreenLoader />}>
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
                    <Route path="admin/analytics" element={perms.isSystemAdmin ? <AdminAnalytics /> : <RestrictedAccess />} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Route>
            </Routes>
        </Suspense>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Default 5m freshness
            gcTime: 1000 * 60 * 60, // Keep in cache 1 hour
            refetchOnWindowFocus: true,
            retry: 1
        }
    }
});

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
