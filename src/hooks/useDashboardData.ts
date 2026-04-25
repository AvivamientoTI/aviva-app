import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from './usePermissions';

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
    const { userProfile, userMemberships, attendanceManagedDepartments } = useUser();
    const permissions = usePermissions();
    const userId = userProfile?.usuario_id;

    // Servidores dept ID — attendance is always recorded there
    const servidoresDeptId = userMemberships.find(
        m => m.departamento?.nombre?.toLowerCase() === 'servidores'
    )?.departamento?.id ?? null;

    const effectiveDeptId = selectedDeptId
        ?? (userMemberships.length > 0 ? userMemberships[0].departamento?.id ?? null : null);

    // Dept the user leads (for dept stats card)
    const managedDeptId = attendanceManagedDepartments?.[0]?.id ?? null;
    const isLeader = permissions.isLiderOrSublider || permissions.isSystemAdmin;

    const {
        data: upcoming = [],
        isLoading: loadingUpcoming,
        error: errorUpcoming
    } = useQuery({
        queryKey: ['upcomingServices', userId],
        queryFn: () => analyticsService.fetchUpcomingServices(userId!),
        enabled: !!userId,
        staleTime: 1000 * 30,
        select: (data) => data as UpcomingService[]
    });

    const {
        data: upcomingCount = 0,
        isLoading: loadingUpcomingCount
    } = useQuery({
        queryKey: ['upcomingServicesCount', userId],
        queryFn: () => analyticsService.fetchUpcomingCount(userId!),
        enabled: !!userId,
        staleTime: 1000 * 30,
    });

    // Personal stats — always shown for all users
    const {
        data: personalStats = null,
        isLoading: loadingPersonal,
        error: errorPersonal
    } = useQuery({
        queryKey: ['personalStats', userId, servidoresDeptId],
        queryFn: () => analyticsService.fetchUserAttendanceStats(userId!, servidoresDeptId!, 'YTD'),
        enabled: !!userId && !!servidoresDeptId,
        staleTime: 1000 * 30,
        select: (data) => data as StatsData
    });

    // Dept stats — only for leaders
    const {
        data: deptStats = null,
        isLoading: loadingDept,
    } = useQuery({
        queryKey: ['deptStats', managedDeptId ?? effectiveDeptId],
        queryFn: () => analyticsService.fetchAttendanceStats((managedDeptId ?? effectiveDeptId)!, 'YTD'),
        enabled: isLeader && !!(managedDeptId ?? effectiveDeptId),
        staleTime: 1000 * 30,
        select: (data) => data as StatsData
    });

    return {
        upcoming,
        upcomingCount,
        personalStats,
        deptStats,
        isLeader,
        effectiveDeptId,
        loading: loadingUpcoming || loadingUpcomingCount || loadingPersonal || (isLeader && loadingDept),
        error: errorUpcoming || errorPersonal
    };
};
