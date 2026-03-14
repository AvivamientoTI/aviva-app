import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

export interface UserMembership {
    rol_jerarquico: string;
    departamento: {
        id: number;
        nombre: string;
    } | null;
}

export interface UserWithMemberships {
    id: number;
    nombre: string;
    apellido: string;
    username: string | null;
    email_personal: string | null;
    genero: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
    membresias: UserMembership[];
}

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*, membresias(rol_jerarquico, departamento:departamentos(id, nombre))')
                .order('nombre');

            if (error) throw error;
            return data as UserWithMemberships[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
