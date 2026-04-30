import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recommendationService } from '../recommendationService';
import { supabase } from '../supabaseClient';
import { suspensionService } from '../suspensionService';

vi.mock('../suspensionService', () => ({
    suspensionService: {
        getAllSuspensions: vi.fn()
    }
}));

const makeMember = (userId: number, rol: string, genero: 'M' | 'F' = 'M') => ({
    usuario_id: userId,
    rol_jerarquico: rol,
    usuario: { id: userId, nombre: `User${userId}`, apellido: 'Test', genero, activo: true }
});

// Build a full mock chain for the service's 5 supabase.from calls:
// 1. membresias (.select().eq())
// 2. asignaciones busy (.select().eq()) — via Promise.all
// 3. configuracion_dia turno (.select().eq().limit()) — via Promise.all
// 4. horarios_no_disponibilidad (.select().eq().eq())
// 5. asignaciones history (.select().gte().order())
const setupMocks = (members: any[], busyIds: number[] = [], historyData: any = null) => {
    const busyData = busyIds.map(id => ({ usuario_id: id, configuracion_dia: { fecha: '2026-04-14' } }));

    // 1. membresias
    (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: members, error: null })
        })
    });
    // 2. asignaciones (busy) — inside Promise.all
    (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: busyData, error: null })
        })
    });
    // 3. configuracion_dia (turno) — inside Promise.all
    (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
            })
        })
    });
    // 4. horarios_no_disponibilidad
    (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null })
            })
        })
    });
    // 5. asignaciones (history)
    (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: historyData, error: null })
            })
        })
    });
};

describe('recommendationService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('getRecommendations — hard filters', () => {
        it('should exclude suspended users', async () => {
            const members = [makeMember(1, 'Servidor'), makeMember(2, 'Servidor')];
            setupMocks(members);

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
            setupMocks(members, [10]);

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
            setupMocks(members);

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5, { positionRequiresGender: 'F' });
            const ids = result.map(c => c.id);

            expect(ids).toContain(2);
            expect(ids).not.toContain(1);
            expect(ids).not.toContain(3);
        });

        it('should return empty array when members list is empty', async () => {
            setupMocks([]);

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
        it('should boost score for user who has not served recently (no history)', async () => {
            setupMocks([makeMember(1, 'Servidor')], [], null);

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result).toHaveLength(1);
            expect(result[0].matchReasons.some(r => r.includes('No ha servido'))).toBe(true);
        });

        it('should boost leaders for leadership positions', async () => {
            const members = [makeMember(1, 'Líder'), makeMember(2, 'Servidor')];
            setupMocks(members);

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5, { positionRequiresLeadership: true });

            const liderIndex = result.findIndex(c => c.id === 1);
            const servidorIndex = result.findIndex(c => c.id === 2);
            expect(liderIndex).toBeLessThan(servidorIndex);
        });

        it('should return at most 8 candidates', async () => {
            const members = Array.from({ length: 15 }, (_, i) => makeMember(i + 1, 'Servidor'));
            setupMocks(members);

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result.length).toBeLessThanOrEqual(8);
        });

        it('candidate score should be clamped to [0, 100] when penalties apply', async () => {
            const userId = 99;
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 3);
            const recentDateStr = recentDate.toISOString().split('T')[0];
            const historyData = [{ usuario_id: userId, configuracion_dia: { fecha: recentDateStr } }];

            setupMocks([makeMember(userId, 'Servidor')], [], historyData);

            (suspensionService.getAllSuspensions as any).mockResolvedValue([]);

            const result = await recommendationService.getRecommendations('2026-04-14', 5);
            expect(result).toHaveLength(1);
            expect(result[0].score).toBeGreaterThanOrEqual(0);
            expect(result[0].score).toBeLessThanOrEqual(100);
        });
    });
});
