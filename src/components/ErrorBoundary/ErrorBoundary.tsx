import React, { ReactNode, ErrorInfo } from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: FallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Unified fallback component for both dev and production (identical UI)
const DefaultErrorFallback: React.FC<FallbackProps> = ({ resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          We encountered an unexpected issue. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main error boundary component
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback, 
  onError 
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Always log errors to console
    console.group('🔴 React Error Boundary');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call the onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // In production, log to error reporting service
    if (!isDevelopment) {
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      console.error('🚨 Production React error - Send to monitoring service:', { 
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack 
      });
    }
  };

  // Use the same fallback for both dev and prod (shows error details only in dev)
  const FallbackComponent = fallback || DefaultErrorFallback;

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={() => {
        console.log('Error boundary reset - attempting recovery');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
