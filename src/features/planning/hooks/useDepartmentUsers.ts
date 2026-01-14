import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabaseClient';
import type { PublicUser } from '../../../types';

interface DepartmentUser extends PublicUser {
    rol_jerarquico: string;
}

export const useDepartmentUsers = (deptId: number | string | null) => {
    return useQuery({
        queryKey: ['department-users', deptId],
        queryFn: async () => {
            if (!deptId) return [];

            const { data, error } = await supabase
                .from('membresias')
                .select('rol_jerarquico, usuario:usuarios(*)')
                .eq('departamento_id', deptId);

            if (error) throw error;

            return data.map((m: any) => ({
                ...m.usuario,
                rol_jerarquico: m.rol_jerarquico
            })) as DepartmentUser[];
        },
        enabled: !!deptId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
