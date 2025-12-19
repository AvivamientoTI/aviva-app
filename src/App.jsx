import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/Login';
import { ScheduleView } from './features/calendar/ScheduleView';
import { PlanningWizard } from './features/planning/PlanningWizard';
import { UsersList } from './features/users/UsersList';
import { DepartmentsList } from './features/departments/DepartmentsList';
import { AttendanceManager } from './features/attendance/AttendanceManager';
import { Dashboard } from './features/dashboard/Dashboard';
import { supabase } from './services/supabaseClient';
import { Loader, Center, Stack, Text } from '@mantine/core';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <Center h="100vh" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text size="lg" fw={600} c="blue.7">
            Cargando Ujieres App...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

      <Route path="/" element={session ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<ScheduleView />} />
        <Route path="planning" element={<PlanningWizard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="departments" element={<DepartmentsList />} />
        <Route path="attendance" element={<AttendanceManager />} />
      </Route>
    </Routes>
  );
}

export default App;

