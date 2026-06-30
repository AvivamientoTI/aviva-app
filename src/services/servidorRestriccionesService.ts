import { supabase } from './supabaseClient';
import dayjs from 'dayjs';

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE RESTRICCIONES DE SERVIDORES
//
// Núcleo compartido por el algoritmo automático (useAutoAssign) y el sustituto
// manual (recommendationService). Carga las restricciones del departamento y
// evalúa, para un servidor y un "slot" concreto (fecha + servicio + posición),
// si está BLOQUEADO de forma dura.
//
// Las penalizaciones blandas (equidad, prioridad de líderes, etc.) se mantienen
// en el scoring de cada consumidor; aquí solo viven los filtros duros.
// ─────────────────────────────────────────────────────────────────────────────

export const SERVIDORES_DEPT_ID = 2;
export const TIPO_SEMANA_ADORACION = 'Semana de Adoración';

export type RestriccionTipo =
    | 'liderazgo_externo'
    | 'frecuencia_meses'
    | 'max_por_mes'
    | 'siempre_libre'
    | 'rotativo'
    | 'requiere_confirmacion'
    | 'dias_bloqueados';

export interface RestriccionServidor {
    id: number;
    usuario_id: number;
    tipo: RestriccionTipo;
    valor_int: number | null;
    valor_texto: string | null;
    dia_tipo: 'domingo' | 'entre_semana' | null;
    solo_semana_adoracion: boolean;
    motivo: string | null;
    activa: boolean;
}

interface PosicionRegla {
    posicion_id: number;
    solo_semana_adoracion: boolean;
    modo: 'permitida' | 'bloqueada';
}

interface GrupoIncompatibilidad {
    grupo_id: number;
    miembros: Set<number>;
    dia_tipo: 'domingo' | 'entre_semana' | null;
    max_por_dia: number;
}

export interface ServidorRestriccionesData {
    /** usuario_id → set de uniforme_id que posee */
    uniformesPorServidor: Map<number, Set<number>>;
    /** nombre normalizado de uniforme → uniforme_id (para mapear configuracion_dia.color_uniforme) */
    uniformeIdPorNombre: Map<string, number>;
    /** usuario_id → reglas de posición (whitelist 'permitida' y/o blacklist 'bloqueada') */
    posicionesReglas: Map<number, PosicionRegla[]>;
    /** usuario_id → restricciones activas */
    restriccionesPorServidor: Map<number, RestriccionServidor[]>;
    /** grupos de incompatibilidad del departamento */
    grupos: GrupoIncompatibilidad[];
    /** usuario_id → compañeros de co-asignación (preferente: servir el mismo día) */
    coasignacionParejas: Map<number, Set<number>>;
}

/** Contexto del slot a cubrir. */
export interface SlotContext {
    fecha: string;
    diaSemana: number;            // 0 = domingo … 6 = sábado
    esDomingo: boolean;
    esSemanaAdoracion: boolean;   // configuracion_dia.tipo_servicio === TIPO_SEMANA_ADORACION
    uniformeRequeridoId: number | null;
    posicionId: number;
}

/** Estado del servidor relevante para reglas temporales (historial + uso en el plan). */
export interface ServidorRuntime {
    esLiderExterno: boolean;             // líder de otro depto (detectado por membresías)
    ultimoServicio?: string | null;      // YYYY-MM-DD del último servicio conocido
    asignacionesMes: number;             // total en el mes objetivo (historial + plan)
    asignacionesMesDomingo: number;
    asignacionesMesEntreSemana: number;
    conteoGruposEseDia: Map<number, number>;  // grupo_id → cuántos de ese grupo ya sirven ese día
}

export interface EvaluacionBloqueo {
    bloqueado: boolean;
    razon?: string;
}

const norm = (s: string | null | undefined) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const FRECUENCIA_LIDER_MESES = 3;

