import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './features/auth/Login';
import { ScheduleView } from './features/calendar/ScheduleView';
import { Dashboard } from './features/dashboard/Dashboard';
import { supabase } from './services/supabaseClient';
import { Loader, Center, Stack, Text } from '@mantine/core';
import { useUser, UserProvider } from './contexts/UserContext';

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userMemberships, loading: userLoading } = useUser();

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

  if (loading || userLoading) {
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

  // Verificar membresía en 'Servidores'
  const isServidoresMember = userMemberships?.some(m => m.departamento?.nombre === 'Servidores');

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={session ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route index element={isServidoresMember ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="calendar" element={isServidoresMember ? <ScheduleView /> : <Navigate to="/login" />} />
        {/* Redirigir cualquier otra ruta a dashboard si es miembro, o al login si no */}
        <Route path="*" element={isServidoresMember ? <Navigate to="/" /> : <Navigate to="/login" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;

