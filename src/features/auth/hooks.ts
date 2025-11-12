import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginGoogle, logout, validate, type LoginResponse } from './api';
import { useAuthContext } from './AuthProvider';
import { User } from './types';
import { toast } from 'sonner';

const SESSION_EXPIRED_FLAG = 'session_expired';

/**
 * Validates current session (silent - no error notifications)
 * Uses React Query for caching and automatic refetching
 * NOTE: Not used with Suspense - we use server-side rendering instead
 */
interface UseValidateSessionOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const useValidateSession = ({
  enabled = true,
  refetchInterval = false,
}: UseValidateSessionOptions = {}) => {
  return useQuery<User | null>({
    queryKey: ['auth', 'session'],
    queryFn: validate,
    // Don't show error notifications for auth checks
    meta: { silent: true },
    refetchOnWindowFocus: false,
    // Don't retry failed auth checks (401 is expected)
    retry: false,
    enabled,
    refetchInterval,
    refetchIntervalInBackground: Boolean(refetchInterval),
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

export type ClientAuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface UseClientAuthOptions {
  /**
   * Path to redirect to when auth validation fails. Set to null to disable redirects.
   * Defaults to "/login".
   */
  redirectTo?: string | null;
}

const DEFAULT_SESSION_CHECK_INTERVAL_MS = false;

interface SessionExpiryCleanupArgs {
  queryClient: ReturnType<typeof useQueryClient>;
  setUser: (user: User | null) => void;
  router: ReturnType<typeof useRouter>;
  redirectTo: string | null | undefined;
  hasValidationError: MutableRefObject<boolean>;
  hasHandledSessionExpiry: MutableRefObject<boolean>;
  hasIssuedRedirect: MutableRefObject<boolean>;
  hasTriggeredValidation: MutableRefObject<boolean>;
}

const performSessionExpiryCleanup = ({
  queryClient,
  setUser,
  router,
  redirectTo,
  hasValidationError,
  hasHandledSessionExpiry,
  hasIssuedRedirect,
  hasTriggeredValidation,
}: SessionExpiryCleanupArgs) => {
  console.debug('[auth] performSessionExpiryCleanup invoked', {
    redirectTo,
    hasValidationError: hasValidationError.current,
    hasHandledSessionExpiry: hasHandledSessionExpiry.current,
    hasIssuedRedirect: hasIssuedRedirect.current,
    hasTriggeredValidation: hasTriggeredValidation.current,
  });

  setUser(null);
  hasValidationError.current = true;
  hasHandledSessionExpiry.current = false;
  hasIssuedRedirect.current = false;
  hasTriggeredValidation.current = false;

  queryClient.setQueryData(['auth', 'session'], null);
  queryClient.removeQueries({ queryKey: ['wallet'], exact: false });
  queryClient.removeQueries({ queryKey: ['transactions'], exact: false });
  queryClient.removeQueries({ queryKey: ['payrolls'], exact: false });
  queryClient.removeQueries({ queryKey: ['payroll-payments'], exact: false });
  queryClient.removeQueries({ queryKey: ['auth'], exact: false });
  queryClient.removeQueries({ queryKey: ['auth', 'session'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('auth_user');
      window.localStorage.removeItem('user_id');
      window.localStorage.setItem(SESSION_EXPIRED_FLAG, '1');
    } catch (error) {
      console.debug('[auth] Failed to update localStorage during session expiry', error);
    }
  }

  toast.error('Session expired', {
    description: 'Please sign in again.',
    duration: 5000,
  });

  if (!hasIssuedRedirect.current && redirectTo !== null) {
    hasIssuedRedirect.current = true;
    const redirectPath = redirectTo || '/login';
    const target = { pathname: redirectPath, query: { sessionExpired: '1' } };
    void router.replace(target).catch(() => {});
  }
};


/**
 * Client-side auth guard hook.
 *
 * Responsibilities:
 * - Hydrate auth context from SSR `serverUser` (via AuthProvider) or validate session client-side.
 * - Populate React Query cache with the authenticated user.
 * - Ensure `user_id` is stored in localStorage for API fallbacks (dashboard requires this).
 * - Redirect to login (configurable) when authentication fails.
 */
export const useClientAuth = (options: UseClientAuthOptions = {}) => {
  const { user, setUser } = useAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const redirectTo = options.redirectTo === undefined ? '/login' : options.redirectTo;
  const isClient = typeof window !== 'undefined';
  const hasTriggeredValidation = useRef(false);
  const hasHandledSessionExpiry = useRef(false);
  const hasValidationError = useRef(false);
  const hasIssuedRedirect = useRef(false);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldValidateSession =
    isClient && (!user || !hasTriggeredValidation.current || hasValidationError.current);
  const sessionCheckInterval = false;

  const {
    data: validatedUser,
    isLoading: isValidationLoading,
    isFetched: isValidationFetched,
    isError: isValidationError,
    error: validationError,
  } = useValidateSession({
    enabled: shouldValidateSession,
    refetchInterval: sessionCheckInterval,
  });


  useEffect(() => {
    if (!isClient) {
      return;
    }

    const handleSessionExpired = () => {
      performSessionExpiryCleanup({
        queryClient,
        setUser,
        router,
        redirectTo,
        hasValidationError,
        hasHandledSessionExpiry,
        hasIssuedRedirect,
        hasTriggeredValidation,
      });
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [
    isClient,
    queryClient,
    setUser,
    router,
    redirectTo,
    hasValidationError,
    hasHandledSessionExpiry,
    hasIssuedRedirect,
    hasTriggeredValidation,
  ]);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    if (!hasTriggeredValidation.current && shouldValidateSession) {
      hasTriggeredValidation.current = true;
    }
  }, [shouldValidateSession, isClient]);

  // If the validation query returns a user and context is empty, hydrate it.
  useEffect(() => {
    if (!user && validatedUser) {
      setUser(validatedUser);
    }
  }, [user, validatedUser, setUser]);

  useEffect(() => {
    if (!isValidationFetched || isValidationLoading) {
      return;
    }

    if (validatedUser === null && !hasHandledSessionExpiry.current) {
      performSessionExpiryCleanup({
        queryClient,
        setUser,
        router,
        redirectTo,
        hasValidationError,
        hasHandledSessionExpiry,
        hasIssuedRedirect,
        hasTriggeredValidation,
      });
    }
  }, [
    isValidationFetched,
    isValidationLoading,
    validatedUser,
    setUser,
    queryClient,
    router,
    redirectTo,
    hasValidationError,
    hasHandledSessionExpiry,
    hasIssuedRedirect,
    hasTriggeredValidation,
  ]);

  const resolvedUser = user ?? validatedUser ?? null;

  // Keep auth query cache in sync for downstream hooks relying on React Query.
  useEffect(() => {
    if (resolvedUser) {
      queryClient.setQueryData(['auth', 'session'], resolvedUser);
    }
  }, [resolvedUser, queryClient]);

  // Ensure `user_id` is available in localStorage for API client fallbacks.
  useEffect(() => {
    if (!isClient || !resolvedUser?.id) {
      return;
    }

    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      localStorage.setItem('user_id', resolvedUser.id);
    }
  }, [resolvedUser?.id, isClient]);

  const hasAttemptedValidation = useMemo(() => {
    if (!shouldValidateSession) {
      // Either we already have a user, or we're on the server
      return true;
    }
    return isValidationFetched || isValidationError;
  }, [shouldValidateSession, isValidationFetched, isValidationError]);

  const status: ClientAuthStatus = resolvedUser
    ? 'authenticated'
    : !hasAttemptedValidation || isValidationLoading
      ? 'loading'
      : isValidationError
        ? 'error'
        : 'unauthenticated';

  useEffect(() => {
    if (status === 'authenticated') {
      hasHandledSessionExpiry.current = false;
      hasValidationError.current = false;
      hasIssuedRedirect.current = false;
      hasTriggeredValidation.current = false;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SESSION_EXPIRED_FLAG);
      }
      return;
    }

    if (
      status === 'unauthenticated' &&
      hasAttemptedValidation &&
      !hasHandledSessionExpiry.current
    ) {
      hasHandledSessionExpiry.current = true;
      performSessionExpiryCleanup({
        queryClient,
        setUser,
        router,
        redirectTo,
        hasValidationError,
        hasHandledSessionExpiry,
        hasIssuedRedirect,
        hasTriggeredValidation,
      });
    }
  }, [
    status,
    hasAttemptedValidation,
    queryClient,
    setUser,
    router,
    redirectTo,
    hasValidationError,
    hasHandledSessionExpiry,
    hasIssuedRedirect,
    hasTriggeredValidation,
  ]);

  return {
    user: resolvedUser,
    status,
    isLoading: status === 'loading',
    error: status === 'error' ? validationError : null,
  };
};


