import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider } from '@/features/auth';
import { NotificationProvider, NotificationStack } from '@/components/Notification';
import { ErrorBoundary, useErrorHandling, useErrorSuppressor } from '@/features/errors';
import { api } from '@/api/api.client';
import { queryClient } from '@/lib/queryClient';

import '../globals.css';

function AppContent({ Component, pageProps }: AppProps) {
  const { handleApiError } = useErrorHandling();

  // Setup API error handler
  useEffect(() => {
    api.setErrorHandler(handleApiError);
  }, [handleApiError]);

  return (
    <>
      <Component {...pageProps} />
      <NotificationStack />
    </>
  );
}

export default function App(props: AppProps) {
  // Suppress API/Network errors from Next.js dev overlay
  useErrorSuppressor();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <AppContent {...props} />
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}