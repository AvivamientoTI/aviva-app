import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text } from '@mantine/core';
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
    <div className="login-bg">
      <Container size={420}>
        <Paper withBorder shadow="md" className="login-paper">
          <img src="/vite.svg" alt="Logo" style={{ display: 'block', margin: '0 auto 1rem auto', width: 64, height: 64 }} />
          <Title order={2} ta="center" className="login-title">Aviva App</Title>
          <Text size="sm" ta="center" className="login-subtitle" mb={20}>
            Inicia sesión para continuar
          </Text>
          <form onSubmit={handleLogin}>
            <TextInput
              label="Email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              error={emailError && <span className="login-error">{emailError}</span>}
              autoComplete="username"
              size="md"
              radius="md"
              mb={8}
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              required
              mt="md"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              error={passwordError && <span className="login-error">{passwordError}</span>}
              autoComplete="current-password"
              size="md"
              radius="md"
              mb={8}
            />
            <Button fullWidth mt="xl" type="submit" loading={loading} className="login-btn" size="md" radius="md">
              Iniciar Sesión
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
