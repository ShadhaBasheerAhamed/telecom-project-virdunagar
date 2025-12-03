import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  Timestamp
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Notification, NotificationSettings, BulkOperationResult } from '../types/enhanced';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const NotificationService = {
  
  // Create Notification
  createNotification: async (notification: Omit<Notification, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notification,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  },

  // Mark Notification as Read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  // Mark All as Read
  markAllAsRead: async (userId?: string): Promise<void> => {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('isRead', '==', false),
        ...(userId ? [where('userId', '==', userId)] : []),
        limit(500)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        const notificationRef = doc.ref;
        batch.update(notificationRef, {
          isRead: true,
          updatedAt: Timestamp.fromDate(new Date())
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  // Delete Notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  },

  // Get Notifications
  getNotifications: async (userId?: string, limitCount: number = 50): Promise<Notification[]> => {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        ...(userId ? [where('userId', '==', userId)] : []),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
      } as Notification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get Unread Count
  getUnreadCount: async (userId?: string): Promise<number> => {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('isRead', '==', false),
        ...(userId ? [where('userId', '==', userId)] : [])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // Real-time Subscribe to Notifications
  subscribeToNotifications: (
    callback: (notifications: Notification[]) => void,
    userId?: string
  ) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      ...(userId ? [where('userId', '==', userId)] : []),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
      } as Notification));
      
      callback(notifications);
    });
  },

  // Subscribe to Unread Count
  subscribeToUnreadCount: (
    callback: (count: number) => void,
    userId?: string
  ) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('isRead', '==', false),
      ...(userId ? [where('userId', '==', userId)] : [])
    );
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  },

  // Bulk Operations
  bulkUpdateNotifications: async (
    notificationIds: string[],
    updates: Partial<Notification>
  ): Promise<BulkOperationResult> => {
    try {
      const batch = writeBatch(db);
      const errors: string[] = [];
      let success = 0;
      let failed = 0;
      
      for (const id of notificationIds) {
        try {
          const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
          batch.update(notificationRef, {
            ...updates,
            updatedAt: Timestamp.fromDate(new Date())
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`Failed to update notification ${id}: ${error}`);
        }
      }
      
      await batch.commit();
      return { success, failed, errors, totalProcessed: notificationIds.length };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { success: 0, failed: notificationIds.length, errors: [error.message], totalProcessed: notificationIds.length };
    }
  },

  bulkDeleteNotifications: async (notificationIds: string[]): Promise<BulkOperationResult> => {
    try {
      const batch = writeBatch(db);
      const errors: string[] = [];
      let success = 0;
      let failed = 0;
      
      for (const id of notificationIds) {
        try {
          const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
          batch.delete(notificationRef);
          success++;
        } catch (error) {
          failed++;
          errors.push(`Failed to delete notification ${id}: ${error}`);
        }
      }
      
      await batch.commit();
      return { success, failed, errors, totalProcessed: notificationIds.length };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return { success: 0, failed: notificationIds.length, errors: [error.message], totalProcessed: notificationIds.length };
    }
  },

  // Notification Settings
  getNotificationSettings: async (userId: string): Promise<NotificationSettings | null> => {
    try {
      const settingsRef = doc(db, 'notification_settings', userId);
      const snapshot = await getDocs(query(collection(db, 'notification_settings'), where('userId', '==', userId)));
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as NotificationSettings;
      }
      
      // Return default settings
      return {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        categories: {
          payment: true,
          customer: true,
          complaint: true,
          system: true,
          renewal: true
        },
        frequency: 'immediate'
      };
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  },

  updateNotificationSettings: async (userId: string, settings: NotificationSettings): Promise<void> => {
    try {
      const settingsRef = doc(db, 'notification_settings', userId);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  },

  // Create System Notifications
  createSystemNotification: async (
    type: 'payment' | 'customer' | 'complaint' | 'system' | 'renewal',
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: any
  ): Promise<string> => {
    const notification: Omit<Notification, 'id'> = {
      title,
      message,
      type: type === 'system' ? 'info' : 'info',
      category: type,
      isRead: false,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data
    };
    
    return await NotificationService.createNotification(notification);
  },

  // Utility Methods
  filterNotifications: (
    notifications: Notification[],
    filters: {
      category?: string;
      type?: string;
      priority?: string;
      isRead?: boolean;
      dateRange?: { start: Date; end: Date };
    }
  ): Notification[] => {
    return notifications.filter(notification => {
      if (filters.category && notification.category !== filters.category) return false;
      if (filters.type && notification.type !== filters.type) return false;
      if (filters.priority && notification.priority !== filters.priority) return false;
      if (filters.isRead !== undefined && notification.isRead !== filters.isRead) return false;
      
      if (filters.dateRange) {
        const createdAt = new Date(notification.createdAt);
        if (createdAt < filters.dateRange.start || createdAt > filters.dateRange.end) return false;
      }
      
      return true;
    });
  },

  sortNotifications: (
    notifications: Notification[],
    sortBy: 'createdAt' | 'priority' | 'category' = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Notification[] => {
    return notifications.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  }
};