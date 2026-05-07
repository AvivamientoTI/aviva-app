import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Login from '../Login';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
    notifications: {
        show: vi.fn(),
    },
}));

// Mock Supabase
vi.mock('../../../services/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        },
    },
}));

const renderLogin = () =>
    render(
        <MantineProvider>
            <Login />
        </MantineProvider>
    );

describe('Auth > Login', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should render the login form with all required elements', () => {
        renderLogin();

        expect(screen.getByText('Iglesia Avivamiento y Poder')).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre de Usuario/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });

    it('should show username validation error when username is empty', async () => {
        renderLogin();

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
        });
    });

    it('should show password validation error when password is too short', async () => {
        renderLogin();

        fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
            target: { value: 'juan.perez' },
        });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), {
            target: { value: '123' },
        });

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
        });
    });

    it('should call signInWithPassword with virtual email strategy', async () => {
        const { supabase } = await import('../../../services/supabaseClient');

        renderLogin();

        fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
            target: { value: 'Juan.Perez' },
        });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), {
            target: { value: 'password123' },
        });

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'juan.perez@ayp.com', // lowercase conversion
                password: 'password123',
            });
        });
    });

    it('should show notification error on invalid credentials', async () => {
        const { supabase } = await import('../../../services/supabaseClient');
        const { notifications } = await import('@mantine/notifications');

        (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
            error: { message: 'Invalid login credentials' },
        });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
            target: { value: 'wrong.user' },
        });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), {
            target: { value: 'wrongpass' },
        });

        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Usuario o contraseña incorrectos',
                    color: 'red',
                })
            );
        });
    });

    it('should clear validation error when user types in the field', async () => {
        renderLogin();

        // Trigger error first
        const form = document.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('El nombre de usuario es requerido')).toBeInTheDocument();
        });

        // Now type something - error should clear
        fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
            target: { value: 'a' },
        });

        await waitFor(() => {
            expect(screen.queryByText('El nombre de usuario es requerido')).not.toBeInTheDocument();
        });
    });
});
