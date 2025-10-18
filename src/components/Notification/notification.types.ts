export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in ms
  actions?: NotificationAction[];
  persistent?: boolean; // Don't auto-dismiss
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

