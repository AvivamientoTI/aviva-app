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

        expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
        expect(screen.getByText(/No tienes permisos para acceder/i)).toBeInTheDocument();
    });
});
