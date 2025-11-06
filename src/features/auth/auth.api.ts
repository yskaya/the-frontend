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
  console.log('[validate] Starting validation...');
  console.log('[validate] localStorage access_token:', typeof window !== 'undefined' ? localStorage.getItem('access_token')?.substring(0, 20) + '...' : 'N/A');
  
  // Use silent option to prevent notification spam on every page load
  const response = await api.get<{ user: User }>('/users/me', { silent: true });
  
  console.log('[validate] API response:', {
    hasData: !!response.data,
    hasError: !!response.error,
    error: response.error,
    dataKeys: response.data ? Object.keys(response.data) : [],
  });
  
  // Check if there's an error
  if (response.error) {
    console.error('[validate] ❌ API returned error:', response.error);
    return null;
  }
  
  // Backend returns { user: {...} }, unwrap it
  const responseData = response.data;
  let user: User | null = null;
  
  if (responseData) {
    // Check if responseData has a 'user' property (wrapped response: { user: User })
    if ('user' in responseData && responseData.user && typeof responseData.user === 'object') {
      user = responseData.user as User;
    } 
    // Check if responseData itself is a User (direct response: User)
    else if ('id' in responseData && 'email' in responseData && 'firstName' in responseData) {
      user = responseData as unknown as User;
    }
  }
  
  if (user && user.id) {
    console.log('[validate] ✅ Validation successful, user:', user.email);
    return user;
  }
  
  console.log('[validate] ❌ No valid user in response');
  console.log('[validate] Response data:', response.data);
  return null;
};
