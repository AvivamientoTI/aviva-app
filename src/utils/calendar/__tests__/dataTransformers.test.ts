import { describe, it, expect } from 'vitest';
import { groupAssignmentsByDate, transformToCalendarEvents } from '../dataTransformers';
import type { TransformerAssignment } from '../transformerTypes';

// ── Factory ──────────────────────────────────────────────────────────────────

function makeAssignment(
    overrides: Partial<TransformerAssignment> & {
        fecha?: string; userId?: number; configId?: number;
        positionName?: string | null; orden?: number; serviceIndex?: number;
    } = {}
): TransformerAssignment {
    const { fecha = '2026-05-04', userId = 1, configId = 100, positionName = 'Ujier', orden = 10, serviceIndex = 0, ...rest } = overrides as any;
    return {
        id: userId * 100 + configId,
        usuario_id: userId,
        configuracion_dia_id: configId,
        posicion: positionName ? { nombre: positionName, orden } : null,
        usuario: { nombre: `User${userId}`, apellido: 'Test', genero: 'M' },
        configuracion_dia: {
            id: configId,
            fecha,
            tipo_servicio: 'Dominical',
            color_uniforme: 'Negro',
            hora_llegada: '08:00',
            service_index: serviceIndex,
            encargado: null,
        },
        roles_cabecera: [{ departamento_id: 5, departamento: { nombre: 'Servidores' } }],
        ...rest,
    } as any;
}

// ── groupAssignmentsByDate ───────────────────────────────────────────────────

describe('groupAssignmentsByDate', () => {
    it('returns empty object for empty array', () => {
        expect(groupAssignmentsByDate([])).toEqual({});
    });

    it('returns empty object for null/undefined', () => {
        expect(groupAssignmentsByDate(null as any)).toEqual({});
        expect(groupAssignmentsByDate(undefined as any)).toEqual({});
    });

    it('groups assignments by date key', () => {
        const result = groupAssignmentsByDate([
            makeAssignment({ fecha: '2026-05-04', userId: 1 }),
            makeAssignment({ fecha: '2026-05-11', userId: 2, configId: 200 }),
            makeAssignment({ fecha: '2026-05-04', userId: 3 }),
        ]);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result['2026-05-04'].allAssignments).toHaveLength(2);
        expect(result['2026-05-11'].allAssignments).toHaveLength(1);
    });

    it('produces one ServiceGroup per configuracion_dia_id', () => {
        const result = groupAssignmentsByDate([
            makeAssignment({ userId: 1, configId: 100 }),
            makeAssignment({ userId: 2, configId: 100 }),
        ]);
        expect(result['2026-05-04'].services).toHaveLength(1);
    });

    it('separates two services on the same date into separate ServiceGroups', () => {
        const result = groupAssignmentsByDate([
            makeAssignment({ userId: 1, configId: 100, serviceIndex: 0 }),
            makeAssignment({ userId: 2, configId: 101, serviceIndex: 1 }),
        ]);
        expect(result['2026-05-04'].services).toHaveLength(2);
    });

    it('sorts services by service_index ascending', () => {
        const result = groupAssignmentsByDate([
            makeAssignment({ userId: 2, configId: 101, serviceIndex: 1 }),
            makeAssignment({ userId: 1, configId: 100, serviceIndex: 0 }),
        ]);
        expect(result['2026-05-04'].services[0].service_index).toBe(0);
        expect(result['2026-05-04'].services[1].service_index).toBe(1);
    });

    it('sorts assignments within a service by orden', () => {
        const result = groupAssignmentsByDate([
            makeAssignment({ userId: 1, orden: 5 }),
            makeAssignment({ userId: 2, orden: 1 }),
            makeAssignment({ userId: 3, orden: 3 }),
        ]);
        const ids = result['2026-05-04'].services[0].assignments.map(a => a.usuario_id);
        expect(ids).toEqual([2, 3, 1]);
    });

    it('includes servicio, uniforme and hora_llegada on each ServiceGroup', () => {
        const result = groupAssignmentsByDate([makeAssignment()]);
        const svc = result['2026-05-04'].services[0];
        expect(svc.servicio).toBe('Dominical');
        expect(svc.uniforme).toBe('Negro');
        expect(svc.hora_llegada).toBe('08:00');
    });

    it('includes encargado name when present', () => {
        const a = makeAssignment();
        (a.configuracion_dia as any).encargado = { id: 99, nombre: 'Pedro', apellido: 'López' };
        const result = groupAssignmentsByDate([a]);
        expect(result['2026-05-04'].services[0].encargado).toBe('Pedro López');
        expect(result['2026-05-04'].services[0].encargado_id).toBe(99);
    });

    it('sets encargado to null when absent', () => {
        const result = groupAssignmentsByDate([makeAssignment()]);
        expect(result['2026-05-04'].services[0].encargado).toBeNull();
    });

    it('skips assignments without fecha', () => {
        const a = makeAssignment();
        (a.configuracion_dia as any).fecha = undefined;
        expect(Object.keys(groupAssignmentsByDate([a]))).toHaveLength(0);
    });

    it('handles posicion as array', () => {
        const a = makeAssignment({ positionName: null });
        (a as any).posicion = [{ nombre: 'Portero', orden: 2 }];
        const result = groupAssignmentsByDate([a]);
        expect(result['2026-05-04'].services[0].assignments[0].posicion).toBe('Portero');
    });

    it('uses "Sin posición" when posicion is null', () => {
        const a = makeAssignment({ positionName: null });
        (a as any).posicion = null;
        const result = groupAssignmentsByDate([a]);
        expect(result['2026-05-04'].services[0].assignments[0].posicion).toBe('Sin posición');
    });

    it('keeps both entries when same user appears twice in same department (different positions)', () => {
        // Same user, same dept, different positions — both are valid assignments
        const a1 = makeAssignment({ userId: 7, positionName: 'Puerta' });
        const a2 = { ...makeAssignment({ userId: 7, positionName: 'Altar' }), id: 702 };
        const result = groupAssignmentsByDate([a1, a2 as any]);
        const user7Count = result['2026-05-04'].allAssignments.filter(a => a.usuario_id === 7).length;
        expect(user7Count).toBe(2);
    });

    it('prefers higher-priority department (Servicio General > Servidores) for same user', () => {
        const a1 = makeAssignment({ userId: 7, configId: 100 });
        (a1 as any).roles_cabecera = [{ departamento_id: 10, departamento: { nombre: 'Servidores' } }];

        const a2 = makeAssignment({ userId: 7, configId: 100 });
        (a2 as any).id = 702;
        (a2 as any).roles_cabecera = [{ departamento_id: 20, departamento: { nombre: 'Servicio General' } }];

        const result = groupAssignmentsByDate([a1, a2 as any]);
        expect(result['2026-05-04'].allAssignments).toHaveLength(1);
    });

    it('builds correct CalendarAssignment fields', () => {
        const result = groupAssignmentsByDate([makeAssignment({ userId: 5 })]);
        const asig = result['2026-05-04'].allAssignments[0];
        expect(asig.nombre).toBe('User5 Test');
        expect(asig.posicion).toBe('Ujier');
        expect(asig.uniforme).toBe('Negro');
        expect(asig.servicio).toBe('Dominical');
        expect(asig.hora_llegada).toBe('08:00');
    });
});

