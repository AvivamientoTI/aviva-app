import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../analyticsService';
import { supabase } from '../supabaseClient';
import { ATTENDANCE_STATES } from '../../constants/attendance';
import dayjs from 'dayjs';

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

        it('should ignore incomplete records without attendance status', () => {
            const mockData = [
                { estado: ATTENDANCE_STATES.ASISTIO, configuracion_dia: { fecha: '2026-05-27', roles_cabecera: [] } },
                { estado: null, configuracion_dia: { fecha: '2026-05-27', roles_cabecera: [] } },
                { estado: null, configuracion_dia: { fecha: '2026-05-27', roles_cabecera: [] } },
            ];

            const result = analyticsService.processAttendanceData(mockData);

            expect(result.summary.total).toBe(1);
            expect(result.summary.asistio).toBe(1);
            expect(Object.values(result.byMonth).reduce((sum, m) => sum + m.faltas, 0)).toBe(0);
        });
    });

    describe('fetchGlobalStats', () => {
        it('agrupa por departamento usando la forma de objeto (M2O) de roles_cabecera', async () => {
            // PostgREST devuelve roles_cabecera como OBJETO (no array) porque el FK
            // rol_cabecera_id vive en configuracion_dia (relación muchos-a-uno).
            const mockDepts = [
                { id: 1, nombre: 'Servidores' },
                { id: 2, nombre: 'Sonido' },
            ];
            const mockAttendance = [
                { estado: 'Asistió', usuario_id: 10, configuracion_dia: { fecha: '2026-05-01', roles_cabecera: { departamento_id: 1 } } },
                { estado: 'Asistió', usuario_id: 11, configuracion_dia: { fecha: '2026-05-08', roles_cabecera: { departamento_id: 1 } } },
                { estado: 'Faltó sin Aviso', usuario_id: 10, configuracion_dia: { fecha: '2026-05-15', roles_cabecera: { departamento_id: 1 } } },
                { estado: 'Faltó sin Aviso', usuario_id: 20, configuracion_dia: { fecha: '2026-05-01', roles_cabecera: { departamento_id: 2 } } },
            ];

            (supabase.from as any)
                .mockReturnValueOnce({
                    select: vi.fn().mockResolvedValue({ data: mockDepts, error: null }),
                })
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                range: vi.fn().mockResolvedValue({ data: mockAttendance, error: null }),
                            }),
                        }),
                    }),
                });

            const result = await analyticsService.fetchGlobalStats();
            const servidores = result.find(d => d.id === 1)!;
            const sonido = result.find(d => d.id === 2)!;

            // Dept 1: 2 de 3 presentes => 67%, 2 servidores únicos (10, 11)
            expect(servidores.attendanceRate).toBe(67);
            expect(servidores.totalServers).toBe(2);
            // Dept 2: 0 de 1 presente => 0%, 1 servidor
            expect(sonido.attendanceRate).toBe(0);
            expect(sonido.totalServers).toBe(1);
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
            // Raw attendance records: user 1 has 1 present + 3 absent = 75% risk
            const mockAttendance = [
                { usuario_id: 1, estado: 'Asistió', usuario: { nombre: 'Alto', apellido: 'Riesgo' }, configuracion_dia: { fecha: '2026-01-01', roles_cabecera: [{ departamento_id: 1 }] } },
                { usuario_id: 1, estado: 'Faltó sin Aviso', usuario: { nombre: 'Alto', apellido: 'Riesgo' }, configuracion_dia: { fecha: '2026-01-08', roles_cabecera: [{ departamento_id: 1 }] } },
                { usuario_id: 1, estado: 'Faltó sin Aviso', usuario: { nombre: 'Alto', apellido: 'Riesgo' }, configuracion_dia: { fecha: '2026-01-15', roles_cabecera: [{ departamento_id: 1 }] } },
                { usuario_id: 1, estado: 'Faltó sin Aviso', usuario: { nombre: 'Alto', apellido: 'Riesgo' }, configuracion_dia: { fecha: '2026-01-22', roles_cabecera: [{ departamento_id: 1 }] } },
                // User 2: 9 present + 1 absent = 10% risk (excluded)
                ...Array.from({ length: 9 }, (_, i) => ({ usuario_id: 2, estado: 'Asistió', usuario: { nombre: 'Bajo', apellido: 'Riesgo' }, configuracion_dia: { fecha: `2026-01-0${i + 1}`, roles_cabecera: [{ departamento_id: 1 }] } })),
                { usuario_id: 2, estado: 'Faltó sin Aviso', usuario: { nombre: 'Bajo', apellido: 'Riesgo' }, configuracion_dia: { fecha: '2026-02-01', roles_cabecera: [{ departamento_id: 1 }] } },
                // User 3: only 1 record (excluded, < 2 total)
                { usuario_id: 3, estado: 'Faltó sin Aviso', usuario: { nombre: 'Solo', apellido: 'Una' }, configuracion_dia: { fecha: '2026-01-01', roles_cabecera: [{ departamento_id: 1 }] } },
            ];

            (supabase.from as any).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                range: vi.fn().mockResolvedValue({ data: mockAttendance, error: null })
                            })
                        })
                    })
                })
            });

            const result = await analyticsService.fetchChurnRisk(1);

            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Alto');
            expect(result[0].riskScore).toBe(75);
        });

        it('should throw on query error', async () => {
            (supabase.from as any).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
                            })
                        })
                    })
                })
            });

            await expect(analyticsService.fetchChurnRisk(1)).rejects.toBeDefined();
        });
    });

    describe('fetchPunctualityTrends', () => {
        it('should group attendance records by estado and return counts', async () => {
            const recent = (daysAgo: number) => dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD');
            const mockAttendance = [
                { estado: 'Asistió', configuracion_dia: { fecha: recent(1), roles_cabecera: { departamento_id: 1 } } },
                { estado: 'Asistió', configuracion_dia: { fecha: recent(8), roles_cabecera: { departamento_id: 1 } } },
                { estado: 'Faltó sin Aviso', configuracion_dia: { fecha: recent(15), roles_cabecera: { departamento_id: 1 } } },
                // Fuera de la ventana de 3 meses: la descarga compartida lo trae, pero se filtra en memoria.
                { estado: 'Asistió', configuracion_dia: { fecha: recent(200), roles_cabecera: { departamento_id: 1 } } },
            ];

            (supabase.from as any).mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                range: vi.fn().mockResolvedValue({ data: mockAttendance, error: null })
                            })
                        })
                    })
                })
            });

            const result = await analyticsService.fetchPunctualityTrends(1);
            const asistio = result.find(r => r.label === 'Asistió');
            const falto = result.find(r => r.label === 'Faltó sin Aviso');
            expect(asistio?.count).toBe(2);
            expect(falto?.count).toBe(1);
        });
    });

    describe('descarga compartida del departamento', () => {
        const makeRows = (n: number) => Array.from({ length: n }, (_, i) => ({
            estado: i % 2 === 0 ? 'Asistió' : 'Faltó sin Aviso',
            configuracion_dia: {
                fecha: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                roles_cabecera: { departamento_id: 7 },
            },
        }));

        // Simula PostgREST: devuelve la porción pedida con `.range(from, to)` y el total en `count`.
        const mockPagedTable = (rows: any[]) => {
            const range = vi.fn().mockImplementation((from: number, to: number) =>
                Promise.resolve({ data: rows.slice(from, to + 1), error: null, count: rows.length })
            );
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({ range })
                        })
                    })
                })
            });
            return range;
        };

        it('pide las páginas restantes en paralelo y no pierde filas', async () => {
            const range = mockPagedTable(makeRows(2500));

            const stats = await analyticsService.fetchAttendanceStats(7, 'YTD');

            expect(stats.summary.total).toBe(2500);
            expect(range).toHaveBeenCalledTimes(3);
            expect(range.mock.calls.map(c => c[0]).sort((a, b) => a - b)).toEqual([0, 1000, 2000]);
        });

        it('vistas simultáneas del mismo departamento comparten una sola descarga', async () => {
            const range = mockPagedTable(makeRows(1500));

            const [monthly, weekly, annual, punctuality] = await Promise.all([
                analyticsService.fetchAttendanceStats(7, 'YTD'),
                analyticsService.fetchWeeklyStats(7),
                analyticsService.fetchAnnualStats(7),
                analyticsService.fetchPunctualityTrends(7),
            ]);

            expect(range).toHaveBeenCalledTimes(2);
            expect(monthly.summary.total).toBe(1500);
            expect(weekly.reduce((acc: number, w: any) => acc + w.total, 0)).toBe(1500);
            expect(annual.totalServices).toBe(750);
            expect(punctuality.reduce((acc, p) => acc + p.count, 0)).toBe(1500);
        });

        it('no reutiliza datos ya terminados: una consulta posterior vuelve a la base', async () => {
            const range = mockPagedTable(makeRows(10));

            await analyticsService.fetchAttendanceStats(7, 'YTD');
            await analyticsService.fetchAttendanceStats(7, 'YTD');

            expect(range).toHaveBeenCalledTimes(2);
        });
    });

    describe('fetchDemographicDist', () => {
        it('should query members then users and return gender/age distribution', async () => {
            const mockMembers = [{ usuario_id: 1 }, { usuario_id: 2 }];
            const mockUsers = [
                { genero: 'Masculino', fecha_nacimiento: '2000-01-01' },
                { genero: 'Femenino', fecha_nacimiento: '1995-06-15' },
            ];

            // Code calls from('usuarios') first (query builder), then from('membresias')
            const usuariosChain = {
                select: vi.fn(),
                in: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
            };
            usuariosChain.select.mockReturnValue(usuariosChain);

            (supabase.from as any)
                .mockReturnValueOnce(usuariosChain)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null })
                    })
                });

            const result = await analyticsService.fetchDemographicDist(1);
            expect(result.gender.male).toBe(1);
            expect(result.gender.female).toBe(1);
        });

        it('should return default structure if members return empty', async () => {
            // When ids.length === 0, the usuarios query is awaited directly without .in()
            const usuariosChain: any = { select: vi.fn() };
            usuariosChain.select.mockReturnValue(
                Promise.resolve({ data: [], error: null })
            );

            (supabase.from as any)
                .mockReturnValueOnce(usuariosChain)
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                });

            const result = await analyticsService.fetchDemographicDist(1);
            expect(result.gender.male).toBe(0);
            expect(result.ageRanges['13-17']).toBe(0);
        });
    });
});
