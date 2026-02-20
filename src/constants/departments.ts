export const DEPARTMENTS = {
    SERVIDORES: 'Servidores',
    CONSOLIDACIÓN: 'Consolidación',
} as const;

export type DepartmentType = typeof DEPARTMENTS[keyof typeof DEPARTMENTS];
