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
 * Busca en todas las rutas posibles del objeto de Supabase
 */
const getSafeOrder = (item: any): number => {
    if (!item) return 999;

    // 1. Si ya tiene la propiedad 'orden' directa (casos manuales o ya procesados)
    if (typeof item.orden === 'number') return item.orden;

    // 2. Buscar en la relación 'posicion'
    const p = item.posicion;
    let ordenVal: any = null;
    let nombreVal: string = '';

    if (p) {
        if (Array.isArray(p) && p[0]) {
            ordenVal = p[0].orden;
            nombreVal = p[0].nombre || '';
        } else if (typeof p === 'object') {
            ordenVal = p.orden;
            nombreVal = p.nombre || '';
        } else if (typeof p === 'string') {
            nombreVal = p;
        }
    }

    // 3. Buscar en alias alternativos (por si acaso)
    if (ordenVal === null || ordenVal === undefined) {
        const alt = item.posiciones_departamento;
        if (alt) {
            ordenVal = Array.isArray(alt) ? alt[0]?.orden : alt.orden;
        }
    }

    // 4. Intentar convertir a número
    if (ordenVal !== null && ordenVal !== undefined && ordenVal !== '') {
        const n = Number(ordenVal);
        if (!isNaN(n)) return n;
    }

    // 5. Fallback por nombre (si no hay orden en DB, pero es Encargado, darle 0 para que suba)
    if (nombreVal.toUpperCase().includes('ENCARGADO')) return 0;

    return 999;
};

/**
 * Elimina duplicados de usuarios en el mismo día, manteniendo el de mayor prioridad
 */
const removeDuplicateUsersByDay = (assignments: any[]): any[] => {
    const seen = new Map<string, any>();
    const unique: any[] = [];

    assignments.forEach(item => {
        const nombreCompleto = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario';
        const deptId = item.roles_cabecera?.[0]?.departamento_id;
        const key = nombreCompleto;

        if (!seen.has(key)) {
            seen.set(key, item);
            unique.push(item);
        } else {
            const existing = seen.get(key);
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
    });

    return unique;
};

interface GroupedAssignment {
    assignments: any[];
    encargado: string | null;
    encargado_id: string | number | null;
    servicio: string;
    uniforme: string;
}

/**
 * Agrupa asignaciones por fecha con toda la información del día
 */
export const groupAssignmentsByDate = (assignments: any[]): Record<string, GroupedAssignment> => {
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

        acc[fecha].assignments.push({
            id: item.id,
            usuario_id: item.usuario_id,
            nombre: nombreCompleto,
            posicion: item.posicion?.nombre || (Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion) || 'Sin posición',
            posicionObj: item.posicion,
            uniforme: item.configuracion_dia?.color_uniforme || 'N/A',
            servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
            usuario: {
                nombre: item.usuario?.nombre,
                apellido: item.usuario?.apellido,
                genero: item.usuario?.genero
            },
            orden: getSafeOrder(item),
            departamento_id: item.configuracion_dia?.roles_cabecera?.[0]?.departamento_id
        });

        // Ordenar estrictamente por la propiedad 'orden'
        acc[fecha].assignments.sort((a: any, b: any) => {
            const o1 = a.orden ?? 999;
            const o2 = b.orden ?? 999;
            if (o1 !== o2) return o1 - o2;
            return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });

        return acc;
    }, {} as Record<string, GroupedAssignment>);
};

/**
 * Transforma asignaciones a eventos de calendario
 */
export const transformToCalendarEvents = (assignments: any[]): any[] => {
    return assignments.map(item => {
        const posName = item.posicion?.nombre || (Array.isArray(item.posicion) ? item.posicion[0]?.nombre : item.posicion) || '';
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
