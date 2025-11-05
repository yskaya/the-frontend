import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Handlee, Nunito_Sans, Montserrat } from 'next/font/google';

import { AuthProvider } from '@/features/auth';
import { ContactsProvider } from '@/features/contacts';
import { NotificationProvider, NotificationStack } from '@/components/Notification';
import { ErrorBoundary, useErrorHandling, useErrorSuppressor } from '@/features/errors';
import { queryClient, api } from '@/lib';
import { Toaster } from '@/ui/sonner';

import '../globals.css';

// Load fonts for login page
const handlee = Handlee({
  variable: '--font-handlee',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['500'],
  display: 'swap',
});

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
    <div className={`${handlee.variable} ${nunitoSans.variable} ${montserrat.variable}`}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <NotificationProvider>
            <AuthProvider>
              <ContactsProvider>
                <AppContent {...props} />
                <Toaster />
              </ContactsProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
}