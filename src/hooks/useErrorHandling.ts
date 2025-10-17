import { useCallback } from 'react';
import { useNotification } from '@/components/Notification/useNotification';
import { NotificationAction } from '@/types/notification.types';
  
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

      // User-friendly messages based on status code (backend messages logged to console)
      switch (status) {
        case 400:
          title = 'Invalid Request';
          message = 'The information you provided is not valid. Please check and try again.';
          break;
        
        case 401:
          title = 'Authentication Required';
          message = 'You need to log in to access this feature.';
          actions.push({
            label: 'Go to Login',
            action: () => window.location.href = '/login',
            variant: 'primary',
          });
          break;
        
        case 403:
          title = 'Access Denied';
          message = "You don't have permission to access this resource.";
          break;
        
        case 404:
          title = 'Page Not Found';
          message = "Sorry, we couldn't find what you're looking for. It may have been moved or deleted.";
          actions.push({
            label: 'Go Home',
            action: () => window.location.href = '/',
            variant: 'secondary',
          });
          break;
        
        case 408:
          title = 'Request Timeout';
          message = 'The request took too long to complete. Please try again.';
          actions.push({
            label: 'Retry',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        case 409:
          title = 'Conflict';
          message = 'This action conflicts with existing data. Please refresh and try again.';
          actions.push({
            label: 'Refresh',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        case 429:
          title = 'Too Many Requests';
          message = 'You\'re going a bit too fast! Please wait a moment and try again.';
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';
          message = 'Our servers are having trouble right now. Please try again in a few moments.';
          actions.push({
            label: 'Retry',
            action: () => window.location.reload(),
            variant: 'primary',
          });
          break;
        
        default:
          title = 'Something went wrong';
          message = 'An unexpected error occurred. Please try again.';
          // Technical details are already logged to console
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
      'Oops! We can\'t reach our servers right now. Please check your internet connection and try again.',
      'Connection Problem',
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
      'Your session has expired. Please log in again to continue.',
      'Session Expired',
      [
        {
          label: 'Go to Login',
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
      'Please check the information you entered and try again.',
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

