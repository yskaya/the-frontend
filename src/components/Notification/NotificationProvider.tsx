import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationAction } from './notification.types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showError: (message: string, title?: string, actions?: NotificationAction[]) => void;
  showWarning: (message: string, title?: string, actions?: NotificationAction[]) => void;
  showInfo: (message: string, title?: string, actions?: NotificationAction[]) => void;
  showSuccess: (message: string, title?: string, actions?: NotificationAction[]) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || (notification.type === 'error' ? 0 : 5000), // Errors persist, others auto-dismiss
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [removeNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showError = useCallback((message: string, title = 'Error', actions?: NotificationAction[]) => {
    addNotification({
      type: 'error',
      title,
      message,
      actions,
      persistent: true,
    });
  }, [addNotification]);

  const showWarning = useCallback((message: string, title = 'Warning', actions?: NotificationAction[]) => {
    addNotification({
      type: 'warning',
      title,
      message,
      actions,
    });
  }, [addNotification]);

  const showInfo = useCallback((message: string, title = 'Info', actions?: NotificationAction[]) => {
    addNotification({
      type: 'info',
      title,
      message,
      actions,
    });
  }, [addNotification]);

  const showSuccess = useCallback((message: string, title = 'Success', actions?: NotificationAction[]) => {
    addNotification({
      type: 'success',
      title,
      message,
      actions,
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showError,
    showWarning,
    showInfo,
    showSuccess,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

