import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Handlee, Nunito_Sans, Montserrat } from 'next/font/google';

import type { User } from '@/features/auth';
import { AuthProvider } from '@/features/auth';
import { ContactsProvider } from '@/features/contacts';
import { NotificationProvider, NotificationStack } from '@/components/Notification';
import { ErrorBoundary, useErrorHandling, useErrorSuppressor } from '@/features/errors';
import { queryClient, api, walletApi } from '@/lib';
import { Toaster } from '@/ui/sonner';

import '../globals.css';

type PaypayPageProps = {
  serverUser?: User | null;
};

type PaypayAppProps = AppProps<PaypayPageProps>;

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

function AppContent({ Component, pageProps }: PaypayAppProps) {
  const { handleApiError } = useErrorHandling();

  // Setup API error handler
  useEffect(() => {
    api.setErrorHandler(handleApiError);
    walletApi.setErrorHandler(handleApiError);
  }, [handleApiError]);

  return (
    <>
      <Component {...pageProps} />
      <NotificationStack />
    </>
  );
}

export default function App(props: PaypayAppProps) {
  // Suppress API/Network errors from Next.js dev overlay
  useErrorSuppressor();

  const serverUser = props.pageProps?.serverUser ?? null;

  return (
    <div className={`${handlee.variable} ${nunitoSans.variable} ${montserrat.variable}`}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <NotificationProvider>
            <AuthProvider serverUser={serverUser}>
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