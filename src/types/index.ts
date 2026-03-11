import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

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

export type Department = Tables<'departamentos'>;

export type Position = Tables<'posiciones_departamento'>;

export interface PublicUser {
    id: number;
    nombre: string;
    apellido: string;
    genero?: string;
    roles?: string[]; // Array of role names
    activo?: boolean;
}

export interface Membership extends Tables<'membresias'> {
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
    encargado_2?: { nombre: string; apellido: string };
    encargado_id?: number;
    encargado_2_id?: number;
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

