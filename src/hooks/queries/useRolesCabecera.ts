import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

interface RolesCabeceraHelperProps {
    departmentId: string | number | null;
    month: number | null; // 1-12
    year: number | null;
}

export const useRoleHeader = ({ departmentId, month, year }: RolesCabeceraHelperProps) => {
    return useQuery({
        queryKey: ['roles_cabecera', departmentId, month, year],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('roles_cabecera')
                .select('*')
                .eq('departamento_id', Number(departmentId))
                .eq('mes', month)
                .eq('anio', year)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" errors if using maybeSingle, but helpful to be explicit
            return data; // returns object or null
        },
        enabled: !!departmentId && !!month && !!year,
        staleTime: 0, // Always check fresh status for approval steps
    });
};
