/**
 * Fetches users who have NO assignments at all on the given date (strict).
 * Uses a Supabase RPC to bypass RLS for global conflict detection.
 */
export const getUsersNotAssignedOnDate = async (date, allUsers) => {
  const blockedIds = new Set();

  try {
    const { data: blockedResults, error } = await supabase.rpc('get_blocked_users', {
      p_date: date
    });

    if (error) throw error;

    if (blockedResults) {
      blockedResults.forEach(row => {
        if (row.usuario_id) {
          blockedIds.add(String(row.usuario_id));
        }
      });
    }
  } catch (err) {
    console.error('❌ [GlobalExclusion] Error fetching blocked users via RPC:', err);
  }

  // Filter out any user who has a global assignment or absence
  return allUsers.filter(u => !blockedIds.has(String(u.id)));
};
