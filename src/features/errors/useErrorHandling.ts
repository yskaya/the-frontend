import { useCallback } from 'react';
import { useNotification } from '@/components/Notification';
import { NotificationAction } from '@/components/Notification/notification.types';
  
export const useErrorHandling = () => {
  const { showError, showWarning } = useNotification();

  const handleApiError = useCallback((error: unknown, context?: string) => {
    let title = 'Something went wrong';
    let message = 'An unexpected error occurred. Please try again.';
    const actions: NotificationAction[] = [];

    // Log technical error details to console for debugging
    console.group('🔴 API Error');
    if (context) {
      console.log('Context:', context);
    }
    console.error('Error:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { 
        response?: { 
          status?: number; 
          data?: { error?: string; message?: string };
          config?: { url?: string; method?: string };
        } 
      };
      
      const status = axiosError.response?.status;
      const apiError = axiosError.response?.data;
      
      // Log detailed error information
      console.log('Status Code:', status);
      console.log('URL:', axiosError.response?.config?.url);
      console.log('Method:', axiosError.response?.config?.method?.toUpperCase());
      console.log('API Response:', apiError);
      console.groupEnd();

      // Pattern: Title + clear explanation (button suggests action)
      switch (status) {
        case 400:
          title = 'Invalid Request';
          message = 'The data you sent is invalid.';
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        case 401:
          title = 'Authentication Required';
          message = 'You\'re not signed in.';
          actions.push({
            label: 'Login',
            action: () => window.location.href = '/login',
            variant: 'primary',
          });
          break;
        
        case 403:
          title = 'Access Denied';
          message = 'You don\'t have permission.';
          actions.push({
            label: 'Home',
            action: () => window.location.href = '/',
            variant: 'secondary',
          });
          break;
        
        case 404:
          title = 'Not Found';
          message = 'This page doesn\'t exist.';
          actions.push({
            label: 'Home',
            action: () => window.location.href = '/',
            variant: 'secondary',
          });
          break;
        
        case 408:
          title = 'Request Timeout';
          message = 'The request took too long.';
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        case 409:
          title = 'Conflict';
          message = 'Data has changed since you loaded it.';
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        case 429:
          title = 'Rate Limit Exceeded';
          message = 'You\'re making too many requests.';
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';
          message = 'Our servers encountered an issue. Please try again in a moment.';
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        default:
          title = 'Error';
          message = 'Something unexpected happened. We\'re looking into it.';
          actions.push({
            label: 'Try Again',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      console.log('Error Message:', errorWithMessage.message);
      console.groupEnd();
      // Keep the default user-friendly message
    } else {
      console.groupEnd();
    }

    if (context) {
      title = `${context} - ${title}`;
    }

    showError(message, title, actions.length > 0 ? actions : undefined);
  }, [showError]);

  const handleNetworkError = useCallback(() => {
    console.group('🔴 Network Error');
    console.error('Unable to reach server - possible network connectivity issue');
    console.groupEnd();
    
    showError(
      'Unable to reach our servers. Check your internet connection and try again.',
      'Connection Failed',
      [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          variant: 'primary',
        },
      ]
    );
  }, [showError]);

  const handleAuthError = useCallback(() => {
    console.group('🔴 Authentication Error');
    console.warn('User session expired or authentication failed');
    console.groupEnd();
    
    showError(
      'Your session has expired. Please sign in again to continue.',
      'Session Expired',
      [
        {
          label: 'Login',
          action: () => window.location.href = '/login',
          variant: 'primary',
        },
      ]
    );
  }, [showError]);

  const handleValidationError = useCallback((details?: string) => {
    console.group('⚠️ Validation Error');
    if (details) {
      console.warn('Validation details:', details);
    }
    console.groupEnd();
    
    showWarning(
      'The information provided is invalid. Please check your input and try again.',
      'Invalid Input'
    );
  }, [showWarning]);

  return {
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handleValidationError,
  };
};

