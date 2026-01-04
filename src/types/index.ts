export interface User {
    id: string; // auth id (uuid)
    email?: string;
}

export interface UserProfile {
    id: number;
    usuario_id: number; // int id from usuarios table
    auth_user_id: string; // uuid from auth
    // ... other profile fields
}

export interface Department {
    id: number;
    nombre: string;
    prioridad?: number;
}

export interface Position {
    id: number;
    nombre: string;
    departamento_id: number;
    cantidad_default: number;
    genero_requerido?: 'M' | 'F' | 'A';
    orden?: number;
}

export interface PublicUser {
    id: number;
    nombre: string;
    apellido: string;
    genero?: string;
    roles?: string[]; // Array of role names
}

export interface Membership {
    id: number;
    usuario_id: number;
    departamento_id: number;
    rol_jerarquico?: string;
    departamento?: Department;
    usuario?: PublicUser;
}

export interface DayConfiguration {
    id: number;
    fecha: string;
    tipo_servicio: string;
    color_uniforme?: string;
    rol_cabecera_id: number;
    encargado?: { nombre: string; apellido: string };
    roles_cabecera?: {
        departamento_id: number;
        departamento?: Department;
        mes?: number;
        anio?: number;
    }
}

export interface Assignment {
    id: number;
    usuario_id: number;
    usuario: { nombre: string; apellido: string };
    posicion: { nombre: string; genero_requerido?: string; orden?: number };
    configuracion_dia: DayConfiguration;
    fecha?: string;
}

export interface MonthlyStat {
    month: string;
    asistio: number;
    faltas: number;
}

export interface StatsData {
    summary: {
        total: number;
        asistio: number;
        faltoConAviso: number;
        faltoSinAviso: number;
    };
    byMonth: Record<string, MonthlyStat>;
}

