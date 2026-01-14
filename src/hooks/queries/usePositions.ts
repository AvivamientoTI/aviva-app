import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import type { Position } from '../../types';

export const usePositions = (departmentId: string | number | null) => {
    return useQuery({
        queryKey: ['positions', departmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('posiciones_departamento')
                .select('*')
                .eq('departamento_id', departmentId)
                .order('nombre');

            if (error) throw error;
            return data as Position[];
        },
        enabled: !!departmentId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
