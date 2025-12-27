import { useMemo } from 'react';
import type { DepartmentMember } from '../../../services/attendanceService';

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
    loadingAssignedUsers: boolean
) => {
    return useMemo(() => {
        if (loadingAssignedUsers) {
            return [];
        }

        const assignedUserIdsOnDay = new Set(allAssignedUsersOnDay.map(id => String(id)));

        const currentUserId = String(swapTarget?.usuario_id);
        if (currentUserId) {
            assignedUserIdsOnDay.delete(currentUserId);
        }

        const posNameNorm = normalize(swapTarget?.resource?.posicion?.nombre || swapTarget?.posicion);
        const isEncargadoPos = posNameNorm.includes('encargad');

        const filteredUsers = users.filter((u: any) => {
            // DEBUG: Log de género requerido y género del usuario
            /*
            if (import.meta.env.DEV) {
                const requiredGender = swapTarget?.posicionObj?.genero_requerido;
                const userGender = u.genero || u.usuario?.genero;
                console.log(
                  `DEBUG swap: requiredGender=${requiredGender} | userGender=${userGender} | userId=${u.id} | nombre=${u.nombre || (u.usuario && u.usuario.nombre)}`,
                  u
                );
            }
            */
            const isExcluded = assignedUserIdsOnDay.has(String(u.id));
            if (isExcluded) return false;

            // Validación estricta: solo swapTarget.posicionObj y user.genero
            const requiredGender = swapTarget?.posicionObj?.genero_requerido || 'A';
            const userGender = u.genero || u.usuario?.genero;
            const genderMatch = !requiredGender || requiredGender === 'A' || userGender === requiredGender;

            if (!genderMatch) return false;

            if (isEncargadoPos) {
                return u.roles?.some((r: string) => {
                    const rNorm = normalize(r);
                    return rNorm.includes('lider') || rNorm.includes('encargad') || rNorm.includes('sublider');
                });
            }
            return true;
        });

        // console.log(`✅ Usuarios disponibles: ${filteredUsers.length}/${users.length} (EncargadoPos: ${isEncargadoPos})`);

        return filteredUsers.map((u: any) => ({ value: String(u.id), label: `${u.nombre} ${u.apellido}` }));
    }, [users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers]);
};
