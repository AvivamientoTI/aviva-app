import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

export interface DepartmentMember {
    id: number;
    nombre: string;
    apellido: string;
    rol_jerarquico: string;
}

export const useDepartmentMembers = (departmentId: string | number | null) => {
    return useQuery({
        queryKey: ['department-members', departmentId],
        queryFn: async () => {
            if (!departmentId) return [];
            
            const { data, error } = await supabase
                .from('membresias')
                .select(`
                    rol_jerarquico,
                    usuario:usuarios (
                        id,
                        nombre,
                        apellido
                    )
                `)
                .eq('departamento_id', Number(departmentId));

            if (error) throw error;
            
            // Flatten the result
            return (data || []).map((m: any) => ({
                id: m.usuario.id,
                nombre: m.usuario.nombre,
                apellido: m.usuario.apellido,
                rol_jerarquico: m.rol_jerarquico
            })) as DepartmentMember[];
        },
        enabled: !!departmentId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
