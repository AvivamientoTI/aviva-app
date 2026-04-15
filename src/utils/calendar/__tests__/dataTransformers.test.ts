import { describe, it, expect } from 'vitest';
import { groupAssignmentsByDate, transformToCalendarEvents } from '../dataTransformers';
import type { TransformerAssignment } from '../transformerTypes';

// Minimal factory for TransformerAssignment
const makeAssignment = (
    overrides: Partial<TransformerAssignment> & { fecha?: string; userId?: number; positionName?: string; orden?: number }
): TransformerAssignment => {
    const {
        fecha = '2026-05-04',
        userId = 1,
        positionName = 'Ujier',
        orden,
        ...rest
    } = overrides as any;

    return {
        id: userId * 100,
        usuario_id: userId,
        posicion: positionName ? { nombre: positionName, orden: orden ?? 10 } : null,
        usuario: { nombre: `User${userId}`, apellido: 'Test', genero: 'M' },
        configuracion_dia: {
            fecha,
            tipo_servicio: 'Dominical',
            color_uniforme: 'Negro',
            encargado: null,
            roles_cabecera: [{ departamento_id: 5 }]
        },
        roles_cabecera: [{ departamento_id: 5, departamento: { nombre: 'Servidores' } }],
        ...rest
    } as any;
};

describe('groupAssignmentsByDate', () => {
    it('should return empty object for empty array', () => {
        expect(groupAssignmentsByDate([])).toEqual({});
    });

    it('should return empty object for null/undefined', () => {
        expect(groupAssignmentsByDate(null as any)).toEqual({});
        expect(groupAssignmentsByDate(undefined as any)).toEqual({});
    });

    it('should group assignments by their date', () => {
        const assignments = [
            makeAssignment({ fecha: '2026-05-04', userId: 1 }),
            makeAssignment({ fecha: '2026-05-11', userId: 2 }),
            makeAssignment({ fecha: '2026-05-04', userId: 3 })
        ];

        const result = groupAssignmentsByDate(assignments);

        expect(Object.keys(result)).toHaveLength(2);
        expect(result['2026-05-04'].assignments).toHaveLength(2);
        expect(result['2026-05-11'].assignments).toHaveLength(1);
    });

    it('should include service type and uniform color in group metadata', () => {
        const assignment = makeAssignment({ fecha: '2026-05-04', userId: 1 });

        const result = groupAssignmentsByDate([assignment]);

        expect(result['2026-05-04'].servicio).toBe('Dominical');
        expect(result['2026-05-04'].uniforme).toBe('Negro');
    });

    it('should include encargado name when present', () => {
        const assignment = makeAssignment({ fecha: '2026-05-04', userId: 1 });
        (assignment.configuracion_dia as any).encargado = { id: 99, nombre: 'Pedro', apellido: 'López' };

        const result = groupAssignmentsByDate([assignment]);

        expect(result['2026-05-04'].encargado).toBe('Pedro López');
        expect(result['2026-05-04'].encargado_id).toBe(99);
    });

    it('should set encargado to null when not present', () => {
        const result = groupAssignmentsByDate([makeAssignment({ fecha: '2026-05-04', userId: 1 })]);
        expect(result['2026-05-04'].encargado).toBeNull();
    });

    it('should sort assignments by orden within each date', () => {
        const a1 = makeAssignment({ fecha: '2026-05-04', userId: 1, positionName: 'Ujier', orden: 5 });
        const a2 = makeAssignment({ fecha: '2026-05-04', userId: 2, positionName: 'Encargado', orden: 1 });
        const a3 = makeAssignment({ fecha: '2026-05-04', userId: 3, positionName: 'Monitor', orden: 3 });

        // Override posicion for specific orders
        (a1.posicion as any).orden = 5;
        (a2.posicion as any).orden = 1;
        (a3.posicion as any).orden = 3;

        const result = groupAssignmentsByDate([a1, a2, a3]);
        const sorted = result['2026-05-04'].assignments.map(a => a.usuario_id);

        expect(sorted[0]).toBe(2); // orden 1
        expect(sorted[1]).toBe(3); // orden 3
        expect(sorted[2]).toBe(1); // orden 5
    });

    it('should keep only the higher-priority dept assignment when same user appears in multiple depts', () => {
        // User7 appears in two depts: Servicio General (priority 1) and Servidores (priority 2)
        const a1 = makeAssignment({ fecha: '2026-05-04', userId: 7 });
        (a1 as any).roles_cabecera = [{ departamento_id: 10, departamento: { nombre: 'Servidores' } }];

        const a2 = makeAssignment({ fecha: '2026-05-04', userId: 7 });
        a2.id = 702;
        (a2 as any).roles_cabecera = [{ departamento_id: 20, departamento: { nombre: 'Servicio General' } }];

        const result = groupAssignmentsByDate([a1, a2 as any]);
        // The higher-priority (Servicio General) should win — still 1 entry for User7
        expect(result['2026-05-04'].assignments).toHaveLength(1);
    });

    it('should skip assignment entries with no date', () => {
        const a = makeAssignment({ fecha: undefined as any, userId: 1 });
        (a.configuracion_dia as any).fecha = undefined;

        const result = groupAssignmentsByDate([a]);
        expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle posicion as array', () => {
        const a = makeAssignment({ fecha: '2026-05-04', userId: 5, positionName: 'Portero' });
        (a as any).posicion = [{ nombre: 'Portero', orden: 2 }];

        const result = groupAssignmentsByDate([a]);
        expect(result['2026-05-04'].assignments[0].posicion).toBe('Portero');
    });

    it('should use "Sin posición" when posicion is missing', () => {
        const a = makeAssignment({ fecha: '2026-05-04', userId: 6, positionName: null as any });
        (a as any).posicion = null;

        const result = groupAssignmentsByDate([a]);
        expect(result['2026-05-04'].assignments[0].posicion).toBe('Sin posición');
    });
});

