import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Stack } from '@mantine/core';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { loginSchema } from '../../schemas/auth.schema';
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

    const result = loginSchema.safeParse({ username: username.trim(), password });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setUsernameError(errors.username?.[0] ?? '');
      setPasswordError(errors.password?.[0] ?? '');
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
    <div className="login-bg">
      <Container size={420}>
        <Paper withBorder shadow="xl" p="xl" radius="32px" style={{
          backgroundColor: '#fafaf9', /* stone.0 — warm white */
          borderColor: '#e7e5e4',     /* stone.2 — warm border */
          borderTop: '3px solid #d97706', /* gold.6 — brand identity accent */
          color: '#1c1917'            /* stone.9 */
        }}>
          <Stack align="center" gap="xs" mb="xl">
            <img
              src="/logo-iglesia.png"
              alt="Iglesia Avivamiento y Poder"
              style={{ width: 300, height: 300, objectFit: 'contain' }}
            />
            <Title order={2} ta="center" mt="sm" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.6rem', letterSpacing: '-0.01em', color: '#854d0e' }}>
              Aviva <span style={{ color: '#c2773a' }}>App</span>
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
                    backgroundColor: '#fafaf9', /* stone.0 */
                    borderColor: '#e7e5e4',     /* stone.2 */
                    color: '#1c1917',           /* stone.9 — warm dark */
                    fontWeight: 600,
                    '&:focus': { borderColor: '#d97706' } /* gold.6 */
                  },
                  label: { color: '#78716c', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 } /* stone.5 */
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
                    backgroundColor: '#fafaf9', /* stone.0 */
                    borderColor: '#e7e5e4',     /* stone.2 */
                    color: '#1c1917',           /* stone.9 — warm dark */
                    fontWeight: 600,
                    '&:focus': { borderColor: '#d97706' } /* gold.6 */
                  },
                  label: { color: '#78716c', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 } /* stone.5 */
                }}
              />
              <Button fullWidth mt="xl" type="submit" loading={loading} size="lg" radius="xl" style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', /* gold.6 → gold.7 — exact theme values */
                boxShadow: '0 8px 16px rgba(217, 119, 6, 0.28)',
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

