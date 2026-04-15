import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suspensionService } from '../suspensionService';
import { supabase } from '../supabaseClient';

describe('suspensionService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('isUserSuspended', () => {
        it('should return true when user has an active suspension', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        lte: vi.fn().mockReturnValue({
                            gte: vi.fn().mockResolvedValue({ count: 1, error: null })
                        })
                    })
                })
            });

            const result = await suspensionService.isUserSuspended(1, '2024-06-15');
            expect(result).toBe(true);
        });

        it('should return false when user has no active suspension', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        lte: vi.fn().mockReturnValue({
                            gte: vi.fn().mockResolvedValue({ count: 0, error: null })
                        })
                    })
                })
            });

            const result = await suspensionService.isUserSuspended(1, '2024-06-15');
            expect(result).toBe(false);
        });

        it('should throw error when Supabase returns an error', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        lte: vi.fn().mockReturnValue({
                            gte: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })
                        })
                    })
                })
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
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockData, error: null })
                })
            });

            const result = await suspensionService.getAllSuspensions();
            expect(result).toHaveLength(1);
            expect(result[0].usuario_id).toBe(10);
        });

        it('should return empty array when no suspensions', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null })
                })
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
                select: vi.fn().mockReturnValue({
                    gte: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
                    })
                })
            });

            const result = await suspensionService.getActiveSuspensions();
            expect(result).toHaveLength(1);
            expect(result[0].motivo).toBe('Activa');
        });
    });

    describe('endSuspension', () => {
        it('should DELETE suspension when it starts today or in the future', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const deleteMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            // First call: select to fetch fecha_inicio
            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { fecha_inicio: tomorrowStr }, error: null })
                        })
                    })
                })
                // Second call: delete
                .mockReturnValueOnce({ delete: deleteMock });

            await suspensionService.endSuspension(1);
            expect(deleteMock).toHaveBeenCalled();
        });

        it('should UPDATE fecha_fin when suspension started in the past', async () => {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const lastWeekStr = lastWeek.toISOString().split('T')[0];

            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { fecha_inicio: lastWeekStr }, error: null })
                        })
                    })
                })
                .mockReturnValueOnce({ update: updateMock });

            await suspensionService.endSuspension(2);
            expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ fecha_fin: expect.any(String) }));
        });
    });

    describe('create', () => {
        it('should insert a new suspension record', async () => {
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockReturnValue({ insert: insertMock });

            await suspensionService.create({
                usuario_id: 3,
                fecha_inicio: '2026-05-01',
                fecha_fin: '2026-05-31',
                motivo: 'Test'
            });

            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 3 }));
        });

        it('should throw when insert fails', async () => {
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
            });

            await expect(suspensionService.create({
                usuario_id: 3,
                fecha_inicio: '2026-05-01',
                fecha_fin: '2026-05-31',
                motivo: 'Test'
            })).rejects.toEqual({ message: 'Insert failed' });
        });
    });
});
