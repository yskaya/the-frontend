// Import error suppressor FIRST to catch all errors
import '@/lib/errorSuppressor';

import React from 'react';
import { useEffect } from 'react';
import { AppProps } from 'next/app';

import { GoogleAuthProvider } from '@/context/Auth/GoogleAuthProvider';
import { AuthProvider } from '@/context/Auth/AuthProvider';
import { NotificationProvider } from '@/components/Notification/NotificationProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotificationStack } from '@/components/Notification/NotificationStack';
import { api } from '@/api/api.client';
import { useErrorHandling } from '@/hooks/useErrorHandling';

import '../globals.css';

// Internal component to setup API error handler
function ApiErrorSetup({ children }: { children: React.ReactNode }) {
  const { handleApiError } = useErrorHandling();

  useEffect(() => {
    api.setErrorHandler(handleApiError);
  }, [handleApiError]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Setup global error handlers only on client side
    if (typeof window === 'undefined') return;

    console.log('🔧 Setting up global error handlers');

    // Prevent Next.js dev overlay from showing for API errors
    const handleError = (event: ErrorEvent) => {
      console.log('Global error handler triggered:', event);
      // Check if it's an Axios error
      if (event.message && event.message.includes('AxiosError')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Axios error caught and suppressed:', event.error);
        return false;
      }
      // Let other errors through
      console.log('Non-Axios error, letting through');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('Global unhandledrejection triggered:', event.reason);
      // Check if it's an Axios error
      if (event.reason && (event.reason.name === 'AxiosError' || event.reason.isAxiosError)) {
        event.preventDefault();
        console.log('Unhandled Axios promise rejection caught and suppressed:', event.reason);
        return false;
      }
      // Let other rejections through
      console.log('Non-Axios rejection, letting through');
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      console.log('🔧 Cleaning up global error handlers');
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ApiErrorSetup>
          <GoogleAuthProvider>
            <AuthProvider>
              <Component {...pageProps} />
              <NotificationStack />
            </AuthProvider>
          </GoogleAuthProvider>
        </ApiErrorSetup>
      </NotificationProvider>
    </ErrorBoundary>
  );
}