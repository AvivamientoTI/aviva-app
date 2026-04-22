import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FullScreenLoader } from './components/FullScreenLoader';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RestrictedAccess } from './components/RestrictedAccess';

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

export function AppRoutes() {
    return (
        <Suspense fallback={<FullScreenLoader />}>
            <Routes>
                {/* Ruta Pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas Protegidas en Layout de Dashboard */}
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="calendar" element={
                        <ProtectedRoute>
                            <ScheduleView />
                        </ProtectedRoute>
                    } />

                    <Route path="departments" element={
                        <ProtectedRoute requireLider>
                            <DepartmentsList />
                        </ProtectedRoute>
                    } />

                    <Route path="planning" element={
                        <ProtectedRoute requireLider>
                            <PlanningWizard />
                        </ProtectedRoute>
                    } />

                    <Route path="attendance" element={
                        <ProtectedRoute requireEncargado>
                            <AttendanceManager />
                        </ProtectedRoute>
                    } />

                    <Route path="servers" element={
                        <ProtectedRoute requireLiderServidores>
                            <UsersList />
                        </ProtectedRoute>
                    } />

                    <Route path="suspensions" element={
                        <ProtectedRoute requireLiderServidores>
                            <SuspensionManager />
                        </ProtectedRoute>
                    } />

                    <Route path="analytics" element={
                        <ProtectedRoute requireLider>
                            <AnalyticsDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="admin/analytics" element={
                        <ProtectedRoute requireAdmin>
                            <AdminAnalytics />
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
