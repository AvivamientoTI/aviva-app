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
            <div style={{
              padding: '0px',
              backgroundColor: '#fffbeb', // Amber 50
              borderRadius: '50%',
              border: '4px solid #ffffff',
              boxShadow: '0 8px 20px rgba(212, 175, 55, 0.15)',
              width: 140,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.6)' }} />
            </div>
            <Title order={2} ta="center" mt="sm" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.4rem', letterSpacing: '-0.02em', color: '#854d0e' }}>
              Aviva <Text span c="yellow.7" inherit>App</Text>
            </Title>
            <Text size="md" ta="center" c="stone.5" fw={600}>
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
