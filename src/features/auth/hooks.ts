import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginGoogle, logout, validate, type LoginResponse } from './api';
import { User } from './types';

/**
 * Validates current session (silent - no error notifications)
 * Uses React Query for caching and automatic refetching
 * NOTE: Not used with Suspense - we use server-side rendering instead
 */
export const useValidateSession = () => {
  return useQuery<User | null>({
    queryKey: ['auth', 'session'],
    queryFn: validate,
    // Don't show error notifications for auth checks
    meta: { silent: true },
    refetchOnWindowFocus: false,
    // Don't retry failed auth checks (401 is expected)
    retry: false,
  });
};

/**
 * Login mutation - handles Google OAuth login
 * Shows error notifications on failure via api.client error handler
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse | null, unknown, string>({
    mutationFn: loginGoogle,
    onSuccess: (data) => {
      if (data) {
        // Update session cache
        queryClient.setQueryData(['auth', 'session'], data.user);
      }
    },
    // Errors are handled by api.client and shown as notifications
    // We catch in component to prevent error page
    throwOnError: false,
  });
};

/**
 * Logout mutation
 * Clears session cache and redirects
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string } | null, unknown, void>({
    mutationFn: logout,
    onSuccess: (data) => {
      if (data) {
        // Clear all auth-related caches
        queryClient.removeQueries({ queryKey: ['auth'] });
        // Redirect handled by component
      }
    },
  });
};

