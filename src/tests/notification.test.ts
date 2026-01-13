import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../services/notificationService';
import api from '../services/api';

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: { headers: { common: {} } }
    }
}));

describe('NotificationService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch unread count', async () => {
        (api.get as any).mockResolvedValue({
            data: [{ id: '1', read: false }, { id: '2', read: false }]
        });

        const count = await NotificationService.getUnreadCount('user1');
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/notifications'));
        expect(count).toBe(2);
    });

    it('should subscribe to unread count', async () => {
        (api.get as any).mockResolvedValue({
            data: [{ id: '1', read: false }]
        });

        const callback = vi.fn();
        const unsubscribe = NotificationService.subscribeToUnreadCount(callback, 'user1');

        // Wait for the initial fetch manually
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledWith(1);

        unsubscribe();
    });

    it('should subscribe to notifications with correct callback signature', async () => {
        const mockNotifs = [{ id: '1', title: 'Test' }];
        (api.get as any).mockResolvedValue({ data: mockNotifs });

        const callback = vi.fn();
        // This matches the call site in Context: subscribe(callback)
        const unsubscribe = NotificationService.subscribeToNotifications(callback);

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(callback).toHaveBeenCalledWith(mockNotifs);

        unsubscribe();
    });

});
