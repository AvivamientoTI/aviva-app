import { ROLES } from '../constants/roles';

export function parseRoles(rolJerarquico?: string | null) {
    const r = rolJerarquico?.toLowerCase()?.trim() || '';
    
    // Normalizando y validando a través del diccionario
    const isLider = r === ROLES.LIDER.toLowerCase() || r === 'lider';
    const isSublider = r === ROLES.SUBLIDER.toLowerCase() || r === 'sublider';
    const isEncargado = r === ROLES.ENCARGADO.toLowerCase() || r === 'encargado' || r === ROLES.ENCARGADA.toLowerCase() || r === 'encargada';
    const isServidor = r === ROLES.SERVIDOR.toLowerCase() || r === 'servidor' || r === ROLES.SERVIDORA.toLowerCase() || r === 'servidora';
    const isAdmin = r === ROLES.ADMIN.toLowerCase() || r === 'admin';

    return { 
        isLider, 
        isSublider, 
        isEncargado, 
        isServidor, 
        isAdmin, 
        isAnyLeader: isLider || isSublider || isAdmin 
    };
}
