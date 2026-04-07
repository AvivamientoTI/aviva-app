import { useUser } from '../contexts/UserContext';
import { DEPARTMENTS } from '../constants/departments';
import { parseRoles } from '../utils/roleUtils';

export function usePermissions() {
    const { userMemberships } = useUser();

    const userRoles = (m: any) => parseRoles(m.rol_jerarquico);

    // Global Admin Check: ONLY 'Admin' role users (Decoupled from 'Servidores' Leader)
    const isSystemAdmin = userMemberships?.some(m => userRoles(m).isAdmin) ?? false;

    // Permissions by functional area

    // 1. Department Management (Positions, Uniforms, Settings)
    const canManageDepartment = (deptId: number) => {
        if (isSystemAdmin) return true;
        return userMemberships?.some(m => {
            const { isLider, isSublider } = userRoles(m);
            return m.departamento_id === deptId && (isLider || isSublider);
        }) ?? false;
    };

    // 2. User Management (Invitations, Roles, etc.)
    const canManageUsers = isSystemAdmin || (userMemberships?.some(m => userRoles(m).isAnyLeader) ?? false);

    // 3. Planning (Role creation, monthly schedules)
    const canCreateSchedule = (deptId: number | string | null) => {
        if (!deptId) return false;
        if (isSystemAdmin) return true;
        return canManageDepartment(Number(deptId));
    };

    // 4. Assignments (Modifying planned services)
    const canModifyAssignments = (deptId: number | string | null) => {
        if (!deptId) return false;
        if (isSystemAdmin) return true;
        return canManageDepartment(Number(deptId));
    };

    // 5. Attendance (Recording assisted/absent) - Exclusive to Servidores department
    const canManageAttendance = (deptId: number | string | null) => {
        if (!deptId) return false;
        if (isSystemAdmin) return true;
        return userMemberships?.some(m => {
            const { isLider, isSublider, isEncargado, isAdmin } = userRoles(m);
            const isTargetDept = m.departamento_id === Number(deptId);
            const isServidores = m.departamento?.nombre === DEPARTMENTS.SERVIDORES;
            return isTargetDept && isServidores && (isLider || isSublider || isEncargado || isAdmin);
        }) ?? false;
    };

    // 6. Reports (Impact, statistics)
    const canViewReports = (deptId: number | string | null) => {
        if (!deptId) return false;
        if (isSystemAdmin) return true;
        return canManageDepartment(Number(deptId));
    };

    // 7. Global Visibility (Permission to view calendars from all departments)
    const canViewAllSchedules = isSystemAdmin || (userMemberships?.some(m => userRoles(m).isAnyLeader) ?? false);

    return {
        isSystemAdmin,
        canManageDepartment,
        canManageUsers,
        canCreateSchedule,
        canModifyAssignments,
        canManageAttendance,
        canViewReports,
        canViewAllSchedules,
        // Legacy helpers for compatibility if needed, though they should be migrated
        isLiderOrSublider: userMemberships?.some(m => userRoles(m).isAnyLeader) ?? false,
        canManageAllDepartments: isSystemAdmin,
        canManagePositions: canManageDepartment,
        
        // Restored for App.tsx & DashboardLayout routing
        isServidoresMember: userMemberships?.some(m => m.departamento?.nombre === DEPARTMENTS.SERVIDORES) ?? false,
        isLiderSubliderEncargadoServidores: userMemberships?.some(m => {
            const { isLider, isSublider, isEncargado, isAdmin } = userRoles(m);
            return m.departamento?.nombre === DEPARTMENTS.SERVIDORES && (isLider || isSublider || isEncargado || isAdmin);
        }) ?? false,
        isLiderOrSubliderServidores: userMemberships?.some(m => {
            const { isLider, isSublider, isAdmin } = userRoles(m);
            return m.departamento?.nombre === DEPARTMENTS.SERVIDORES && (isLider || isSublider || isAdmin);
        }) ?? false
    };
}
