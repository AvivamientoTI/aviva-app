// Hook personalizado para verificar permisos
import { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';

export function usePermissions() {
  const { userMemberships, managedDepartments, isServicioGeneralLeader } = useUser();

  const permissions = useMemo(() => {
    const isAdmin = isServicioGeneralLeader();

    return {
      // Permisos globales
      canManageAllDepartments: isAdmin,
      canManageUsers: isAdmin,
      canViewAllSchedules: true, // Todos pueden ver calendarios

      // Permisos por departamento
      canManageDepartment: (deptId) => {
        return managedDepartments.some(d => d.id === Number(deptId));
      },

      canManageAttendance: (deptId) => {
        return attendanceManagedDepartments.some(d => d.id === Number(deptId));
      },

      // Permisos de planificación
      canCreateSchedule: (deptId) => {
        return managedDepartments.some(d => d.id === Number(deptId));
      },

      canApproveSchedule: (deptId) => {
        const membership = userMemberships.find(m => m.departamento_id === Number(deptId));
        const rol = membership?.rol_jerarquico?.toLowerCase() || '';
        return rol === 'líder' || rol === 'lider';
      },

      // Permisos de posiciones
      canManagePositions: (deptId) => {
        return managedDepartments.some(d => d.id === Number(deptId));
      },

      // Permisos de asignaciones
      canModifyAssignments: (deptId) => {
        return managedDepartments.some(d => d.id === Number(deptId));
      },

      // Permisos de ausencias
      canManageAbsences: (userId) => {
        // Líderes pueden gestionar ausencias de miembros de sus departamentos
        const targetUserMemberships = userMemberships.filter(m => m.usuario_id === userId);
        return targetUserMemberships.some(tm =>
          managedDepartments.some(md => md.id === tm.departamento_id)
        );
      },

      // Lista de departamentos gestionables
      getManagedDepartmentIds: () => managedDepartments.map(d => d.id),

      // Obtener opciones de departamentos para selects
      getDepartmentOptions: () => {
        return managedDepartments.map(d => ({
          value: String(d.id),
          label: d.nombre,
        }));
      },
    };
  }, [userMemberships, managedDepartments, isServicioGeneralLeader]);

  return permissions;
}
