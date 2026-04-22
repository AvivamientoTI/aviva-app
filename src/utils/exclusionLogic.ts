import { supabase } from '../services/supabaseClient';
import dayjs from 'dayjs';


/**
 * Fetches users who have NO assignments at all on the given date (strict).
 * Uses a Supabase RPC to bypass RLS for global conflict detection.
 */
export const getUsersNotAssignedOnDate = async <T extends { id: number | string }>(
  date: string | Date | dayjs.Dayjs | null, 
  allUsers: T[],
  excludeHeaderId?: number | string
): Promise<T[]> => {
  const blockedIds = new Set<string>();

  // Normalizar fecha (YYYY-MM-DD) usando dayjs para mayor robustez
  const normalizedDate = date ? dayjs(date).format('YYYY-MM-DD') : '';
  if (!normalizedDate || normalizedDate === 'Invalid Date') return allUsers;

  try {
    const { data: blockedResults, error } = await supabase.rpc('get_blocked_users', {
      p_date: normalizedDate,
      p_exclude_role_id: excludeHeaderId ? Number(excludeHeaderId) : null
    }) as { data: { usuario_id: number }[] | null; error: any };

    if (error) {
      console.error('❌ [GlobalExclusion] RPC Error:', error);
      // En caso de error, preferimos no bloquear a nadie globalmente para no romper la app,
      // pero logueamos fuerte para depurar.
    } else if (blockedResults) {
      blockedResults.forEach(row => {
        if (row.usuario_id) {
          blockedIds.add(String(row.usuario_id));
        }
      });
    }
  } catch (err) {
    console.error('❌ [GlobalExclusion] Exception fetching blocked users:', err);
  }

  // Filter out any user who has a global assignment, absence or is inactive
  return allUsers.filter(u => !blockedIds.has(String(u.id)));
};
