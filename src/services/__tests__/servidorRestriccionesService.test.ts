import { describe, it, expect } from 'vitest';
import {
    evaluarBloqueoServidor,
    type ServidorRestriccionesData,
    type SlotContext,
    type ServidorRuntime,
    type RestriccionServidor,
} from '../servidorRestriccionesService';

// ─── Factories ───────────────────────────────────────────────────────────────

const emptyData = (): ServidorRestriccionesData => ({
    uniformesPorServidor: new Map(),
    uniformeIdPorNombre: new Map(),
    posicionesReglas: new Map(),
    restriccionesPorServidor: new Map(),
    grupos: [],
    coasignacionParejas: new Map(),
});

const restr = (p: Partial<RestriccionServidor>): RestriccionServidor => ({
    id: 1, usuario_id: 1, tipo: 'siempre_libre', valor_int: null, valor_texto: null,
    dia_tipo: null, solo_semana_adoracion: false, motivo: null, activa: true, ...p,
});

// Un domingo (2026-07-05 es domingo) y un martes (2026-07-07) de referencia.
const DOMINGO = '2026-07-05';
const MARTES = '2026-07-07';
const SABADO = '2026-07-04';

const ctxDomingo = (over: Partial<SlotContext> = {}): SlotContext => ({
    fecha: DOMINGO, diaSemana: 0, esDomingo: true, esSemanaAdoracion: false,
    uniformeRequeridoId: null, posicionId: 100, ...over,
});
const ctxMartes = (over: Partial<SlotContext> = {}): SlotContext => ({
    fecha: MARTES, diaSemana: 2, esDomingo: false, esSemanaAdoracion: false,
    uniformeRequeridoId: null, posicionId: 100, ...over,
});

