import { useMemo } from 'react';
import type { DepartmentMember } from '../../../services/attendanceService';
import { formatName } from '../../../utils/formatName';

const normalize = (str: string | undefined): string =>
    str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

interface SwapTarget {
    id: string | number;
    usuario_id: string | number;
    resource?: {
        posicion?: {
            nombre?: string;
        };
    };
    posicion?: string;
    posicionObj?: {
        genero_requerido?: string;
    };
}

// TODO: Replace 'any' with DepartmentMember when possible, assuming users is compatible with DepartmentMember
export const useAvailableUsersForSwap = (
    users: DepartmentMember[],
    swapTarget: SwapTarget | null,
    allAssignedUsersOnDay: (string | number)[],
    blockedUserIds: Set<string>,
    loadingAssignedUsers: boolean
) => {
    return useMemo(() => {
        if (loadingAssignedUsers) {
            return [];
        }

        const assignedUserIdsOnDay = new Set(allAssignedUsersOnDay.map(id => String(id)));

        // Fusionamos con los bloqueados globales
        blockedUserIds.forEach(id => assignedUserIdsOnDay.add(id));

        const posNameNorm = normalize(swapTarget?.resource?.posicion?.nombre || swapTarget?.posicion);
        const isEncargadoPos = posNameNorm.includes('encargad');

        const filteredUsers = users.filter((u: any) => {
            const uIdStr = String(u.id);
            
            // 1. Availability check (Global Conflict)
            // Incluimos al usuario que estamos intentando cambiar (swapTarget) para que aparezca en la lista
            const isExcluded = assignedUserIdsOnDay.has(uIdStr) && uIdStr !== String(swapTarget?.usuario_id);
            if (isExcluded) return false;

            // 2. Gender check (Strict)
            const requiredGender = String(swapTarget?.posicionObj?.genero_requerido || 'A').toUpperCase();
            const userGen = String(u.genero || u.usuario?.genero || '').toUpperCase();
            
            if (requiredGender !== 'A' && userGen !== requiredGender) return false;

            // 3. Encargado Pos Logic
            if (isEncargadoPos) {
                const leaderRoles = ['lider', 'sublider', 'encargad', 'liderazgo'];
                return u.roles?.some((r: string) => {
                    const rNorm = normalize(r);
                    return leaderRoles.some(role => rNorm.includes(role));
                });
            }
            return true;
        });

        return filteredUsers.map((u: any) => ({ value: String(u.id), label: formatName(u.nombre, u.apellido) }));
    }, [users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers]);
};
