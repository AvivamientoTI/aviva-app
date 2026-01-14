import { useMemo } from 'react';
import { useAssignments as useAssignmentsData } from '../../../hooks/queries/useAssignments';
import { groupAssignmentsByDate, transformToCalendarEvents } from '../../../utils/calendar/dataTransformers';

/**
 * Hook para gestionar asignaciones de un departamento (Refactorizado con React Query)
 */
export function useAssignments(departmentId: string | undefined | null) {
    const {
        data = [],
        isLoading,
        isError,
        refetch,
        isFetching,
        deleteAssignment,
        swapAssignment
    } = useAssignmentsData(departmentId as string | number | null);

    const { groupedAssignments, calendarEvents } = useMemo(() => {
        if (!data || data.length === 0) {
            return { groupedAssignments: {}, calendarEvents: [] };
        }
        return {
            groupedAssignments: groupAssignmentsByDate(data),
            calendarEvents: transformToCalendarEvents(data)
        };
    }, [data]);

    return {
        groupedAssignments,
        calendarEvents,
        loading: isLoading,
        isFetching,
        refetch,
        isError,
        deleteAssignment,
        swapAssignment
    };
}
