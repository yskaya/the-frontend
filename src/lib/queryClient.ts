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
      
      // No automatic retries
      retry: false,
    },
    mutations: {
      retry: 0,
      throwOnError: false, // Handle errors gracefully
    },
  },
});

