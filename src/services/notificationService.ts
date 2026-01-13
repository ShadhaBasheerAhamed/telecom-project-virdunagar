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
  subscribeToNotifications: (userId: string, callback: (notifications: Notification[]) => void): () => void => {
    const fetchNotifications = async () => {
      const notifications = await NotificationService.getNotifications(userId);
      callback(notifications);
    };

    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }
};