const rt = (over: Partial<ServidorRuntime> = {}): ServidorRuntime => ({
    esLiderExterno: false, ultimoServicio: null, asignacionesMes: 0,
    asignacionesMesDomingo: 0, asignacionesMesEntreSemana: 0,
    conteoGruposEseDia: new Map(), ...over,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('evaluarBloqueoServidor', () => {
    it('sin restricciones → no bloqueado', () => {
        expect(evaluarBloqueoServidor(1, ctxMartes(), emptyData(), rt()).bloqueado).toBe(false);
    });

    it('siempre_libre → bloqueado', () => {
        const data = emptyData();
        data.restriccionesPorServidor.set(1, [restr({ tipo: 'siempre_libre' })]);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt()).bloqueado).toBe(true);
    });

    it('rotativo → bloqueado', () => {
        const data = emptyData();
        data.restriccionesPorServidor.set(1, [restr({ tipo: 'rotativo' })]);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt()).bloqueado).toBe(true);
    });

    it('requiere_confirmacion solo domingo → bloquea domingo, libre entre semana', () => {
        const data = emptyData();
        data.restriccionesPorServidor.set(1, [restr({ tipo: 'requiere_confirmacion', dia_tipo: 'domingo' })]);
        expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt()).bloqueado).toBe(true);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt()).bloqueado).toBe(false);
    });

    describe('liderazgo externo (bundle)', () => {
        it('bloquea domingos y sábados', () => {
            const data = emptyData();
            expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt({ esLiderExterno: true })).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes({ fecha: SABADO, diaSemana: 6, esDomingo: false }), data, rt({ esLiderExterno: true })).bloqueado).toBe(true);
        });

        it('permite entre semana si no sirvió en 3 meses', () => {
            const data = emptyData();
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ esLiderExterno: true, ultimoServicio: '2026-01-01' })).bloqueado).toBe(false);
        });

        it('bloquea si sirvió hace menos de 3 meses', () => {
            const data = emptyData();
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ esLiderExterno: true, ultimoServicio: '2026-06-01' })).bloqueado).toBe(true);
        });

        it('queda libre en semana de adoración', () => {
            const data = emptyData();
            expect(evaluarBloqueoServidor(1, ctxMartes({ esSemanaAdoracion: true }), data, rt({ esLiderExterno: true })).bloqueado).toBe(true);
        });

        it('también aplica vía restricción liderazgo_externo', () => {
            const data = emptyData();
            data.restriccionesPorServidor.set(1, [restr({ tipo: 'liderazgo_externo', motivo: 'Líder Red de Mujeres' })]);
            expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt()).bloqueado).toBe(true);
        });
    });

    it('dias_bloqueados "0,6" bloquea domingo, no martes', () => {
        const data = emptyData();
        data.restriccionesPorServidor.set(1, [restr({ tipo: 'dias_bloqueados', valor_texto: '0,6' })]);
        expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt()).bloqueado).toBe(true);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt()).bloqueado).toBe(false);
    });

    it('frecuencia_meses explícita', () => {
        const data = emptyData();
        data.restriccionesPorServidor.set(1, [restr({ tipo: 'frecuencia_meses', valor_int: 2 })]);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ ultimoServicio: '2026-06-20' })).bloqueado).toBe(true);
        expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ ultimoServicio: '2026-01-01' })).bloqueado).toBe(false);
    });

    describe('max_por_mes', () => {
        it('tope de domingos solo aplica a domingos', () => {
            const data = emptyData();
            data.restriccionesPorServidor.set(1, [restr({ tipo: 'max_por_mes', valor_int: 1, dia_tipo: 'domingo' })]);
            expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt({ asignacionesMesDomingo: 1 })).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ asignacionesMesDomingo: 1 })).bloqueado).toBe(false);
        });

        it('tope total aplica a cualquier día', () => {
            const data = emptyData();
            data.restriccionesPorServidor.set(1, [restr({ tipo: 'max_por_mes', valor_int: 1, dia_tipo: null })]);
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ asignacionesMes: 1 })).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ asignacionesMes: 0 })).bloqueado).toBe(false);
        });
    });

    describe('uniforme (solo domingos)', () => {
        it('bloquea si no posee el uniforme requerido en domingo', () => {
            const data = emptyData();
            data.uniformesPorServidor.set(1, new Set([5])); // posee uniforme 5 (Gris)
            expect(evaluarBloqueoServidor(1, ctxDomingo({ uniformeRequeridoId: 9 }), data, rt()).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxDomingo({ uniformeRequeridoId: 5 }), data, rt()).bloqueado).toBe(false);
        });

        it('no aplica entre semana', () => {
            const data = emptyData();
            expect(evaluarBloqueoServidor(1, ctxMartes({ uniformeRequeridoId: 9 }), data, rt()).bloqueado).toBe(false);
        });
    });

    describe('posiciones (whitelist y blacklist)', () => {
        it('bloquea posición fuera de la whitelist', () => {
            const data = emptyData();
            data.posicionesReglas.set(1, [{ posicion_id: 200, solo_semana_adoracion: false, modo: 'permitida' }]);
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 100 }), data, rt()).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 200 }), data, rt()).bloqueado).toBe(false);
        });

        it('whitelist condicional solo aplica en semana de adoración', () => {
            const data = emptyData();
            data.posicionesReglas.set(1, [{ posicion_id: 200, solo_semana_adoracion: true, modo: 'permitida' }]);
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 100 }), data, rt()).bloqueado).toBe(false);
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 100, esSemanaAdoracion: true }), data, rt()).bloqueado).toBe(true);
        });

        it('blacklist bloquea solo la posición prohibida', () => {
            const data = emptyData();
            data.posicionesReglas.set(1, [{ posicion_id: 6, solo_semana_adoracion: false, modo: 'bloqueada' }]); // 6 = baños
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 6 }), data, rt()).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes({ posicionId: 2 }), data, rt()).bloqueado).toBe(false);
        });
    });

    describe('grupos (incompatibilidad y tope por día)', () => {
        it('incompatibilidad: bloquea si el grupo ya está cubierto ese día (max 1)', () => {
            const data = emptyData();
            data.grupos = [{ grupo_id: 7, miembros: new Set([1, 2, 3]), dia_tipo: null, max_por_dia: 1 }];
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ conteoGruposEseDia: new Map([[7, 1]]) })).bloqueado).toBe(true);
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ conteoGruposEseDia: new Map() })).bloqueado).toBe(false);
        });

        it('grupo con tope por domingo solo aplica en domingo (alabanza: 1 por domingo)', () => {
            const data = emptyData();
            data.grupos = [{ grupo_id: 9, miembros: new Set([1, 2]), dia_tipo: 'domingo', max_por_dia: 1 }];
            // domingo con 1 ya asignado → bloquea
            expect(evaluarBloqueoServidor(1, ctxDomingo(), data, rt({ conteoGruposEseDia: new Map([[9, 1]]) })).bloqueado).toBe(true);
            // entre semana no aplica aunque haya 1
            expect(evaluarBloqueoServidor(1, ctxMartes(), data, rt({ conteoGruposEseDia: new Map([[9, 1]]) })).bloqueado).toBe(false);
        });
    });
});
