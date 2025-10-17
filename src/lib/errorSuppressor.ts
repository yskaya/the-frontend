/**
 * Error suppressor for Axios errors
 * Prevents Next.js dev overlay from showing for API errors
 * Must be imported at the top of _app.tsx
 */

if (typeof window !== 'undefined') {
  
  // List of error patterns that should be suppressed (API/Network errors)
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

  // Don't override console.error - let errors be logged normally
  // Only suppress the Next.js overlay via event handlers

  // Handle unhandled rejections globally
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonString = JSON.stringify(reason) || String(reason);
    
    if (
      reason?.isAxiosError || 
      reason?.name === 'AxiosError' ||
      shouldSuppressError(reasonString) ||
      shouldSuppressError(reason?.message || '')
    ) {
      event.preventDefault();
      console.log('🔴 Unhandled API/Network rejection (suppressed):', reason);
    }
  });

  // Handle errors globally
  window.addEventListener('error', (event) => {
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
      console.log('🔴 API/Network error (suppressed):', event.error || event.message);
      return false;
    }
  }, true);
}

export {};
