import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FullScreenLoader } from '../FullScreenLoader';
import { MantineProvider } from '@mantine/core';

describe('FullScreenLoader', () => {
    it('renders with default values', () => {
        render(
            <MantineProvider>
                <FullScreenLoader />
            </MantineProvider>
        );

        expect(screen.getByText('Servidores AYP')).toBeInTheDocument();
        expect(screen.getByText('Iniciando Sesión')).toBeInTheDocument();
    });

    it('renders with custom message and subMessage', () => {
        render(
            <MantineProvider>
                <FullScreenLoader message="Cargando Datos" subMessage="Por favor espere" />
            </MantineProvider>
        );

        expect(screen.getByText('Cargando Datos')).toBeInTheDocument();
        expect(screen.getByText('Por favor espere')).toBeInTheDocument();
    });
});
