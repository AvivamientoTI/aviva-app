import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Stack } from '@mantine/core';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import './login.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'El email es requerido';
    if (!emailRegex.test(email)) return 'Formato de email inválido';
    return '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    const emailValidation = validateEmail(email);
    const passwordValidation = password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres';

    if (emailValidation || passwordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      notifications.show({
        title: 'Error de inicio de sesión',
        message: error.message,
        color: 'red',
      });
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-bg" style={{
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.03) 0px, transparent 50%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container size={420}>
        <Paper withBorder shadow="xl" p="xl" radius="32px" style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          color: '#0f172a'
        }}>
          <Stack align="center" gap="xs" mb="xl">
            <div style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '24px',
              border: '1px solid #dbeafe'
            }}>
              <img src="/vite.svg" alt="Logo" style={{ width: 48, height: 48 }} />
            </div>
            <Title order={2} ta="center" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.4rem', letterSpacing: '-0.02em', color: '#1e3a8a' }}>
              Aviva <Text span c="blue.6" inherit>App</Text>
            </Title>
            <Text size="md" ta="center" c="slate.7" fw={700}>
              Bienvenido al portal de Servidores
            </Text>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="ejemplo@correo.com"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                error={emailError}
                autoComplete="username"
                size="md"
                radius="xl"
                styles={{
                  input: {
                    backgroundColor: '#fcfcfd',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:focus': { borderColor: '#2563eb' }
                  },
                  label: { color: '#475569', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }
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
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:focus': { borderColor: '#2563eb' }
                  },
                  label: { color: '#475569', fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }
                }}
              />
              <Button fullWidth mt="xl" type="submit" loading={loading} size="lg" radius="xl" color="blue.6" style={{
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                height: 54,
                fontSize: '1.1rem'
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