// ── transformToCalendarEvents ────────────────────────────────────────────────

describe('transformToCalendarEvents', () => {
    it('returns empty array for empty input', () => {
        expect(transformToCalendarEvents([])).toEqual([]);
    });

    it('maps each assignment to a CalendarEvent', () => {
        const events = transformToCalendarEvents([
            makeAssignment({ userId: 1, positionName: 'Ujier' }),
            makeAssignment({ userId: 2, configId: 200, positionName: 'Monitor' }),
        ]);
        expect(events).toHaveLength(2);
        expect(events[0].title).toContain('User1');
        expect(events[0].title).toContain('Ujier');
    });

    it('sets allDay to true', () => {
        const events = transformToCalendarEvents([makeAssignment()]);
        expect(events[0].allDay).toBe(true);
    });

    it('builds start/end Dates from fecha', () => {
        const events = transformToCalendarEvents([makeAssignment({ fecha: '2026-05-04' })]);
        expect(events[0].start).toBeInstanceOf(Date);
        expect(events[0].start.toISOString()).toContain('2026-05-04');
    });

    it('preserves original assignment in resource', () => {
        const a = makeAssignment();
        expect(transformToCalendarEvents([a])[0].resource).toBe(a);
    });

    it('handles missing usuario gracefully', () => {
        const a = makeAssignment();
        (a as any).usuario = null;
        const events = transformToCalendarEvents([a]);
        expect(events[0].title).toBeDefined();
    });

    it('includes position from posicion array in title', () => {
        const a = makeAssignment({ positionName: null });
        (a as any).posicion = [{ nombre: 'Portero', orden: 1 }];
        expect(transformToCalendarEvents([a])[0].title).toContain('Portero');
    });

    it('falls back to current date when fecha is missing', () => {
        const a = makeAssignment();
        (a.configuracion_dia as any).fecha = undefined;
        const events = transformToCalendarEvents([a]);
        expect(events[0].start).toBeInstanceOf(Date);
    });
});
