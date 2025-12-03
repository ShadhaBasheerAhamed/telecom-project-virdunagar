import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Notification, NotificationState } from '../types/enhanced';
import { NotificationService } from '../services/notificationService';

interface NotificationContextType extends NotificationState {
  createNotification: (notification: Omit<Notification, 'id'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  subscribeToNotifications: (userId?: string) => () => void;
  subscribeToUnreadCount: (userId?: string) => () => void;
}

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'RESET_STATE' };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, isLoading: false, error: null };
    
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload)
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, isRead: true })),
        unreadCount: 0
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Real-time subscription
  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;
    let unsubscribeUnreadCount: (() => void) | undefined;

    const subscribeToData = () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        unsubscribeNotifications = NotificationService.subscribeToNotifications(
          (notifications) => {
            dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
          }
        );

        unsubscribeUnreadCount = NotificationService.subscribeToUnreadCount(
          (count) => {
            dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
          }
        );
      } catch (error) {
        console.error('Error subscribing to notifications:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
      }
    };

    subscribeToData();

    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
      if (unsubscribeUnreadCount) {
        unsubscribeUnreadCount();
      }
    };
  }, []);

  const createNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      await NotificationService.createNotification(notification);
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error creating notification:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create notification' });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      dispatch({ 
        type: 'UPDATE_NOTIFICATION', 
        payload: { id: notificationId, updates: { isRead: true } }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark notification as read' });
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark all notifications as read' });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: Math.max(0, state.unreadCount - 1) });
    } catch (error) {
      console.error('Error deleting notification:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete notification' });
    }
  };

  const refreshNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const notifications = await NotificationService.getNotifications();
      const unreadCount = await NotificationService.getUnreadCount();
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadCount });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh notifications' });
    }
  };

  // Manual subscriptions (for components that need them)
  const subscribeToNotifications = (userId?: string) => {
    return NotificationService.subscribeToNotifications((notifications) => {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    }, userId);
  };

  const subscribeToUnreadCount = (userId?: string) => {
    return NotificationService.subscribeToUnreadCount((count) => {
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    }, userId);
  };

  const value: NotificationContextType = {
    ...state,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    subscribeToNotifications,
    subscribeToUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Custom Hooks
export const useNotificationCount = () => {
  const { unreadCount } = useNotifications();
  return unreadCount;
};

export const useUnreadNotifications = () => {
  const { notifications } = useNotifications();
  return notifications.filter(notification => !notification.isRead);
};

export const useRecentNotifications = (limit: number = 5) => {
  const { notifications } = useNotifications();
  return notifications.slice(0, limit);
};

// Quick Actions
export const useNotificationActions = () => {
  const { createNotification, markAsRead, markAllAsRead } = useNotifications();
  
  const notifyPaymentReceived = async (customerName: string, amount: number) => {
    await createNotification({
      title: 'Payment Received',
      message: `Payment of ₹${amount} received from ${customerName}`,
      type: 'success',
      category: 'payment',
      isRead: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const notifyCustomerStatusChanged = async (customerName: string, oldStatus: string, newStatus: string) => {
    await createNotification({
      title: 'Customer Status Changed',
      message: `${customerName} status changed from ${oldStatus} to ${newStatus}`,
      type: 'info',
      category: 'customer',
      isRead: false,
      priority: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const notifyRenewalDue = async (customerName: string, renewalDate: string) => {
    await createNotification({
      title: 'Renewal Due Soon',
      message: `${customerName}'s subscription renews on ${renewalDate}`,
      type: 'warning',
      category: 'renewal',
      isRead: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const notifySystemAlert = async (title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    await createNotification({
      title,
      message,
      type: 'warning',
      category: 'system',
      isRead: false,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return {
    createNotification,
    markAsRead,
    markAllAsRead,
    notifyPaymentReceived,
    notifyCustomerStatusChanged,
    notifyRenewalDue,
    notifySystemAlert
  };
};