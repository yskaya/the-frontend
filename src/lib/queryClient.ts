import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Provides caching, refetching, and data synchronization
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching
      staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
      gcTime: 1000 * 60 * 10, // Cache kept for 10 minutes
      
      // Refetching
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      
      // Retry (don't retry 4xx errors)
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Suspense
      suspense: false, // Enable per-query as needed
    },
    mutations: {
      retry: 0,
      throwOnError: false, // Handle errors gracefully
    },
  },
});

