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
    posicion: { nombre: string; genero_requerido?: string };
    configuracion_dia: DayConfiguration;
    // Computed/joined fields for UI convenience
    nombre?: string;
    // ...
}
