import type { Notification, NotificationPreferences, NotificationSettings } from '../types';

// ==================== NOTIFICATION CREATION HELPERS ====================
export const createRenewalNotification = (
  customerName: string,
  planName: string,
  renewalDate: Date,
  customerId: string
): Partial<Notification> => {
  return {
    title: 'Subscription Renewal Due',
    message: `${customerName}'s ${planName} subscription is due for renewal on ${renewalDate.toLocaleDateString()}`,
    type: 'renewal',
    priority: 'high',
    category: 'renewal',
    actionRequired: true,
    actionUrl: `/customers/${customerId}/renew`,
    entityId: customerId,
    expiresAt: new Date(renewalDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires 1 week after renewal
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createPaymentNotification = (
  customerName: string,
  amount: number,
  dueDate: Date,
  customerId: string,
  paymentId: string
): Partial<Notification> => {
  return {
    title: 'Payment Reminder',
    message: `Payment of ₹${amount.toLocaleString()} is due for ${customerName} on ${dueDate.toLocaleDateString()}`,
    type: 'payment',
    priority: 'medium',
    category: 'payment',
    actionRequired: true,
    actionUrl: `/payments/${paymentId}`,
    entityId: customerId,
    expiresAt: new Date(dueDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires 1 month after due date
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createSystemNotification = (
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'medium'
): Partial<Notification> => {
  return {
    title,
    message,
    type,
    priority,
    category: 'system',
    actionRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createCustomerNotification = (
  title: string,
  message: string,
  customerId: string,
  priority: Notification['priority'] = 'medium'
): Partial<Notification> => {
  return {
    title,
    message,
    type: 'info',
    priority,
    category: 'customer',
    actionRequired: false,
    entityId: customerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createLeadNotification = (
  customerName: string,
  message: string,
  leadId: string,
  priority: Notification['priority'] = 'medium'
): Partial<Notification> => {
  return {
    title: `New Lead Update: ${customerName}`,
    message,
    type: 'info',
    priority,
    category: 'lead',
    actionRequired: false,
    entityId: leadId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// ==================== NOTIFICATION FILTERING HELPERS ====================
export const filterNotificationsByCategory = (
  notifications: Notification[],
  category: Notification['category']
): Notification[] => {
  return notifications.filter(notification => notification.category === category);
};

export const filterNotificationsByType = (
  notifications: Notification[],
  type: Notification['type']
): Notification[] => {
  return notifications.filter(notification => notification.type === type);
};

export const filterUnreadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(notification => !notification.isRead);
};

export const filterHighPriorityNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(notification => notification.priority === 'high' || notification.priority === 'urgent');
};

export const filterActionRequiredNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(notification => notification.actionRequired);
};

export const filterNotificationsByDateRange = (
  notifications: Notification[],
  startDate: Date,
  endDate: Date
): Notification[] => {
  return notifications.filter(notification => {
    const notificationDate = new Date(notification.createdAt);
    return notificationDate >= startDate && notificationDate <= endDate;
  });
};

// ==================== NOTIFICATION SORTING HELPERS ====================
export const sortNotificationsByPriority = (notifications: Notification[]): Notification[] => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  
  return [...notifications].sort((a, b) => {
    // Unread notifications come first
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    
    // Then sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Finally sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const sortNotificationsByDate = (notifications: Notification[], ascending = false): Notification[] => {
  return [...notifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// ==================== NOTIFICATION GROUPING HELPERS ====================
export const groupNotificationsByCategory = (notifications: Notification[]): Record<string, Notification[]> => {
  return notifications.reduce((groups, notification) => {
    const category = notification.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);
};

export const groupNotificationsByPriority = (notifications: Notification[]): Record<string, Notification[]> => {
  return notifications.reduce((groups, notification) => {
    const priority = notification.priority;
    if (!groups[priority]) {
      groups[priority] = [];
    }
    groups[priority].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);
};

export const groupNotificationsByDate = (notifications: Notification[]): Record<string, Notification[]> => {
  return notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);
};

// ==================== NOTIFICATION STATISTICS HELPERS ====================
export const getNotificationStatistics = (notifications: Notification[]) => {
  const total = notifications.length;
  const unread = notifications.filter(n => !n.isRead).length;
  const actionRequired = notifications.filter(n => n.actionRequired).length;
  
  const categoryStats = groupNotificationsByCategory(notifications);
  const priorityStats = groupNotificationsByPriority(notifications);
  
  return {
    total,
    unread,
    read: total - unread,
    actionRequired,
    categories: Object.keys(categoryStats).map(category => ({
      category,
      count: categoryStats[category].length,
      unread: categoryStats[category].filter(n => !n.isRead).length
    })),
    priorities: Object.keys(priorityStats).map(priority => ({
      priority,
      count: priorityStats[priority].length,
      unread: priorityStats[priority].filter(n => !n.isRead).length
    }))
  };
};

export const getNotificationSummary = (notifications: Notification[]): string => {
  const stats = getNotificationStatistics(notifications);
  
  if (stats.total === 0) {
    return 'No notifications';
  }
  
  const unreadText = stats.unread > 0 ? `${stats.unread} unread` : '';
  const actionText = stats.actionRequired > 0 ? `${stats.actionRequired} require action` : '';
  
  const parts = [];
  if (unreadText) parts.push(unreadText);
  if (actionText) parts.push(actionText);
  if (parts.length === 0) parts.push('All read');
  
  return parts.join(', ');
};

// ==================== NOTIFICATION PREFERENCES HELPERS ====================
export const createDefaultNotificationPreferences = (userId: string): NotificationPreferences => {
  return {
    userId,
    email: true,
    push: true,
    sms: false,
    inApp: true,
    categories: {
      customer: true,
      payment: true,
      system: true,
      lead: true,
      renewal: true
    },
    frequency: 'immediate'
  };
};

export const updateNotificationPreferences = (
  currentPreferences: NotificationPreferences,
  updates: Partial<NotificationPreferences>
): NotificationPreferences => {
  return {
    ...currentPreferences,
    ...updates,
    categories: {
      ...currentPreferences.categories,
      ...(updates.categories || {})
    }
  };
};

export const shouldSendNotification = (
  preferences: NotificationPreferences,
  notification: Notification
): boolean => {
  // Check if user wants notifications for this category
  if (!preferences.categories[notification.category]) {
    return false;
  }
  
  // Check delivery method preferences
  const deliveryMethod = getPreferredDeliveryMethod(preferences);
  if (deliveryMethod === 'email' && !preferences.email) return false;
  if (deliveryMethod === 'push' && !preferences.push) return false;
  if (deliveryMethod === 'sms' && !preferences.sms) return false;
  if (deliveryMethod === 'inApp' && !preferences.inApp) return false;
  
  return true;
};

const getPreferredDeliveryMethod = (preferences: NotificationPreferences): string => {
  if (preferences.email) return 'email';
  if (preferences.push) return 'push';
  if (preferences.sms) return 'sms';
  if (preferences.inApp) return 'inApp';
  return 'none';
};

// ==================== NOTIFICATION SETTINGS HELPERS ====================
export const createDefaultNotificationSettings = (): NotificationSettings => {
  return {
    enableRenewalAlerts: true,
    renewalDays: [7, 3, 1], // Alert 7, 3, and 1 day before renewal
    enablePaymentAlerts: true,
    enableLowBalanceAlert: true,
    enableNewCustomerAlert: true
  };
};

export const isRenewalAlertEnabled = (settings: NotificationSettings): boolean => {
  return settings.enableRenewalAlerts;
};

export const getRenewalAlertDays = (settings: NotificationSettings): number[] => {
  return settings.renewalDays;
};

export const shouldShowRenewalAlert = (
  settings: NotificationSettings,
  daysUntilRenewal: number
): boolean => {
  if (!settings.enableRenewalAlerts) return false;
  return settings.renewalDays.includes(daysUntilRenewal);
};

export const shouldShowPaymentAlert = (settings: NotificationSettings, isOverdue: boolean): boolean => {
  if (!settings.enablePaymentAlerts) return false;
  return true; // Always show payment alerts if enabled
};

export const shouldShowLowBalanceAlert = (settings: NotificationSettings): boolean => {
  return settings.enableLowBalanceAlert;
};

export const shouldShowNewCustomerAlert = (settings: NotificationSettings): boolean => {
  return settings.enableNewCustomerAlert;
};

// ==================== NOTIFICATION CLEANUP HELPERS ====================
export const cleanupExpiredNotifications = (notifications: Notification[]): Notification[] => {
  const now = new Date();
  return notifications.filter(notification => {
    if (!notification.expiresAt) return true;
    return new Date(notification.expiresAt) > now;
  });
};

export const markOldNotificationsAsRead = (
  notifications: Notification[],
  daysOld: number = 30
): Notification[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return notifications.map(notification => {
    if (!notification.isRead && new Date(notification.createdAt) < cutoffDate) {
      return { ...notification, isRead: true };
    }
    return notification;
  });
};

// ==================== NOTIFICATION VALIDATION HELPERS ====================
export const validateNotification = (notification: Partial<Notification>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!notification.title || notification.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!notification.message || notification.message.trim().length === 0) {
    errors.push('Message is required');
  }
  
  if (!notification.type) {
    errors.push('Type is required');
  }
  
  if (!notification.priority) {
    errors.push('Priority is required');
  }
  
  if (!notification.category) {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeNotification = (notification: Partial<Notification>): Notification => {
  return {
    id: notification.id || generateNotificationId(),
    title: notification.title?.trim() || '',
    message: notification.message?.trim() || '',
    type: notification.type || 'info',
    priority: notification.priority || 'medium',
    category: notification.category || 'system',
    isRead: notification.isRead || false,
    actionRequired: notification.actionRequired || false,
    actionUrl: notification.actionUrl,
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: notification.updatedAt || new Date().toISOString(),
    expiresAt: notification.expiresAt,
    userId: notification.userId,
    entityId: notification.entityId,
    metadata: notification.metadata || {}
  };
};

const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};