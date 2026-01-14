import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService } from '../../services/assignmentsService';

export const useAssignments = (deptId: number | string | null) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['assignments', deptId],
        queryFn: () => assignmentsService.fetchByDepartment(deptId!),
        enabled: !!deptId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const deleteAssignment = useMutation({
        mutationFn: (id: number | string) => assignmentsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments', deptId] });
        },
    });

    const swapAssignment = useMutation({
        mutationFn: ({ assignmentId, newUserId }: { assignmentId: number | string, newUserId: number | string }) =>
            assignmentsService.swap(assignmentId, newUserId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments', deptId] });
        },
    });

    return {
        ...query,
        deleteAssignment,
        swapAssignment,
    };
};
