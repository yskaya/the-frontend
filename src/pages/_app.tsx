import React, { useEffect } from 'react';
import { AppProps } from 'next/app';

import { GoogleAuthProvider, AuthProvider } from '@/features/auth';
import { NotificationProvider, NotificationStack } from '@/components/Notification';
import { ErrorBoundary, useErrorHandling, useErrorSuppressor } from '@/features/errors';
import { api } from '@/api/api.client';

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
  // Suppress API/Network errors from Next.js dev overlay
  useErrorSuppressor();

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