/** Carga todas las restricciones del departamento Servidores en estructuras indexadas. */
export async function loadServidorRestricciones(): Promise<ServidorRestriccionesData> {
    const [unifRows, unifDept, posRows, restrRows, grupoRows, grupoMiembros, coGrupos, coMiembros] = await Promise.all([
        supabase.from('servidor_uniformes').select('usuario_id, uniforme_id'),
        supabase.from('uniformes_departamento').select('id, nombre').eq('departamento_id', SERVIDORES_DEPT_ID),
        supabase.from('servidor_posiciones_permitidas').select('usuario_id, posicion_id, solo_semana_adoracion, modo'),
        supabase.from('restricciones_servidor').select('*').eq('activa', true),
        supabase.from('grupos_incompatibilidad').select('id, dia_tipo, max_por_dia').eq('departamento_id', SERVIDORES_DEPT_ID),
        supabase.from('grupos_incompatibilidad_miembros').select('grupo_id, usuario_id'),
        supabase.from('grupos_coasignacion').select('id').eq('departamento_id', SERVIDORES_DEPT_ID),
        supabase.from('grupos_coasignacion_miembros').select('grupo_id, usuario_id'),
    ]);

    const uniformesPorServidor = new Map<number, Set<number>>();
    (unifRows.data || []).forEach((r: { usuario_id: number; uniforme_id: number }) => {
        if (!uniformesPorServidor.has(r.usuario_id)) uniformesPorServidor.set(r.usuario_id, new Set());
        uniformesPorServidor.get(r.usuario_id)!.add(r.uniforme_id);
    });

    const uniformeIdPorNombre = new Map<string, number>();
    (unifDept.data || []).forEach((u: { id: number; nombre: string }) => {
        uniformeIdPorNombre.set(norm(u.nombre), u.id);
    });

    const posicionesReglas = new Map<number, PosicionRegla[]>();
    (posRows.data || []).forEach((r: { usuario_id: number; posicion_id: number; solo_semana_adoracion: boolean; modo: string }) => {
        if (!posicionesReglas.has(r.usuario_id)) posicionesReglas.set(r.usuario_id, []);
        posicionesReglas.get(r.usuario_id)!.push({
            posicion_id: r.posicion_id,
            solo_semana_adoracion: r.solo_semana_adoracion,
            modo: r.modo === 'bloqueada' ? 'bloqueada' : 'permitida',
        });
    });

    const restriccionesPorServidor = new Map<number, RestriccionServidor[]>();
    (restrRows.data || []).forEach((r: RestriccionServidor) => {
        if (!restriccionesPorServidor.has(r.usuario_id)) restriccionesPorServidor.set(r.usuario_id, []);
        restriccionesPorServidor.get(r.usuario_id)!.push(r);
    });

    const miembrosPorGrupo = new Map<number, Set<number>>();
    (grupoMiembros.data || []).forEach((m: { grupo_id: number; usuario_id: number }) => {
        if (!miembrosPorGrupo.has(m.grupo_id)) miembrosPorGrupo.set(m.grupo_id, new Set());
        miembrosPorGrupo.get(m.grupo_id)!.add(m.usuario_id);
    });
    const grupos: GrupoIncompatibilidad[] = (grupoRows.data || []).map((g: { id: number; dia_tipo: string | null; max_por_dia: number }) => ({
        grupo_id: g.id,
        miembros: miembrosPorGrupo.get(g.id) || new Set<number>(),
        dia_tipo: g.dia_tipo === 'domingo' || g.dia_tipo === 'entre_semana' ? g.dia_tipo : null,
        max_por_dia: g.max_por_dia ?? 1,
    }));

    // Co-asignación: usuario → set de compañeros (relación simétrica dentro del grupo)
    const miembrosCoGrupo = new Map<number, number[]>();
    (coMiembros.data || []).forEach((m: { grupo_id: number; usuario_id: number }) => {
        if (!miembrosCoGrupo.has(m.grupo_id)) miembrosCoGrupo.set(m.grupo_id, []);
        miembrosCoGrupo.get(m.grupo_id)!.push(m.usuario_id);
    });
    const coasignacionParejas = new Map<number, Set<number>>();
    (coGrupos.data || []).forEach((g: { id: number }) => {
        const ids = miembrosCoGrupo.get(g.id) || [];
        ids.forEach(uid => {
            if (!coasignacionParejas.has(uid)) coasignacionParejas.set(uid, new Set());
            ids.forEach(other => { if (other !== uid) coasignacionParejas.get(uid)!.add(other); });
        });
    });

    return { uniformesPorServidor, uniformeIdPorNombre, posicionesReglas, restriccionesPorServidor, grupos, coasignacionParejas };
}

/** Resuelve el uniforme_id requerido a partir del nombre de color del servicio. */
export function resolverUniformeRequerido(
    colorUniforme: string | null | undefined,
    data: ServidorRestriccionesData,
): number | null {
    if (!colorUniforme) return null;
    return data.uniformeIdPorNombre.get(norm(colorUniforme)) ?? null;
}

/**
 * Evalúa si un servidor está BLOQUEADO (filtro duro) para el slot dado.
 * Devuelve la primera razón de bloqueo encontrada, o { bloqueado: false }.
 */
