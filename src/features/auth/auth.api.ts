import { api } from '@/lib';
import { User } from './auth.types';

/**
 * Request/Response types (API-specific)
 */
export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Logs in with Google OAuth code
 * Shows error notifications on failure via API client
 */
export const loginGoogle = async (code: string): Promise<LoginResponse | null> => {
  console.log('[loginGoogle] Starting login with code:', code.substring(0, 20) + '...');
  const response = await api.post<LoginResponse>('/auth/login/google', { code });
  console.log('[loginGoogle] API response:', response);
  console.log('[loginGoogle] Response data:', response.data);
  console.log('[loginGoogle] Response error:', response.error);
  console.log('[loginGoogle] Cookies after login:', document.cookie);
  return response.data || null;
};

/**
 * Logs out current user
 * Shows error notifications on failure via API client
 */
export const logout = async (): Promise<{ message: string } | null> => {
  const response = await api.post<{ message: string }>('/auth/logout');
  return response.data || null;
};

/**
 * Validates current session (SILENT - no error notifications)
 * Used for auth checks where failure is expected (not logged in)
 * Returns user data if valid, null if not
 */
export const validate = async (): Promise<User | null> => {
  // Use silent option to prevent notification spam on every page load
  const response = await api.get<{ user: User }>('/users/me', { silent: true });
  // Backend returns { user: {...} }, unwrap it
  return response.data?.user || null;
};
