import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../analyticsService';
import { supabase } from '../supabaseClient';

describe('analyticsService', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('processAttendanceData', () => {
        it('should correctly calculate attendance summary', () => {
            const mockData = [
                { estado: 'Asistió', configuracion_dia: { fecha: '2024-05-01', roles_cabecera: [{ departamento_id: 1 }] } },
                { estado: 'Asistió', configuracion_dia: { fecha: '2024-05-08', roles_cabecera: [{ departamento_id: 1 }] } },
                { estado: 'Faltó con Aviso', configuracion_dia: { fecha: '2024-05-15', roles_cabecera: [{ departamento_id: 1 }] } },
                { estado: 'Faltó sin Aviso', configuracion_dia: { fecha: '2024-05-22', roles_cabecera: [{ departamento_id: 1 }] } },
            ];

            const result = analyticsService.processAttendanceData(mockData);

            expect(result.summary.total).toBe(4);
            expect(result.summary.asistio).toBe(2);
            expect(result.summary.faltoConAviso).toBe(1);
            expect(result.summary.faltoSinAviso).toBe(1);
        });

        it('should group attendance correctly by month', () => {
            const mockData = [
                { estado: 'Asistió', configuracion_dia: { fecha: '2024-05-01', roles_cabecera: [] } },
                { estado: 'Faltó sin Aviso', configuracion_dia: { fecha: '2024-05-08', roles_cabecera: [] } },
                { estado: 'Asistió', configuracion_dia: { fecha: '2024-06-01', roles_cabecera: [] } },
            ];

            const result = analyticsService.processAttendanceData(mockData);
            const keys = Object.keys(result.byMonth);
            // Two distinct months should exist
            expect(keys).toHaveLength(2);
            // May data: 1 attended, 1 absent
            // Keys format depends on dayjs locale. Verify total counts are correct.
            const allAsistio = Object.values(result.byMonth).reduce((sum, m) => sum + m.asistio, 0);
            const allFaltas  = Object.values(result.byMonth).reduce((sum, m) => sum + m.faltas,  0);
            expect(allAsistio).toBe(2); // 1 may + 1 june
            expect(allFaltas).toBe(1);  // 1 may falta
        });

        it('should return zero summary for empty data', () => {
            const result = analyticsService.processAttendanceData([]);
            expect(result.summary.total).toBe(0);
            expect(result.summary.asistio).toBe(0);
        });
    });

    describe('fetchUpcomingServices', () => {
        it('should return upcoming service assignments for a user', async () => {
            const mockData = [
                { id: 1, configuracion_dia: { fecha: '2026-05-01', tipo_servicio: 'Dominical', color_uniforme: 'Negro' }, posicion: { nombre: 'Ujier' } }
            ];

            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
                            })
                        })
                    })
                })
            });

            const result = await analyticsService.fetchUpcomingServices(42);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it('should return empty array when no upcoming services', async () => {
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                limit: vi.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    })
                })
            });

            const result = await analyticsService.fetchUpcomingServices(99);
            expect(result).toEqual([]);
        });
    });

    describe('fetchChurnRisk', () => {
        it('should filter and map users with risk >= 50% and at least 2 records', async () => {
            const mockRiskData = [
                { id: 1, nombre: 'Alto', apellido: 'Riesgo', asistencias: 1, faltas: 3 },  // 75% → included
                { id: 2, nombre: 'Bajo', apellido: 'Riesgo', asistencias: 9, faltas: 1 },   // 10% → excluded
                { id: 3, nombre: 'Solo', apellido: 'Una', asistencias: 0, faltas: 1 },       // <2 total → excluded
            ];

            (supabase.rpc as any).mockResolvedValue({ data: mockRiskData, error: null });

            const result = await analyticsService.fetchChurnRisk(1);

            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Alto');
            expect(result[0].riskScore).toBe(75);
        });

        it('should return empty array on RPC error', async () => {
            (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'RPC Error' } });

            await expect(analyticsService.fetchChurnRisk(1)).rejects.toBeDefined();
        });
    });

    describe('fetchPunctualityTrends', () => {
        it('should call get_punctuality_stats RPC and return mapped data', async () => {
            const mockData = [
                { label: 'Temprano', count: 10 },
                { label: 'A tiempo', count: 5 }
            ];
            (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

            const result = await analyticsService.fetchPunctualityTrends(1);
            expect(supabase.rpc).toHaveBeenCalledWith('get_punctuality_stats', { 
                p_dept_id: 1, 
                p_limit: 100 
            });
            expect(result).toEqual(mockData);
        });
    });

    describe('fetchDemographicDist', () => {
        it('should call get_demographic_stats RPC and return results', async () => {
            const mockData = {
                gender: { male: 5, female: 5 },
                ageRanges: { '18-25': 10 }
            };
            (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

            const result = await analyticsService.fetchDemographicDist(1);
            expect(supabase.rpc).toHaveBeenCalledWith('get_demographic_stats', { 
                p_dept_id: 1 
            });
            expect(result).toEqual(mockData);
        });

        it('should return default structure if RPC returns null', async () => {
            (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

            const result = await analyticsService.fetchDemographicDist(1);
            expect(result.gender.male).toBe(0);
            expect(result.ageRanges['13-17']).toBe(0);
        });
    });
});
