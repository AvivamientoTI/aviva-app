import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recommendationService } from '../recommendationService';
import { supabase } from '../supabaseClient';
import { suspensionService } from '../suspensionService';

vi.mock('../suspensionService', () => ({
    suspensionService: {
        getAllSuspensions: vi.fn()
    }
}));

// Helper to build a member mock row
const makeMember = (userId: number, rol: string, genero: 'M' | 'F' = 'M') => ({
    usuario_id: userId,
    rol_jerarquico: rol,
    usuario: { id: userId, nombre: `User${userId}`, apellido: 'Test', genero }
});

// Helper to build the supabase chain for a specific call sequence
const buildFromChain = (data: any, error: any = null) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error })
});

describe('recommendationService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('getRecommendations — hard filters', () => {
        it('should exclude suspended users', async () => {
            const members = [makeMember(1, 'Servidor'), makeMember(2, 'Servidor')];

            // Members fetch
            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                // Busy assignments
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                // History
                .mockReturnValueOnce(buildFromChain(null));

            // User 1 is suspended
            (suspensionService.getAllSuspensions as any).mockResolvedValue([
                { usuario_id: 1, fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' }
            ]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            const ids = result.map(c => c.id);

            expect(ids).not.toContain(1);
            expect(ids).toContain(2);
        });

        it('should exclude users already assigned on that date', async () => {
            const members = [makeMember(10, 'Servidor'), makeMember(20, 'Servidor')];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                // User 10 is busy
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [{ usuario_id: 10 }], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(null));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            const ids = result.map(c => c.id);

            expect(ids).not.toContain(10);
            expect(ids).toContain(20);
        });

        it('should filter by gender when positionRequiresGender is set', async () => {
            const members = [
                makeMember(1, 'Servidor', 'M'),
                makeMember(2, 'Servidora', 'F'),
                makeMember(3, 'Servidor', 'M')
            ];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(null));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5, { positionRequiresGender: 'F' });
            const ids = result.map(c => c.id);

            expect(ids).toContain(2);
            expect(ids).not.toContain(1);
            expect(ids).not.toContain(3);
        });

        it('should return empty array when members list is empty', async () => {
            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(null));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result).toEqual([]);
        });

        it('should throw when members fetch fails', async () => {
            (supabase.from as any).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
                })
            });

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            await expect(
                recommendationService.getRecommendations('2026-04-14', 5)
            ).rejects.toEqual({ message: 'DB Error' });
        });
    });

    describe('getRecommendations — scoring', () => {
        const setupSingleCandidate = (userId: number, rol: string, historyData: any = null) => {
            const members = [makeMember(userId, rol)];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(historyData));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);
        };

        it('should boost score for user who has not served recently (no history)', async () => {
            setupSingleCandidate(1, 'Servidor', null);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result).toHaveLength(1);
            // No history → score gets +25 bonus, so score > 100
            expect(result[0].matchReasons.some(r => r.includes('No ha servido'))).toBe(true);
        });

        it('should boost leaders for leadership positions', async () => {
            const members = [
                makeMember(1, 'Líder'),
                makeMember(2, 'Servidor')
            ];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(null));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5, { positionRequiresLeadership: true });

            // Líder should appear before Servidor in results
            const liderIndex = result.findIndex(c => c.id === 1);
            const servidorIndex = result.findIndex(c => c.id === 2);
            expect(liderIndex).toBeLessThan(servidorIndex);
        });

        it('should return at most 5 candidates', async () => {
            const members = Array.from({ length: 10 }, (_, i) => makeMember(i + 1, 'Servidor'));

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(null));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result.length).toBeLessThanOrEqual(5);
        });

        it('candidate score should be clamped to [0, 100] when positive penalties apply', async () => {
            // User served 3 days ago (< 7 days) → -30 penalty applied on top of base 100
            const userId = 99;
            const members = [makeMember(userId, 'Servidor')];
            // History: served 3 days ago
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 3);
            const recentDateStr = recentDate.toISOString().split('T')[0];

            const historyData = [{ usuario_id: userId, configuracion_dia: { fecha: recentDateStr } }];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: members, error: null })
                    })
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
                .mockReturnValueOnce(buildFromChain(historyData));

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result).toHaveLength(1);
            // Score should be clamped: max(0, min(100, ...))
            expect(result[0].score).toBeGreaterThanOrEqual(0);
            expect(result[0].score).toBeLessThanOrEqual(100);
        });
    });
});
