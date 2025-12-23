/**
 * Determina la prioridad de un departamento
 * Prioridad 1 (mayor): Servicio General
 * Prioridad 2: Consolidación y otros departamentos
 */
const getDepartmentPriority = (deptName) => {
  if (!deptName) return 999;
  const upper = deptName.toUpperCase();
  if (upper.includes('SERVICIO GENERAL') || upper === 'SERVICIO GENERAL') return 1;
  return 2;
};

/**
 * Determina la prioridad de una posición (roles prioritarios primero)
 * Prioridad 1 (mayor): Encargado, Lider
 * Prioridad 2: Otras posiciones
 */
const getRolePriority = (posicion) => {
  if (!posicion) return 999;
  const upper = posicion.toUpperCase();
  if (upper.includes('ENCARGADO') || upper.includes('LÍDER') || upper.includes('LIDER')) return 1;
  return 2;
};

/**
 * Elimina duplicados de usuarios en el mismo día, manteniendo el rol de mayor prioridad
 * Criterios de prioridad:
 * 1. Departamento P1 (Servicio General) > Departamento P2
 * 2. Rol de mayor jerarquía (Encargado/Líder) > Otros roles
 * 
 * IMPORTANTE: Solo elimina duplicados cuando el usuario está en DIFERENTES departamentos.
 * Permite múltiples asignaciones del mismo usuario en el MISMO departamento.
 */
const removeDuplicateUsersByDay = (assignments) => {
  const seen = new Map(); // Map de usuario -> assignment
  const unique = [];
  const duplicates = [];

  assignments.forEach(item => {
    const nombreCompleto = `${item.usuario.nombre} ${item.usuario.apellido}`;
    const deptId = item.roles_cabecera?.[0]?.departamento_id;

    // Key: solo el nombre del usuario (para detectar duplicados cross-department)
    const key = nombreCompleto;

    if (!seen.has(key)) {
      // Primera vez que vemos este usuario
      seen.set(key, item);
      unique.push(item);
    } else {
      const existing = seen.get(key);
      const existingDeptId = existing.roles_cabecera?.[0]?.departamento_id;

      // Solo considerar duplicado si son de DIFERENTES departamentos
      if (deptId !== existingDeptId) {
        const existingDeptPriority = getDepartmentPriority(existing.roles_cabecera?.[0]?.departamento?.nombre);
        const newDeptPriority = getDepartmentPriority(item.roles_cabecera?.[0]?.departamento?.nombre);

        const existingRolePriority = getRolePriority(existing.posicion?.nombre);
        const newRolePriority = getRolePriority(item.posicion?.nombre);

        // Comparar: primero por departamento, luego por rol
        const shouldReplace = (newDeptPriority < existingDeptPriority) ||
          (newDeptPriority === existingDeptPriority && newRolePriority < existingRolePriority);

        if (shouldReplace) {
          const idx = unique.findIndex(a => a.id === existing.id);
          if (idx !== -1) {
            unique.splice(idx, 1);
            duplicates.push({
              removed: existing.id,
              kept: item.id,
              usuario: nombreCompleto,
              reason: `${existing.posicion?.nombre || 'N/A'} (Dept ${existingDeptId}) eliminado, mantenido: ${item.posicion?.nombre || 'N/A'} (Dept ${deptId})`
            });
          }
          seen.set(key, item);
          unique.push(item);
        } else {
          duplicates.push({
            removed: item.id,
            kept: existing.id,
            usuario: nombreCompleto,
            reason: `${item.posicion?.nombre || 'N/A'} (Dept ${deptId}) eliminado, mantenido: ${existing.posicion?.nombre || 'N/A'} (Dept ${existingDeptId})`
          });
        }
      } else {
        // Mismo departamento: NO es duplicado, agregar ambos
        unique.push(item);
      }
    }
  });

  if (duplicates.length > 0) {
    console.warn('⚠️ Duplicados cross-department encontrados y eliminados:', duplicates);
  }

  return unique;
};

/**
 * Agrupa asignaciones por fecha con toda la información del día
 */
export const groupAssignmentsByDate = (assignments) => {
  // Primero eliminar duplicados de usuarios por día
  const cleanedAssignments = removeDuplicateUsersByDay(assignments);

  return cleanedAssignments.reduce((acc, item) => {
    const fecha = item.configuracion_dia.fecha;

    if (!acc[fecha]) {
      acc[fecha] = {
        assignments: [],
        encargado: item.configuracion_dia?.encargado ?
          `${item.configuracion_dia.encargado.nombre} ${item.configuracion_dia.encargado.apellido}` : null,
        servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
        uniforme: item.configuracion_dia?.color_uniforme || 'N/A'
      };
    }

    const nombreCompleto = `${item.usuario.nombre} ${item.usuario.apellido}`;

    // Add ALL assignments to the list (removed incorrect encargado filtering)
    acc[fecha].assignments.push({
      id: item.id,
      usuario_id: item.usuario_id,
      nombre: nombreCompleto,
      posicion: item.posicion?.nombre || 'Sin posición',
      posicionObj: item.posicion, // Para swap: contiene genero_requerido
      uniforme: item.configuracion_dia?.color_uniforme || 'N/A',
      servicio: item.configuracion_dia?.tipo_servicio || 'N/A',
      usuario: {
        nombre: item.usuario?.nombre,
        apellido: item.usuario?.apellido,
        genero: item.usuario?.genero
      }
    });

    return acc;
  }, {});
};

/**
 * Transforma asignaciones a eventos de calendario
 */
export const transformToCalendarEvents = (assignments) => {
  return assignments.map(item => {
    const position = item.posicion?.nombre ? ` – ${item.posicion.nombre}` : '';
    return {
      id: item.id,
      title: `${item.usuario.nombre} ${item.usuario.apellido}${position}`,
      start: new Date(item.configuracion_dia.fecha),
      end: new Date(item.configuracion_dia.fecha),
      allDay: true,
      resource: item
    };
  });
};
