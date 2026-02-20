import { useUser } from '../contexts/UserContext';
import { ROLES } from '../constants/roles';
import { DEPARTMENTS } from '../constants/departments';

export function usePermissions() {
    const { userMemberships } = useUser();

    // Helper to check if user has a specific role in a specific department
    // If department is null, checks for role in any department
    const hasRole = (role: string, department?: string) => {
        return userMemberships?.some(m => {
            const r = m.rol_jerarquico?.toLowerCase();
            const d = m.departamento?.nombre?.toLowerCase();

            const roleMatch = r === role.toLowerCase();
            const deptMatch = department ? d === department.toLowerCase() : true;

            return roleMatch && deptMatch;
        });
    };

    const isMember = Boolean(userMemberships && userMemberships.length > 0);

    console.log('[usePermissions] State:', {
        count: userMemberships?.length,
        isMember
    });

    const isLiderOrSublider = userMemberships?.some(m => {
        const r = m.rol_jerarquico?.toLowerCase();
        return r === ROLES.LIDER.toLowerCase() || r === 'lider' || r === ROLES.SUBLIDER.toLowerCase() || r === 'sublider';
    });

    const isLiderOrSubliderServidores = userMemberships?.some(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === DEPARTMENTS.SERVIDORES.toLowerCase() && (
            rol === ROLES.LIDER.toLowerCase() || rol === 'lider' ||
            rol === ROLES.SUBLIDER.toLowerCase() || rol === 'sublider'
        );
    });

    const isLiderSubliderEncargadoServidores = userMemberships?.some(m => {
        const nombreDept = m.departamento?.nombre?.toLowerCase() || '';
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === DEPARTMENTS.SERVIDORES.toLowerCase() && (
            rol === ROLES.LIDER.toLowerCase() || rol === 'lider' ||
            rol === ROLES.SUBLIDER.toLowerCase() || rol === 'sublider' ||
            rol === ROLES.ENCARGADO.toLowerCase() || rol === ROLES.ENCARGADA.toLowerCase()
        );
    });

    const canManageAllDepartments = userMemberships?.some(m => {
        const nombreDept = m.departamento?.nombre;
        const rol = m.rol_jerarquico?.toLowerCase() || '';
        return nombreDept === DEPARTMENTS.SERVIDORES && (
            rol === ROLES.LIDER.toLowerCase() || rol === 'lider' ||
            rol === ROLES.SUBLIDER.toLowerCase() || rol === 'sublider'
        );
    }) ?? false;

    const canManageUsers = isLiderOrSublider;

    const canManagePositions = (deptId: number) => {
        return userMemberships?.some(m => {
            const r = m.rol_jerarquico?.toLowerCase();

            // Managers can manage their own department
            if (r === ROLES.LIDER.toLowerCase() || r === 'lider' || r === ROLES.SUBLIDER.toLowerCase() || r === 'sublider') {
                return m.departamento?.id === deptId;
            }
            return false;
        }) ?? false;
    };

    const canManageDepartment = (deptId: number) => {
        return canManagePositions(deptId);
    };

    const canCreateSchedule = (deptId: number | string | null) => {
        if (!deptId) return false;
        return canManagePositions(Number(deptId));
    };

    const canModifyAssignments = (deptId: number | string | null) => {
        if (!deptId) return false;
        return canManagePositions(Number(deptId));
    };

    return {
        hasRole,
        isServidoresMember: isMember,
        isLiderOrSublider,
        isLiderOrSubliderServidores,
        isLiderSubliderEncargadoServidores,
        canManageAllDepartments,
        canManageUsers,
        canManagePositions,
        canManageDepartment,
        canCreateSchedule,
        canModifyAssignments
    };
}
