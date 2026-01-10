import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAvailableUsersForSwap } from './useAvailableUsersForSwap';

describe('useAvailableUsersForSwap', () => {
    const mockUsers = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', genero: 'M', roles: ['ujier'] },
        { id: 2, nombre: 'María', apellido: 'García', genero: 'F', roles: ['ujier', 'encargada'] },
        { id: 3, nombre: 'Pedro', apellido: 'Gómez', genero: 'M', roles: ['líder'] },
        { id: 4, nombre: 'Ana', apellido: 'López', genero: 'F', roles: ['ujier'] },
    ];

    it('should return empty array if loadingAssignedUsers is true', () => {
        const { result } = renderHook(() =>
            useAvailableUsersForSwap(mockUsers as any, null, [], true)
        );
        expect(result.current).toEqual([]);
    });

    it('should exclude users already assigned on the same day', () => {
        const swapTarget = { id: 100, usuario_id: 1, posicion: 'Ujier' };
        const allAssignedIds = [1, 2]; // Juan and María are busy

        const { result } = renderHook(() =>
            useAvailableUsersForSwap(mockUsers as any, swapTarget, allAssignedIds, false)
        );

        // Should include Juan (swap target), Pedro and Ana. María is excluded.
        const labels = result.current.map(u => u.label);
        expect(labels).toContain('Juan Pérez');
        expect(labels).toContain('Pedro Gómez');
        expect(labels).toContain('Ana López');
        expect(labels).not.toContain('María García');
    });

    it('should respect gender restrictions (M)', () => {
        const swapTarget = {
            id: 100,
            usuario_id: 1,
            posicionObj: { genero_requerido: 'M' }
        };

        const { result } = renderHook(() =>
            useAvailableUsersForSwap(mockUsers as any, swapTarget, [], false)
        );

        const labels = result.current.map(u => u.label);
        expect(labels).toContain('Juan Pérez');
        expect(labels).toContain('Pedro Gómez');
        expect(labels).not.toContain('María García');
        expect(labels).not.toContain('Ana López');
    });

    it('should respect gender restrictions (F)', () => {
        const swapTarget = {
            id: 100,
            usuario_id: 4,
            posicionObj: { genero_requerido: 'F' }
        };

        const { result } = renderHook(() =>
            useAvailableUsersForSwap(mockUsers as any, swapTarget, [], false)
        );

        const labels = result.current.map(u => u.label);
        expect(labels).toContain('María García');
        expect(labels).toContain('Ana López');
        expect(labels).not.toContain('Juan Pérez');
        expect(labels).not.toContain('Pedro Gómez');
    });

    it('should restrict Encargado position to Leaders or Encargados', () => {
        const swapTarget = {
            id: 100,
            usuario_id: 2,
            posicion: 'Encargado de Puerta'
        };

        const { result } = renderHook(() =>
            useAvailableUsersForSwap(mockUsers as any, swapTarget, [], false)
        );

        const labels = result.current.map(u => u.label);
        expect(labels).toContain('María García'); // Has 'encargada' role
        expect(labels).toContain('Pedro Gómez'); // Has 'líder' role
        expect(labels).not.toContain('Juan Pérez'); // Only 'ujier'
        expect(labels).not.toContain('Ana López'); // Only 'ujier'
    });
});
