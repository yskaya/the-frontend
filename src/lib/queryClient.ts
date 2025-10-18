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
      gcTime: 1000 * 60 * 10, // Cache kept for 10 minutes (formerly cacheTime)
      
      // Refetching
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      
      // Retry
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Suspense
      suspense: false, // Enable per-query (not globally)
    },
    mutations: {
      // Mutations don't use Suspense
      retry: 0, // Don't retry mutations by default
    },
  },
});

