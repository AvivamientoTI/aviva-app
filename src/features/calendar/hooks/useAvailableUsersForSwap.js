import { useMemo } from 'react';

const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

export const useAvailableUsersForSwap = (users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers) => {
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

    const filteredUsers = users.filter(u => {
      const isExcluded = assignedUserIdsOnDay.has(String(u.id));
      if (isExcluded) return false;

      const requiredGender = swapTarget?.resource?.posicion?.genero_requerido || swapTarget?.posicion?.genero_requerido;
      const genderMatch = !requiredGender || requiredGender === 'A' || u.genero === requiredGender;

      if (!genderMatch) return false;

      if (isEncargadoPos) {
        return u.roles.some(r => r.includes('lider') || r.includes('encargad') || r.includes('sublider'));
      }
      return true;
    });

    console.log(`✅ Usuarios disponibles: ${filteredUsers.length}/${users.length} (EncargadoPos: ${isEncargadoPos})`);

    return filteredUsers.map(u => ({ value: String(u.id), label: `${u.nombre} ${u.apellido}` }));
  }, [users, swapTarget, allAssignedUsersOnDay, loadingAssignedUsers]);
};
