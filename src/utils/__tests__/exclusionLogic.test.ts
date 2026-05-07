import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsersNotAssignedOnDate } from '../exclusionLogic';

vi.mock('../../services/supabaseClient', () => ({
    supabase: {
        rpc: vi.fn()
    }
}));

import { supabase } from '../../services/supabaseClient';

describe('exclusionLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return all users if date is invalid', async () => {
        const allUsers = [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];
        const result = await getUsersNotAssignedOnDate('Invalid Date', allUsers);
        expect(result).toEqual(allUsers);
    });

    it('should filter out users returned by get_blocked_users RPC', async () => {
        const allUsers = [
            { id: '1', name: 'User 1' },
            { id: '2', name: 'User 2' },
            { id: '3', name: 'User 3' }
        ];
        
        // Mock RPC response
        (supabase.rpc as any).mockResolvedValue({
            data: [{ usuario_id: '2' }],
            error: null
        });

        const result = await getUsersNotAssignedOnDate('2024-05-20', allUsers);
        
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ id: '1', name: 'User 1' });
        expect(result).toContainEqual({ id: '3', name: 'User 3' });
        expect(result).not.toContainEqual({ id: '2', name: 'User 2' });
        
        expect(supabase.rpc).toHaveBeenCalledWith('get_blocked_users', {
            p_date: '2024-05-20',
            p_service_index: null
        });
    });

    it('should handle RPC errors gracefully and return all users', async () => {
        const allUsers = [{ id: '1', name: 'User 1' }];
        
        (supabase.rpc as any).mockResolvedValue({
            data: null,
            error: { message: 'RPC Error' }
        });

        const result = await getUsersNotAssignedOnDate('2024-05-20', allUsers);
        expect(result).toEqual(allUsers);
    });
});
