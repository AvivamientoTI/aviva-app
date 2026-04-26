export interface TransformerAssignment {
    id: number | string;
    orden?: number;
    usuario_id?: number;
    configuracion_dia_id?: number;
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
        id?: number;
        fecha: string;
        tipo_servicio: string;
        color_uniforme?: string;
        hora_llegada?: string | null;
        service_index?: number;
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
    posicionObj?: TransformerAssignment['posicion'];
    uniforme: string;
    servicio: string;
    hora_llegada?: string | null;
    usuario?: {
        nombre?: string;
        apellido?: string;
        genero?: string | null;
    };
    orden: number;
    departamento_id?: number;
}

export interface CalendarEvent {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: TransformerAssignment;
}
