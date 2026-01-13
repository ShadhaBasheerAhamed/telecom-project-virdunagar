import api from './api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  created_at: string;
}

export const NotificationService = {

  getNotifications: async (userId?: string, unreadOnly: boolean = false): Promise<Notification[]> => {
    try {
      let url = '/notifications';
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (unreadOnly) params.append('unread_only', 'true');

      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<string> => {
    try {
      const response = await api.post('/notifications', notification);
      return response.data.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  deleteNotification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Subscribe with polling
  getUnreadCount: async (userId?: string): Promise<number> => {
    try {
      const notifications = await NotificationService.getNotifications(userId, true);
      return notifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    try {
      // Assuming backend has this endpoint, else loop through unread
      // For now, simpler to specific implementation or bulk update
      // We will just fetch unread and mark them read one by one if no bulk endpoint, 
      // or assume the backend supports a general PUT /notifications/read-all
      // But to be safe with current verified API methods, let's look at controller...
      // Wait, I didn't create a bulk read endpoint in the walkthrough summary.
      // I will implement a client-side loop for safety for now.
      const unread = await NotificationService.getNotifications(userId, true);
      await Promise.all(unread.map(n => NotificationService.markAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  // Subscribe with polling: Callback First
  subscribeToNotifications: (callback: (notifications: Notification[]) => void, userId?: string): () => void => {
    const fetchNotifications = async () => {
      const notifications = await NotificationService.getNotifications(userId);
      callback(notifications);
    };

    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  },

  subscribeToUnreadCount: (callback: (count: number) => void, userId?: string): () => void => {
    const fetchCount = async () => {
      const count = await NotificationService.getUnreadCount(userId);
      callback(count);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }
};