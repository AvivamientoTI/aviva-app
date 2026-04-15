import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attendanceService } from '../attendanceService';
import { supabase } from '../supabaseClient';

describe('attendanceService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('fetchDeptMembers', () => {
        it('should return members grouped by user (merging multiple roles)', async () => {
            const mockData = [
                { usuario_id: 1, rol_jerarquico: 'Servidor', usuario: { id: 1, nombre: 'Juan', apellido: 'Pérez', genero: 'M' } },
                { usuario_id: 1, rol_jerarquico: 'Encargado', usuario: { id: 1, nombre: 'Juan', apellido: 'Pérez', genero: 'M' } },
                { usuario_id: 2, rol_jerarquico: 'Servidora', usuario: { id: 2, nombre: 'María', apellido: 'García', genero: 'F' } },
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockData, error: null })
                })
            });

            const result = await attendanceService.fetchDeptMembers(1);

            // Juan has 2 memberships - should be merged into 1 entry
            expect(result).toHaveLength(2);
            const juan = result.find(m => m.nombre === 'Juan');
            expect(juan).toBeDefined();
            expect(juan?.roles).toContain('servidor');
            expect(juan?.roles).toContain('encargado');
        });

        it('should return empty array when no members', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null })
                })
            });

            const result = await attendanceService.fetchDeptMembers(99);
            expect(result).toEqual([]);
        });

        it('should throw when there is a Supabase error', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error de BD' } })
                })
            });

            await expect(attendanceService.fetchDeptMembers(1)).rejects.toEqual({ message: 'Error de BD' });
        });
    });

    describe('fetchAttendance', () => {
        it('should return attendance records for a given config day', async () => {
            const mockRecords = [
                { id: 1, configuracion_dia_id: 10, usuario_id: 1, estado: 'Asistió' },
                { id: 2, configuracion_dia_id: 10, usuario_id: 2, estado: 'Faltó sin Aviso' },
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null })
                })
            });

            const result = await attendanceService.fetchAttendance(10);
            expect(result).toHaveLength(2);
            expect(result[0].estado).toBe('Asistió');
            expect(result[1].estado).toBe('Faltó sin Aviso');
        });

        it('should return empty array when no records', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: null })
                })
            });

            const result = await attendanceService.fetchAttendance(10);
            expect(result).toEqual([]);
        });
    });
});
