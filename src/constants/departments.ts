export const DEPARTMENTS = {
    SERVIDORES: 'Servidores',
    CONSOLIDACIÓN: 'Consolidación',
    ADMINISTRACION: 'Administración'
} as const;

export type DepartmentType = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];