export function evaluarBloqueoServidor(
    usuarioId: number,
    ctx: SlotContext,
    data: ServidorRestriccionesData,
    rt: ServidorRuntime,
): EvaluacionBloqueo {
    const block = (razon: string): EvaluacionBloqueo => ({ bloqueado: true, razon });
    const restricciones = data.restriccionesPorServidor.get(usuarioId) || [];
    const esLider = rt.esLiderExterno || restricciones.some(r => r.tipo === 'liderazgo_externo');

    // Fuera del automático (incluibles solo manualmente)
    if (restricciones.some(r => r.tipo === 'siempre_libre')) return block('Siempre libre');
    if (restricciones.some(r => r.tipo === 'rotativo')) return block('Horario rotativo');
    for (const r of restricciones.filter(r => r.tipo === 'requiere_confirmacion')) {
        // Si tiene dia_tipo, solo aplica a ese tipo de día; si no, aplica siempre.
        if (r.dia_tipo === 'domingo' && !ctx.esDomingo) continue;
        if (r.dia_tipo === 'entre_semana' && ctx.esDomingo) continue;
        return block(r.motivo || 'Requiere confirmación');
    }

    // Bundle de liderazgo externo: solo entre semana + libre en adoración + cada 3 meses
    if (esLider) {
        if (ctx.diaSemana === 0 || ctx.diaSemana === 6) return block('Líder: solo sirve entre semana');
        if (ctx.esSemanaAdoracion) return block('Líder: libre en semana de adoración');
        if (rt.ultimoServicio &&
            dayjs(ctx.fecha).diff(dayjs(rt.ultimoServicio), 'month', true) < FRECUENCIA_LIDER_MESES) {
            return block('Líder: sirve cada 3 meses');
        }
    }

    // Días de la semana bloqueados (CSV en valor_texto, 0=domingo … 6=sábado)
    for (const r of restricciones.filter(r => r.tipo === 'dias_bloqueados')) {
        const dias = (r.valor_texto || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (dias.includes(ctx.diaSemana)) return block(r.motivo || 'Día no disponible');
    }

    // Frecuencia explícita (cada N meses)
    for (const r of restricciones.filter(r => r.tipo === 'frecuencia_meses')) {
        if (r.valor_int && rt.ultimoServicio &&
            dayjs(ctx.fecha).diff(dayjs(rt.ultimoServicio), 'month', true) < r.valor_int) {
            return block(`Sirve cada ${r.valor_int} meses`);
        }
    }

    // Tope mensual (al alcanzarlo, se excluye)
    for (const r of restricciones.filter(r => r.tipo === 'max_por_mes')) {
        const tope = r.valor_int ?? 1;
        if (r.dia_tipo === 'domingo') {
            if (!ctx.esDomingo) continue;
            if (rt.asignacionesMesDomingo >= tope) return block(`Tope mensual de domingos (${tope})`);
        } else if (r.dia_tipo === 'entre_semana') {
            if (ctx.esDomingo) continue;
            if (rt.asignacionesMesEntreSemana >= tope) return block(`Tope mensual entre semana (${tope})`);
        } else {
            if (rt.asignacionesMes >= tope) return block(`Tope mensual alcanzado (${tope})`);
        }
    }

    // Uniforme requerido (solo se evalúa en domingos)
    if (ctx.esDomingo && ctx.uniformeRequeridoId != null) {
        const posee = data.uniformesPorServidor.get(usuarioId);
        if (!posee || !posee.has(ctx.uniformeRequeridoId)) return block('No posee el uniforme requerido');
    }

    // Reglas de posición: whitelist (permitida) y/o blacklist (bloqueada),
    // algunas condicionadas a semana de adoración.
    const reglasPos = data.posicionesReglas.get(usuarioId);
    if (reglasPos && reglasPos.length) {
        const aplica = (p: PosicionRegla) => !p.solo_semana_adoracion || ctx.esSemanaAdoracion;
        const permitidas = reglasPos.filter(p => p.modo === 'permitida' && aplica(p));
        const bloqueadas = reglasPos.filter(p => p.modo === 'bloqueada' && aplica(p));
        if (permitidas.length && !permitidas.some(p => p.posicion_id === ctx.posicionId)) {
            return block('Posición no permitida');
        }
        if (bloqueadas.some(p => p.posicion_id === ctx.posicionId)) {
            return block('Posición bloqueada');
        }
    }

    // Incompatibilidad / tope de grupo por día (scope opcional de tipo de día)
    for (const g of data.grupos) {
        if (!g.miembros.has(usuarioId)) continue;
        if (g.dia_tipo === 'domingo' && !ctx.esDomingo) continue;
        if (g.dia_tipo === 'entre_semana' && ctx.esDomingo) continue;
        const yaServidores = rt.conteoGruposEseDia.get(g.grupo_id) || 0;
        if (yaServidores >= g.max_por_dia) {
            return block('Tope del grupo alcanzado ese día');
        }
    }

    return { bloqueado: false };
}

/** Grupos de incompatibilidad a los que pertenece un usuario (para marcar cobertura por día). */
export function gruposDeUsuario(usuarioId: number, data: ServidorRestriccionesData): number[] {
    return data.grupos.filter(g => g.miembros.has(usuarioId)).map(g => g.grupo_id);
}

/**
 * Evalúa un conjunto de candidatos para un slot, cargando por su cuenta los datos
 * necesarios (restricciones, historial y liderazgos). Pensado para la UI de
 * asignación manual (override): devuelve por usuario si está bloqueado y por qué.
 * Si el departamento no es Servidores, devuelve un mapa vacío (sin restricciones).
 */
export async function evaluarCandidatosParaSlot(input: {
    departmentId: number;
    fecha: string;
    posicionId: number;
    uniformeColor?: string | null;
    esSemanaAdoracion: boolean;
    candidateIds: number[];
    asignadosEseDia: number[];
}): Promise<Map<number, EvaluacionBloqueo>> {
    const result = new Map<number, EvaluacionBloqueo>();
    if (Number(input.departmentId) !== SERVIDORES_DEPT_ID || input.candidateIds.length === 0) return result;

    const data = await loadServidorRestricciones();
    const diaSemana = dayjs(input.fecha).day();
    const ctx: SlotContext = {
        fecha: input.fecha,
        diaSemana,
        esDomingo: diaSemana === 0,
        esSemanaAdoracion: input.esSemanaAdoracion,
        uniformeRequeridoId: resolverUniformeRequerido(input.uniformeColor, data),
        posicionId: input.posicionId,
    };

    // Historial (6 meses) para frecuencia y topes del mes
    const monthStart = dayjs(input.fecha).startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs(input.fecha).endOf('month').format('YYYY-MM-DD');
    const sixMonthsAgo = dayjs(input.fecha).subtract(6, 'month').format('YYYY-MM-DD');
    const { data: history } = await supabase
        .from('asignaciones')
        .select('usuario_id, configuracion_dia!inner(fecha)')
        .gte('configuracion_dia.fecha', sixMonthsAgo) as { data: { usuario_id: number; configuracion_dia: { fecha: string } }[] | null };

    const lastServed: Record<number, string> = {};
    const monthTotal: Record<number, number> = {};
    const monthDom: Record<number, number> = {};
    const monthWeek: Record<number, number> = {};
    (history || []).forEach(h => {
        const uid = h.usuario_id;
        const f = h.configuracion_dia.fecha;
        if (!lastServed[uid] || f > lastServed[uid]) lastServed[uid] = f;
        if (f >= monthStart && f <= monthEnd) {
            monthTotal[uid] = (monthTotal[uid] || 0) + 1;
            if (dayjs(f).day() === 0) monthDom[uid] = (monthDom[uid] || 0) + 1;
            else monthWeek[uid] = (monthWeek[uid] || 0) + 1;
        }
    });

    // Líderes de otros departamentos
    const externalLeaders = new Set<number>();
    const { data: allM } = await supabase
        .from('membresias')
        .select('usuario_id, departamento_id, rol_jerarquico')
        .in('usuario_id', input.candidateIds) as { data: { usuario_id: number; departamento_id: number; rol_jerarquico: string }[] | null };
    (allM || []).forEach(m => {
        if (Number(m.departamento_id) !== SERVIDORES_DEPT_ID && ['lider', 'sublider'].includes(norm(m.rol_jerarquico))) {
            externalLeaders.add(m.usuario_id);
        }
    });

    const conteoGrupos = new Map<number, number>();
    input.asignadosEseDia.forEach(uid => gruposDeUsuario(uid, data).forEach(g => conteoGrupos.set(g, (conteoGrupos.get(g) || 0) + 1)));

    for (const uid of input.candidateIds) {
        const rt: ServidorRuntime = {
            esLiderExterno: externalLeaders.has(uid),
            ultimoServicio: lastServed[uid] || null,
            asignacionesMes: monthTotal[uid] || 0,
            asignacionesMesDomingo: monthDom[uid] || 0,
            asignacionesMesEntreSemana: monthWeek[uid] || 0,
            conteoGruposEseDia: conteoGrupos,
        };
        result.set(uid, evaluarBloqueoServidor(uid, ctx, data, rt));
    }
    return result;
}
