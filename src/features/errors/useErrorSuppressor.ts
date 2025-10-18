import { useEffect } from 'react';

/**
 * Hook to suppress API/Network errors from showing in Next.js dev overlay
 * Prevents Axios errors, network failures, and timeouts from triggering the error overlay
 * while still logging them to the console for debugging
 */
export function useErrorSuppressor() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Error patterns that should be suppressed (API/Network errors)
    const suppressedErrorPatterns = [
      'AxiosError',
      'Request failed with status code',
      'Network Error',
      'timeout',
      'ECONNREFUSED',
      'ERR_NETWORK',
      'Failed to fetch',
    ];

    const shouldSuppressError = (errorString: string): boolean => {
      return suppressedErrorPatterns.some(pattern =>
        errorString.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const errorString = event.error ? String(event.error) : errorMessage;

      if (
        event.error?.isAxiosError ||
        event.error?.name === 'AxiosError' ||
        shouldSuppressError(errorMessage) ||
        shouldSuppressError(errorString)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log('🔴 API/Network error (suppressed from overlay):', event.error || event.message);
        return false;
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonString = JSON.stringify(reason) || String(reason);

      if (
        reason?.isAxiosError ||
        reason?.name === 'AxiosError' ||
        shouldSuppressError(reasonString) ||
        shouldSuppressError(reason?.message || '')
      ) {
        event.preventDefault();
        console.log('🔴 Unhandled API/Network rejection (suppressed from overlay):', reason);
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

