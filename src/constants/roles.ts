export const ROLES = {
    // Leadership roles
    LIDER: 'Líder',
    SUBLIDER: 'Sublíder',
    ENCARGADO: 'Encargado',
    ENCARGADA: 'Encargada',
    // Member roles
    SERVIDOR: 'Servidor',
    SERVIDORA: 'Servidora',
    // System roles
    ADMIN: 'Admin'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
