import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignmentsService } from '../assignmentsService';
import { supabase } from '../supabaseClient';

describe('assignmentsService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('fetchUsersByDate', () => {
        it('should return blocked user IDs via RPC', async () => {
            const mockData = [{ usuario_id: 1 }, { usuario_id: 2 }];
            (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

            const result = await assignmentsService.fetchUsersByDate('2024-06-01');
            expect(result).toHaveLength(2);
            expect(result[0].usuario_id).toBe(1);
        });

        it('should return empty array when no blocked users', async () => {
            (supabase.rpc as any).mockResolvedValue({ data: null, error: null });
            const result = await assignmentsService.fetchUsersByDate('2024-06-01');
            expect(result).toEqual([]);
        });

        it('should throw on RPC error', async () => {
            (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'RPC Failed' } });
            await expect(assignmentsService.fetchUsersByDate('2024-06-01')).rejects.toEqual({ message: 'RPC Failed' });
        });
    });

    describe('fetchByDepartment', () => {
        it('should return empty array when no cabeceras found', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null })
                })
            });

            const result = await assignmentsService.fetchByDepartment(1);
            expect(result).toEqual([]);
        });
    });

    describe('swap', () => {
        it('should call update on asignaciones table', async () => {
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            });

            (supabase.from as any).mockReturnValue({
                update: updateMock
            });

            await assignmentsService.swap(5, 99);
            expect(updateMock).toHaveBeenCalledWith({ usuario_id: 99 });
        });

        it('should throw if swap fails', async () => {
            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
                })
            });

            await expect(assignmentsService.swap(5, 99)).rejects.toEqual({ message: 'Update failed' });
        });
    });

    describe('delete', () => {
        it('should call delete on asignaciones table', async () => {
            const deleteMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null })
            });

            (supabase.from as any).mockReturnValue({
                delete: deleteMock
            });

            await assignmentsService.delete(7);
            expect(deleteMock).toHaveBeenCalled();
        });
    });
});
