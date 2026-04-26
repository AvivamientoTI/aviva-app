import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Stack } from '@mantine/core';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import './login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');

    const usernameValidation = username.trim() ? '' : 'El nombre de usuario es requerido';
    const passwordValidation = password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres';

    if (usernameValidation || passwordValidation) {
      setUsernameError(usernameValidation);
      setPasswordError(passwordValidation);
      return;
    }

    setLoading(true);

    // Estrategia de Email Virtual: convertimos el username a un email interno para Supabase Auth
    const virtualEmail = `${username.trim().toLowerCase()}@ayp.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password,
    });

    if (error) {
      notifications.show({
        title: 'Error de inicio de sesión',
        message: 'Usuario o contraseña incorrectos',
        color: 'red',
      });
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-bg" style={{
      backgroundColor: '#fcfaf5', // Warm white/cream
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(212, 175, 55, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(197, 160, 89, 0.05) 0px, transparent 50%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container size={420}>
        <Paper withBorder shadow="xl" p="xl" radius="32px" style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0', // Neutral border is fine, maybe slightly warmer? Let's keep neutral for clean look
          color: '#1c1917'
        }}>
          <Stack align="center" gap="xs" mb="xl">
            <img
              src="/logo-iglesia.png"
              alt="Iglesia Avivamiento y Poder"
              style={{ width: 300, height: 300, objectFit: 'contain' }}
            />
            <Title order={2} ta="center" mt="sm" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.6rem', letterSpacing: '-0.01em', color: '#854d0e' }}>
              Aviva App
            </Title>
            <Text size="sm" ta="center" c="stone.5" fw={600}>
              Iglesia Avivamiento y Poder
            </Text>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                label="Nombre de Usuario"
                placeholder="ej. juan.perez"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                error={usernameError}
                autoComplete="username"
                size="md"
                radius="xl"
                styles={{
                  input: {
                    backgroundColor: '#fcfcfd',
                    borderColor: '#e7e5e4',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:focus': { borderColor: '#ca8a04' } // Focus Gold
                  },
                  label: { color: '#78716c', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }
                }}
              />
              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                error={passwordError}
                autoComplete="current-password"
                size="md"
                radius="xl"
                styles={{
                  input: {
                    backgroundColor: '#fcfcfd',
                    borderColor: '#e7e5e4',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:focus': { borderColor: '#ca8a04' } // Focus Gold
                  },
                  label: { color: '#78716c', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }
                }}
              />
              <Button fullWidth mt="xl" type="submit" loading={loading} size="lg" radius="xl" style={{
                background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', // Gold/Amber gradient
                boxShadow: '0 8px 16px rgba(202, 138, 4, 0.25)',
                height: 54,
                fontSize: '1.1rem',
                border: 'none',
                color: 'white'
              }}>
                Iniciar Sesión
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
}

