import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { usePermissions } from '../usePermissions';
import type { Department } from '../../types';

export const useDepartments = () => {
    const permissions = usePermissions();

    return useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('departamentos')
                .select('*')
                .order('nombre');

            if (error) throw error;
            return data as Department[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour (departments change rarely)
        select: (data) => {
            // Filtrar 'Administración' para que no sea gestionable operativamente en la UI
            const filteredData = data.filter(d => d.nombre !== 'Administración');
            const manageable = filteredData.filter(d => permissions.canManageDepartment(d.id));

            // Calculate metadata mapping
            const meta: Record<string, { prioridad: number }> = {};
            const priorityOneIds: number[] = [];

            data.forEach(d => {
                const priority = Number(d.prioridad);
                meta[String(d.id)] = { prioridad: priority };
                if (priority === 1) priorityOneIds.push(d.id);
            });

            return {
                all: data,
                manageable,
                options: manageable.map(d => ({ value: String(d.id), label: d.nombre })),
                meta,
                priorityOneIds
            };
        }
    });
};
