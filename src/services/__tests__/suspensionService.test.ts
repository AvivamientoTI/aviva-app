import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suspensionService } from '../suspensionService';
import { supabase } from '../supabaseClient';

describe('suspensionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock behaviors
        (supabase.rpc as any).mockResolvedValue({ data: null, error: null });
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        });
    });

    describe('isUserSuspended', () => {
        it('should return true when user has an active suspension', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ count: 1, error: null })
            });

            const result = await suspensionService.isUserSuspended(1, '2024-06-15');
            expect(result).toBe(true);
        });

        it('should return false when user has no active suspension', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ count: 0, error: null })
            });

            const result = await suspensionService.isUserSuspended(1, '2024-06-15');
            expect(result).toBe(false);
        });

        it('should throw error when Supabase returns an error', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })
            });

            await expect(suspensionService.isUserSuspended(1, '2024-06-15')).rejects.toEqual({ message: 'DB error' });
        });
    });

    describe('getAllSuspensions', () => {
        it('should return list of suspensions', async () => {
            const mockData = [
                { id: 1, usuario_id: 10, fecha_inicio: '2024-06-01', fecha_fin: '2024-06-30', motivo: 'Falta', usuario: { nombre: 'Juan', apellido: 'Pérez' } }
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await suspensionService.getAllSuspensions();
            expect(result).toHaveLength(1);
            expect(result[0].usuario_id).toBe(10);
        });

        it('should return empty array when no suspensions', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null })
            });

            const result = await suspensionService.getAllSuspensions();
            expect(result).toEqual([]);
        });
    });

    describe('getActiveSuspensions', () => {
        it('should return only active suspensions (fecha_fin >= today)', async () => {
            const mockData = [
                { id: 2, usuario_id: 5, fecha_inicio: '2026-04-01', fecha_fin: '2026-04-30', motivo: 'Activa', usuario: { nombre: 'Ana', apellido: 'López' } }
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await suspensionService.getActiveSuspensions();
            expect(result).toHaveLength(1);
            expect(result[0].motivo).toBe('Activa');
        });
    });

    describe('endSuspension', () => {
        it('should call end_suspension RPC', async () => {
            const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ error: null } as any);

            await suspensionService.endSuspension(1);
            
            expect(rpcSpy).toHaveBeenCalledWith('end_suspension', { p_suspension_id: 1 });
        });

        it('should throw error when RPC fails', async () => {
            vi.spyOn(supabase, 'rpc').mockResolvedValue({ error: { message: 'RPC Error' } as any } as any);

            await expect(suspensionService.endSuspension(1)).rejects.toEqual({ message: 'RPC Error' });
        });
    });

    describe('create', () => {
        it('should insert a new suspension record', async () => {
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockReturnValue({ insert: insertMock });
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

            await suspensionService.create({
                usuario_id: 3,
                fecha_inicio: '2026-05-01',
                fecha_fin: '2026-05-31',
                tipo: 'suspension',
                motivo: 'Test'
            } as any);

            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                usuario_id: 3,
                created_by: 'user-1'
            }));
        });

        it('should throw when insert fails', async () => {
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
            });
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

            await expect(suspensionService.create({
                usuario_id: 3,
                fecha_inicio: '2026-05-01',
                fecha_fin: '2026-05-31',
                tipo: 'suspension',
                motivo: 'Test'
            } as any)).rejects.toEqual({ message: 'Insert failed' });
        });
    });
});
