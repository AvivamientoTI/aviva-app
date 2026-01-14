import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { useUser } from '../contexts/UserContext';

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
    const userId = userProfile?.usuario_id;

    const {
        data: upcoming = [],
        isLoading: loadingUpcoming,
        error: errorUpcoming
    } = useQuery({
        queryKey: ['upcomingServices', userId],
        queryFn: () => analyticsService.fetchUpcomingServices(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const {
        data: stats = null,
        isLoading: loadingStats,
        error: errorStats
    } = useQuery({
        queryKey: ['attendanceStats', selectedDeptId],
        queryFn: () => analyticsService.fetchAttendanceStats(selectedDeptId!),
        enabled: !!selectedDeptId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    return {
        upcoming: upcoming as UpcomingService[],
        stats: stats as StatsData | null,
        loading: loadingUpcoming || (!!selectedDeptId && loadingStats),
        error: errorUpcoming || errorStats
    };
};
