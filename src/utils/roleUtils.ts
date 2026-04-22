import { ROLES } from '../constants/roles';

const VALID_ROLES = new Set(Object.values(ROLES).map(r => r.toLowerCase()));

export function parseRoles(rolJerarquico?: string | null) {
    const r = rolJerarquico?.toLowerCase()?.trim() || '';

    // Rechazar roles que no están en la lista blanca
    if (r && !VALID_ROLES.has(r)) {
        return { isLider: false, isSublider: false, isEncargado: false, isServidor: false, isAdmin: false, isAnyLeader: false };
    }

    const isLider = r === ROLES.LIDER.toLowerCase();
    const isSublider = r === ROLES.SUBLIDER.toLowerCase();
    const isEncargado = r === ROLES.ENCARGADO.toLowerCase() || r === ROLES.ENCARGADA.toLowerCase();
    const isServidor = r === ROLES.SERVIDOR.toLowerCase() || r === ROLES.SERVIDORA.toLowerCase();
    const isAdmin = r === ROLES.ADMIN.toLowerCase();

    return {
        isLider,
        isSublider,
        isEncargado,
        isServidor,
        isAdmin,
        isAnyLeader: isLider || isSublider || isAdmin
    };
}
