import type { TransformerAssignment, CalendarAssignment, CalendarEvent } from './transformerTypes';

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

    const p = item.posicion;
    let ordenVal: number | null = null;
    let nombreVal: string = '';

    if (p) {
        if (Array.isArray(p) && p.length > 0) {
            ordenVal = p[0].orden ?? null;
            nombreVal = p[0].nombre || '';
        } else if (typeof p === 'object' && !Array.isArray(p)) {
            const pObj = p as { orden?: number; nombre?: string };
            ordenVal = pObj.orden ?? null;
            nombreVal = pObj.nombre || '';
        } else if (typeof p === 'string') {
            nombreVal = p;
        }
    }

    if (typeof item.orden === 'number') return item.orden;

    if (ordenVal === null || ordenVal === undefined) {
        const alt = item.posiciones_departamento;
        if (alt) {
            if (Array.isArray(alt) && alt.length > 0) {
                ordenVal = alt[0].orden ?? null;
            } else if (typeof alt === 'object' && !Array.isArray(alt)) {
                ordenVal = (alt as { orden?: number }).orden ?? null;
            }
        }
    }

    if (ordenVal !== null && ordenVal !== undefined) {
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

export interface ServiceGroup {
    configuracion_dia_id: number | string;
    service_index: number;
    assignments: CalendarAssignment[];
    encargado: string | null;
    encargado_id: string | number | null;
    servicio: string;
    uniforme: string;
    hora_llegada: string | null;
}

export interface DayGroup {
    services: ServiceGroup[];
    // convenience: all assignments flattened (used for day-click)
    allAssignments: CalendarAssignment[];
}

export const groupAssignmentsByDate = (assignments: TransformerAssignment[]): Record<string, DayGroup> => {
    if (!assignments || assignments.length === 0) return {};

    const cleanedAssignments = removeDuplicateUsersByDay(assignments);

    const acc: Record<string, DayGroup> = {};
    // Map from configuracion_dia_id → ServiceGroup (to build per service)
    const serviceMap: Record<string | number, ServiceGroup> = {};

    cleanedAssignments.forEach(item => {
        const fecha = item.configuracion_dia?.fecha;
        if (!fecha) return;

        const configId = item.configuracion_dia?.id ?? item.configuracion_dia_id ?? `${fecha}-0`;
        const serviceIndex = item.configuracion_dia?.service_index ?? 0;

        if (!serviceMap[configId]) {
            serviceMap[configId] = {
                configuracion_dia_id: configId,
                service_index: serviceIndex,
                assignments: [],
                encargado: item.configuracion_dia?.encargado
                    ? `${item.configuracion_dia.encargado.nombre} ${item.configuracion_dia.encargado.apellido}` : null,
                encargado_id: item.configuracion_dia?.encargado?.id || null,
                servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
                uniforme: item.configuracion_dia?.color_uniforme || 'N/A',
                hora_llegada: item.configuracion_dia?.hora_llegada || null,
            };
        }

        if (!acc[fecha]) {
            acc[fecha] = { services: [], allAssignments: [] };
        }

        const nombreCompleto = item.usuario
            ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario desconocido';

        const posName = item.posicion && typeof item.posicion === 'object' && !Array.isArray(item.posicion)
            ? (item.posicion as { nombre?: string }).nombre
            : Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion;

        const calAssignment: CalendarAssignment = {
            id: item.id,
            usuario_id: item.usuario_id,
            nombre: nombreCompleto,
            posicion: typeof posName === 'string' ? posName : 'Sin posición',
            posicionObj: item.posicion,
            uniforme: item.configuracion_dia?.color_uniforme || 'N/A',
            servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
            hora_llegada: item.configuracion_dia?.hora_llegada || null,
            usuario: {
                nombre: item.usuario?.nombre,
                apellido: item.usuario?.apellido,
                genero: item.usuario?.genero || null
            },
            orden: getSafeOrder(item),
            departamento_id: item.configuracion_dia?.roles_cabecera?.[0]?.departamento_id
        };

        serviceMap[configId].assignments.push(calAssignment);
        acc[fecha].allAssignments.push(calAssignment);
    });

    // Sort assignments within each service and attach services to days in order
    Object.values(serviceMap).forEach(sg => {
        sg.assignments.sort((a, b) => {
            const o1 = a.orden ?? 999;
            const o2 = b.orden ?? 999;
            if (o1 !== o2) return o1 - o2;
            return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });
    });

    // Attach services to each date, sorted by service_index
    Object.entries(serviceMap).forEach(([, sg]) => {
        // Find which fecha this service belongs to (look up from first assignment's service data)
        // We need to back-reference fecha from assignments — use the acc we built
        Object.entries(acc).forEach(([, dayGroup]) => {
            if (dayGroup.allAssignments.some(a => sg.assignments.some(sa => sa.id === a.id))) {
                if (!dayGroup.services.find(s => s.configuracion_dia_id === sg.configuracion_dia_id)) {
                    dayGroup.services.push(sg);
                }
            }
        });
    });

    Object.values(acc).forEach(dayGroup => {
        dayGroup.services.sort((a, b) => a.service_index - b.service_index);
    });

    return acc;
};

export const transformToCalendarEvents = (assignments: TransformerAssignment[]): CalendarEvent[] => {
    return assignments.map(item => {
        const posName = typeof item.posicion === 'object' && !Array.isArray(item.posicion) ? (item.posicion as { nombre?: string }).nombre :
            Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion;
        const positionString = posName ? ` – ${posName}` : '';
        const fecha = item.configuracion_dia?.fecha;
        return {
            id: item.id,
            title: `${item.usuario?.nombre || ''} ${item.usuario?.apellido || ''}${positionString}`,
            start: fecha ? new Date(fecha) : new Date(),
            end: fecha ? new Date(fecha) : new Date(),
            allDay: true,
            resource: item
        };
    });
};
