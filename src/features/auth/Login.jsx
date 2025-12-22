import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Center } from '@mantine/core';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

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
    <Center h="100vh" bg="gray.1" w="100%">
      <Container size={420} my={40}>
        <Title ta="center">Bienvenido a Ujieres AYP</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          Inicia sesión para continuar
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
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
              error={emailError}
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
              error={passwordError}
            />
            <Button fullWidth mt="xl" type="submit" loading={loading}>
              Iniciar Sesión
            </Button>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}
