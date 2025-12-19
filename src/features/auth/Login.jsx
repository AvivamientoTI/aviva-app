import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Center } from '@mantine/core';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      notifications.show({
        title: 'Error',
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
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput 
              label="Contraseña" 
              placeholder="Tu contraseña" 
              required 
              mt="md" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
