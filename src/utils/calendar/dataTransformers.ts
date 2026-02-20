import type { TransformerAssignment, CalendarAssignment } from './transformerTypes';

/**
 * Determina la prioridad de un departamento
 */
const getDepartmentPriority = (deptName: string | undefined): number => {
    if (!deptName) return 999;
    const upper = deptName.toUpperCase();
    if (upper.includes('SERVICIO GENERAL')) return 1;
    return 2;
};

/**
 * EXTRAE EL ORDEN DE FORMA HIPER-ROBUSTA
 */
const getSafeOrder = (item: TransformerAssignment): number => {
    if (!item) return 999;

    if (typeof item.orden === 'number') return item.orden;

    const p = item.posicion;
    let ordenVal: any = null;
    let nombreVal: string = '';

    if (p) {
        if (Array.isArray(p) && p.length > 0) {
            ordenVal = p[0].orden;
            nombreVal = p[0].nombre || '';
        } else if (typeof p === 'object' && !Array.isArray(p)) {
            // @ts-ignore
            const pObj = p as { orden?: number; nombre?: string };
            ordenVal = pObj.orden;
            nombreVal = pObj.nombre || '';
        } else if (typeof p === 'string') {
            nombreVal = p;
        }
    }

    if (ordenVal === null || ordenVal === undefined) {
        const alt = item.posiciones_departamento;
        if (alt) {
            if (Array.isArray(alt) && alt.length > 0) {
                ordenVal = alt[0].orden;
            } else if (typeof alt === 'object' && !Array.isArray(alt)) {
                // @ts-ignore
                ordenVal = (alt as any).orden;
            }
        }
    }

    if (ordenVal !== null && ordenVal !== undefined && ordenVal !== '') {
        const n = Number(ordenVal);
        if (!isNaN(n)) return n;
    }

    if (nombreVal.toUpperCase().includes('ENCARGADO')) return 0;
    return 999;
};

const removeDuplicateUsersByDay = (assignments: TransformerAssignment[]): TransformerAssignment[] => {
    const seen = new Map<string, TransformerAssignment>();
    const unique: TransformerAssignment[] = [];

    assignments.forEach(item => {
        const nombreCompleto = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario';
        const deptId = item.roles_cabecera?.[0]?.departamento_id;
        const key = nombreCompleto;

        if (!seen.has(key)) {
            seen.set(key, item);
            unique.push(item);
        } else {
            const existing = seen.get(key);
            if (existing) {
                const existingDeptId = existing.roles_cabecera?.[0]?.departamento_id;
                if (deptId !== existingDeptId) {
                    const p1 = getDepartmentPriority(existing.roles_cabecera?.[0]?.departamento?.nombre);
                    const p2 = getDepartmentPriority(item.roles_cabecera?.[0]?.departamento?.nombre);
                    const r1 = getSafeOrder(existing);
                    const r2 = getSafeOrder(item);
                    const shouldReplace = (p2 < p1) || (p2 === p1 && r2 < r1);
                    if (shouldReplace) {
                        const idx = unique.findIndex(a => a.id === existing.id);
                        if (idx !== -1) unique.splice(idx, 1);
                        seen.set(key, item);
                        unique.push(item);
                    }
                } else {
                    unique.push(item);
                }
            }
        }
    });

    return unique;
};

interface GroupedAssignment {
    assignments: CalendarAssignment[];
    encargado: string | null;
    encargado_id: string | number | null;
    servicio: string;
    uniforme: string;
}

export const groupAssignmentsByDate = (assignments: TransformerAssignment[]): Record<string, GroupedAssignment> => {
    if (!assignments || assignments.length === 0) return {};

    const cleanedAssignments = removeDuplicateUsersByDay(assignments);

    return cleanedAssignments.reduce((acc, item) => {
        const fecha = item.configuracion_dia?.fecha;
        if (!fecha) return acc;

        if (!acc[fecha]) {
            acc[fecha] = {
                assignments: [],
                encargado: item.configuracion_dia?.encargado ?
                    `${item.configuracion_dia.encargado.nombre} ${item.configuracion_dia.encargado.apellido}` : null,
                encargado_id: item.configuracion_dia?.encargado?.id || null,
                servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
                uniforme: item.configuracion_dia?.color_uniforme || 'N/A'
            };
        }

        const nombreCompleto = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario desconocido';

        const posName = typeof item.posicion === 'object' && !Array.isArray(item.posicion) ? (item.posicion as any).nombre :
            Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion;

        acc[fecha].assignments.push({
            id: item.id,
            usuario_id: item.usuario_id,
            nombre: nombreCompleto,
            posicion: typeof posName === 'string' ? posName : 'Sin posición',
            posicionObj: item.posicion,
            uniforme: item.configuracion_dia?.color_uniforme || 'N/A',
            servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
            usuario: {
                nombre: item.usuario?.nombre,
                apellido: item.usuario?.apellido,
                genero: item.usuario?.genero || null
            },
            orden: getSafeOrder(item),
            departamento_id: item.configuracion_dia?.roles_cabecera?.[0]?.departamento_id
        });

        // Ordenar estrictamente por la propiedad 'orden'
        acc[fecha].assignments.sort((a, b) => {
            const o1 = a.orden ?? 999;
            const o2 = b.orden ?? 999;
            if (o1 !== o2) return o1 - o2;
            return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });

        return acc;
    }, {} as Record<string, GroupedAssignment>);
};

export const transformToCalendarEvents = (assignments: TransformerAssignment[]): any[] => {
    return assignments.map(item => {
        const posName = typeof item.posicion === 'object' && !Array.isArray(item.posicion) ? (item.posicion as any).nombre :
            Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion;
        const position = posName ? ` – ${posName}` : '';
        const fecha = item.configuracion_dia?.fecha;
        return {
            id: item.id,
            title: `${item.usuario?.nombre || ''} ${item.usuario?.apellido || ''}${position}`,
            start: fecha ? new Date(fecha) : new Date(),
            end: fecha ? new Date(fecha) : new Date(),
            allDay: true,
            resource: item
        };
    });
};
