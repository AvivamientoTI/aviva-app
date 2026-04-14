import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RestrictedAccess } from '../RestrictedAccess';
import { MantineProvider } from '@mantine/core';

describe('RestrictedAccess', () => {
    it('renders restriction message correctly', () => {
        render(
            <MantineProvider>
                <RestrictedAccess />
            </MantineProvider>
        );

        expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
        expect(screen.getByText(/Lo sentimos, no tienes los permisos necesarios para acceder a esta sección./i)).toBeInTheDocument();
    });
});
