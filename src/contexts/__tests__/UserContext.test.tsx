import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '../UserContext';
import { MantineProvider } from '@mantine/core';

// Supabase is mocked globally via src/test/setup.ts
import { supabase } from '../../services/supabaseClient';

// Helper: wrap with providers
const makeWrapper = (ui: React.ReactNode) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <MantineProvider>
                <UserProvider>{ui}</UserProvider>
            </MantineProvider>
        </QueryClientProvider>
    );
};

// Simple consumer component
const TestConsumer = () => {
    const ctx = useUser();
    return (
        <div>
            <span data-testid="user">{ctx.user ? 'logged-in' : 'no-user'}</span>
            <span data-testid="loading">{ctx.loading ? 'loading' : 'ready'}</span>
            <span data-testid="memberships">{ctx.userMemberships.length}</span>
        </div>
    );
};

describe('UserContext > useUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should throw when used outside of UserProvider', () => {
        // Suppress console.error from React's error boundary
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => {
            render(<TestConsumer />);
        }).toThrow('useUser debe usarse dentro de UserProvider');
        spy.mockRestore();
    });

    it('should render without crashing with no authenticated user', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: null
        });

        makeWrapper(<TestConsumer />);

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        });
    });

    it('should expose userMemberships as empty array when no session', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: null
        });

        makeWrapper(<TestConsumer />);

        await waitFor(() => {
            expect(screen.getByTestId('memberships')).toHaveTextContent('0');
        });
    });

    it('should load user profile and memberships when session exists', async () => {
        const mockUser = { id: 'user-uuid-123' };
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } },
            error: null
        });

        // Profile fetch
        (supabase.from as any).mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'user-uuid-123', usuario_id: 42 },
                error: null
            })
        });

        // Memberships fetch
        (supabase.from as any).mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 1,
                        usuario_id: 42,
                        departamento_id: 5,
                        rol_jerarquico: 'Servidor',
                        departamento: { id: 5, nombre: 'Servidores' }
                    }
                ],
                error: null
            })
        });

        makeWrapper(<TestConsumer />);

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('logged-in');
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByTestId('memberships')).toHaveTextContent('1');
        }, { timeout: 3000 });
    });

    it('should sign out on refresh token error (400 status)', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: { status: 400, message: 'Refresh Token expired' }
        });

        makeWrapper(<TestConsumer />);

        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});

describe('UserContext > isDepartmentLeader', () => {
    it('should return false for non-leader user', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: null
        });

        const TestLeaderCheck = () => {
            const ctx = useUser();
            const isLeader = ctx.isDepartmentLeader(5);
            return <span data-testid="leader">{isLeader ? 'yes' : 'no'}</span>;
        };

        makeWrapper(<TestLeaderCheck />);

        await waitFor(() => {
            expect(screen.getByTestId('leader')).toHaveTextContent('no');
        });
    });
});

describe('UserContext > isServidoresAdmin', () => {
    it('should return false when not an admin of Servidores', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: null },
            error: null
        });

        const TestAdminCheck = () => {
            const ctx = useUser();
            return <span data-testid="admin">{ctx.isServidoresAdmin() ? 'yes' : 'no'}</span>;
        };

        makeWrapper(<TestAdminCheck />);

        await waitFor(() => {
            expect(screen.getByTestId('admin')).toHaveTextContent('no');
        });
    });
});