describe('transformToCalendarEvents', () => {
    it('should return empty array for empty input', () => {
        expect(transformToCalendarEvents([])).toEqual([]);
    });

    it('should map each assignment to a calendar event', () => {
        const assignments = [
            makeAssignment({ fecha: '2026-05-04', userId: 1, positionName: 'Ujier' }),
            makeAssignment({ fecha: '2026-05-11', userId: 2, positionName: 'Monitor' })
        ];

        const events = transformToCalendarEvents(assignments);

        expect(events).toHaveLength(2);
        expect(events[0].title).toContain('User1');
        expect(events[0].title).toContain('Ujier');
        expect(events[1].title).toContain('User2');
    });

    it('should set allDay to true on every event', () => {
        const events = transformToCalendarEvents([makeAssignment({ fecha: '2026-05-04', userId: 1 })]);
        expect(events[0].allDay).toBe(true);
    });

    it('should build start/end dates from configuracion_dia.fecha', () => {
        const events = transformToCalendarEvents([makeAssignment({ fecha: '2026-05-04', userId: 1 })]);
        expect(events[0].start).toBeInstanceOf(Date);
        expect(events[0].end).toBeInstanceOf(Date);
        expect(events[0].start.toISOString()).toContain('2026-05-04');
    });

    it('should preserve original assignment in resource field', () => {
        const assignment = makeAssignment({ fecha: '2026-05-04', userId: 1 });
        const events = transformToCalendarEvents([assignment]);
        expect(events[0].resource).toBe(assignment);
    });

    it('should handle missing usuario gracefully', () => {
        const a = makeAssignment({ fecha: '2026-05-04', userId: 1 });
        (a as any).usuario = null;

        const events = transformToCalendarEvents([a]);
        expect(events[0].title).toBeDefined();
    });

    it('should handle posicion as array in title', () => {
        const a = makeAssignment({ fecha: '2026-05-04', userId: 1 });
        (a as any).posicion = [{ nombre: 'Portero', orden: 1 }];

        const events = transformToCalendarEvents([a]);
        expect(events[0].title).toContain('Portero');
    });
});
