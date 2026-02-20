import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from './usePermissions';

// Types derived from what was in Dashboard.tsx
export interface UpcomingService {
    id: string | number;
    posicion?: {
        nombre: string;
        departamento?: { nombre: string } | { nombre: string }[];
    } | {
        nombre: string;
        departamento?: { nombre: string } | { nombre: string }[];
    }[];
    configuracion_dia: {
        fecha: string;
        tipo_servicio: string;
        color_uniforme: string;
    } | {
        fecha: string;
        tipo_servicio: string;
        color_uniforme: string;
    }[];
}

export interface MonthlyStat {
    month: string;
    asistio: number;
    faltas: number;
}

export interface StatsData {
    summary: {
        total: number;
        asistio: number;
        faltoConAviso: number;
        faltoSinAviso: number;
    };
    byMonth: Record<string, MonthlyStat> | MonthlyStat[];
}

export const useDashboardData = (selectedDeptId: number | null) => {
    const { userProfile } = useUser();
    const permissions = usePermissions();
    const userId = userProfile?.usuario_id;

    // Use departmental stats if user is Admin or Leader of the selected department
    const shouldShowDeptStats = selectedDeptId ? permissions.canViewReports(selectedDeptId) : false;

    const {
        data: upcoming = [],
        isLoading: loadingUpcoming,
        error: errorUpcoming
    } = useQuery({
        queryKey: ['upcomingServices', userId],
        queryFn: () => analyticsService.fetchUpcomingServices(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const {
        data: upcomingCount = 0,
        isLoading: loadingUpcomingCount
    } = useQuery({
        queryKey: ['upcomingServicesCount', userId],
        queryFn: () => analyticsService.fetchUpcomingCount(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: stats = null,
        isLoading: loadingStats,
        error: errorStats
    } = useQuery({
        queryKey: ['attendanceStats', selectedDeptId, userId, shouldShowDeptStats],
        queryFn: () => shouldShowDeptStats
            ? analyticsService.fetchAttendanceStats(selectedDeptId!, 'YTD')
            : analyticsService.fetchUserAttendanceStats(userId!, selectedDeptId!, 'YTD'),
        enabled: !!selectedDeptId && !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    return {
        upcoming: upcoming as UpcomingService[],
        upcomingCount,
        stats: stats as StatsData | null,
        shouldShowDeptStats,
        loading: loadingUpcoming || loadingUpcomingCount || (!!selectedDeptId && loadingStats),
        error: errorUpcoming || errorStats
    };
};
