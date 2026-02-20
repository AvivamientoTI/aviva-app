export interface TransformerAssignment {
    id: number | string;
    orden?: number;
    usuario_id?: number;
    usuario?: {
        id?: number;
        nombre: string;
        apellido: string;
        genero?: string | null;
    };
    posicion?: {
        nombre?: string;
        orden?: number;
    } | string | Array<{ nombre?: string; orden?: number }>;
    posiciones_departamento?: {
        orden?: number;
    } | Array<{ orden?: number }>;
    configuracion_dia?: {
        fecha: string;
        tipo_servicio: string;
        color_uniforme?: string;
        encargado?: {
            id: number;
            nombre: string;
            apellido: string;
        };
        roles_cabecera?: Array<{
            departamento_id: number;
            departamento?: {
                nombre: string;
            };
        }>;
    };
    roles_cabecera?: Array<{
        departamento_id: number;
        departamento?: {
            nombre: string;
        };
    }>;
}

export interface CalendarAssignment {
    id: number | string;
    usuario_id?: number;
    nombre: string;
    posicion: string;
    posicionObj?: any; // Keep ref to original if needed
    uniforme: string;
    servicio: string;
    usuario?: {
        nombre?: string;
        apellido?: string;
        genero?: string | null;
    };
    orden: number;
    departamento_id?: number;
    resource?: any; // For calendar event resource
}
