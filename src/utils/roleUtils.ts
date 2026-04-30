import { ROLES } from '../constants/roles';

const VALID_ROLES = new Set(Object.values(ROLES).map(r => r.toLowerCase()));

const normalizeAccents = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function parseRoles(rolJerarquico?: string | null) {
    const r = rolJerarquico?.toLowerCase()?.trim() || '';
    const rNorm = normalizeAccents(r);

    // Rechazar roles que no están en la lista blanca (compare accent-normalized)
    if (r && !Array.from(VALID_ROLES).some(v => normalizeAccents(v) === rNorm)) {
        return { isLider: false, isSublider: false, isEncargado: false, isServidor: false, isAdmin: false, isAnyLeader: false };
    }

    const isLider = rNorm === normalizeAccents(ROLES.LIDER.toLowerCase());
    const isSublider = rNorm === normalizeAccents(ROLES.SUBLIDER.toLowerCase());
    const isEncargado = rNorm === normalizeAccents(ROLES.ENCARGADO.toLowerCase()) || rNorm === normalizeAccents(ROLES.ENCARGADA.toLowerCase());
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
