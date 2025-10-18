import React from 'react';
import { Notification } from './notification.types';
import { useNotification } from './useNotification';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { removeNotification } = useNotification();

  const handleDismiss = () => {
    removeNotification(notification.id);
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700';
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (notification.type) {
      case 'error':
        return (
          <svg className={`${iconClass} text-red-600 dark:text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-orange-600 dark:text-orange-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`${iconClass} text-blue-600 dark:text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={`${iconClass} text-green-600 dark:text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${getTypeStyles()}
        backdrop-blur-md
        shadow-sm
        w-full
        transition-all duration-200 ease-out
        animate-in slide-in-from-top-2 fade-in
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        {getIcon()}
        
        {/* Title & Message - Inline with bold title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
            <strong className="font-semibold">{notification.title}</strong>. {notification.message}
          </p>
        </div>
        
        {/* Actions - Solid white buttons with 16px radius */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2 items-center">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-white/90 border border-white text-gray-900 hover:bg-gray-50 dark:hover:bg-white transition-all duration-150 whitespace-nowrap"
                style={{ borderRadius: '16px' }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

