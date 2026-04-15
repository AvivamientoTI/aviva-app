import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';

// Mock UserContext
vi.mock('../../contexts/UserContext', () => ({
    useUser: vi.fn()
}));

// Mock departments constant
vi.mock('../../constants/departments', () => ({
    DEPARTMENTS: {
        SERVIDORES: 'Servidores',
        CONSOLIDACIÓN: 'Consolidación',
        ADMINISTRACION: 'Administración'
    }
}));

import { useUser } from '../../contexts/UserContext';

const makeMembresia = (deptId: number, deptName: string, rol: string) => ({
    id: Math.random(),
    usuario_id: 1,
    departamento_id: deptId,
    rol_jerarquico: rol,
    departamento: { id: deptId, nombre: deptName }
});

describe('usePermissions', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('isSystemAdmin', () => {
        it('should be true when user has Admin role in Administración', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(99, 'Administración', 'Admin')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isSystemAdmin).toBe(true);
        });

        it('should be false when user is Líder but not Admin', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(1, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isSystemAdmin).toBe(false);
        });

        it('should be false when memberships is empty', () => {
            (useUser as any).mockReturnValue({ userMemberships: [] });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isSystemAdmin).toBe(false);
        });

        it('should be false when userMemberships is undefined', () => {
            (useUser as any).mockReturnValue({ userMemberships: undefined });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isSystemAdmin).toBe(false);
        });
    });

    describe('canManageDepartment', () => {
        it('Admin can manage any department', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(99, 'Administración', 'Admin')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageDepartment(1)).toBe(true);
            expect(result.current.canManageDepartment(999)).toBe(true);
        });

        it('Líder can manage their own department', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(5, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageDepartment(5)).toBe(true);
        });

        it('Líder cannot manage a different department', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(5, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageDepartment(99)).toBe(false);
        });

        it('Sublíder can manage their department', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(3, 'Consolidación', 'Sublíder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageDepartment(3)).toBe(true);
        });

        it('Servidor cannot manage any department', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(5, 'Servidores', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageDepartment(5)).toBe(false);
        });
    });

    describe('canManageUsers', () => {
        it('should be true for Admin', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(99, 'Administración', 'Admin')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageUsers).toBe(true);
        });

        it('should be true for Líder', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(1, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageUsers).toBe(true);
        });

        it('should be false for Servidor', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(1, 'Servidores', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageUsers).toBe(false);
        });
    });

    describe('canManageAttendance', () => {
        it('Encargado in Servidores can manage attendance', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(2, 'Servidores', 'Encargado')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageAttendance(2)).toBe(true);
        });

        it('Líder in Servidores can manage attendance', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(2, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageAttendance(2)).toBe(true);
        });

        it('Líder in non-Servidores dept cannot manage attendance', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(3, 'Consolidación', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageAttendance(3)).toBe(false);
        });

        it('Servidor cannot manage attendance', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(2, 'Servidores', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageAttendance(2)).toBe(false);
        });

        it('should return false when deptId is null', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(2, 'Servidores', 'Líder')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canManageAttendance(null)).toBe(false);
        });
    });

    describe('canViewAllSchedules', () => {
        it('Admin can view all schedules', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(99, 'Administración', 'Admin')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canViewAllSchedules).toBe(true);
        });

        it('Servidor cannot view all schedules', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(1, 'Servidores', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.canViewAllSchedules).toBe(false);
        });
    });

    describe('isServidoresMember', () => {
        it('should be true when user is a member of Servidores', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(2, 'Servidores', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isServidoresMember).toBe(true);
        });

        it('should be false when user is only in Consolidación', () => {
            (useUser as any).mockReturnValue({
                userMemberships: [makeMembresia(3, 'Consolidación', 'Servidor')]
            });
            const { result } = renderHook(() => usePermissions());
            expect(result.current.isServidoresMember).toBe(false);
        });
    });
});
