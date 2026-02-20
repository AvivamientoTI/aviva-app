import { useUser } from '../contexts/UserContext';
import { ROLES } from '../constants/roles';
import { DEPARTMENTS } from '../constants/departments';

export function usePermissions() {
    const { userMemberships } = useUser();

    const userRoles = (m: any) => {
        const r = m.rol_jerarquico?.toLowerCase() || '';
        const isLider = r === ROLES.LIDER.toLowerCase() || r === 'lider';
        const isSublider = r === ROLES.SUBLIDER.toLowerCase() || r === 'sublider';
        const isEncargado = r === ROLES.ENCARGADO.toLowerCase() || r === 'encargado' || r === ROLES.ENCARGADA.toLowerCase() || r === 'encargada';
        const isServidor = r === ROLES.SERVIDOR.toLowerCase() || r === 'servidor' || r === ROLES.SERVIDORA.toLowerCase() || r === 'servidora';
        const isAdmin = r === ROLES.ADMIN.toLowerCase() || r === 'admin';

        return { isLider, isSublider, isEncargado, isServidor, isAdmin, isAnyLeader: isLider || isSublider || isAdmin };
    };

    // Global Admin Check (Role Admin OR Leader in 'Servidores')
    const isSystemAdmin = userMemberships?.some(m => {
        const { isAdmin, isLider, isSublider } = userRoles(m);
        const isServidoresDept = m.departamento?.nombre === DEPARTMENTS.SERVIDORES;
        return isAdmin || (isServidoresDept && (isLider || isSublider));
    }) ?? false;

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

    return {
        isSystemAdmin,
        canManageDepartment,
        canManageUsers,
        canCreateSchedule,
        canModifyAssignments,
        canManageAttendance,
        canViewReports,
        // Legacy helpers for compatibility if needed, though they should be migrated
        isLiderOrSublider: userMemberships?.some(m => userRoles(m).isAnyLeader) ?? false,
        canManageAllDepartments: isSystemAdmin,
        canManagePositions: canManageDepartment
    };
}
