import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

export interface Uniform {
    id: number;
    nombre: string;
    departamento_id: number;
}

export const useUniforms = (departmentId: string | number | null) => {
    return useQuery({
        queryKey: ['uniforms', departmentId],
        queryFn: async () => {
            if (!departmentId) return [];
            const { data, error } = await supabase
                .from('uniformes_departamento' as any)
                .select('*')
                .eq('departamento_id', Number(departmentId))
                .order('nombre');

            if (error) throw error;
            return data as unknown as Uniform[];
        },
        enabled: !!departmentId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
