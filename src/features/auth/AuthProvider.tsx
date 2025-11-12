import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { validate } from './api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
  serverUser?: User | null;
}

const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cachedValue = window.localStorage.getItem('auth_user');
    if (!cachedValue) {
      return null;
    }

    const parsed = JSON.parse(cachedValue) as Partial<User>;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed as User;
    }

    window.localStorage.removeItem('auth_user');
  } catch (error) {
    console.error('[AuthProvider] Failed to parse cached auth_user. Clearing entry.', error);
    window.localStorage.removeItem('auth_user');
  }

  return null;
};

/**
 * ✨ Unified AuthProvider - combines Google OAuth + Auth Context
 * 
 * Includes:
 * - GoogleOAuthProvider for Google login
 * - Auth context for user state management
 * - Server-side auth validation support
 * 
 * Server-side pages (with getServerSideProps) handle:
 * - Initial auth validation
 * - Redirects for protected routes
 * - User data as props
 * 
 * This context is for:
 * - Storing user state for client-side access (no prop drilling)
 * - Updating user after login/logout
 * - Optional: refreshing user data on client-side
 */
export const AuthProvider = ({ children, serverUser = null }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    if (serverUser) {
      return serverUser;
    }

    return getCachedUser();
  });

  useEffect(() => {
    if (!serverUser || !serverUser.id) {
      return;
    }

    setUser((previous) => (previous?.id === serverUser.id ? previous : serverUser));
  }, [serverUser]);

  // Optional: Refresh user data from API (useful after updates)
  const refreshUser = useCallback(async () => {
    const user = await validate();
    setUser(user);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (user && user.id) {
      try {
        window.localStorage.setItem('auth_user', JSON.stringify(user));
      } catch (error) {
        console.error('[AuthProvider] Failed to cache auth_user in localStorage', error);
      }
      return;
    }

    window.localStorage.removeItem('auth_user');
  }, [user]);

  return (
    <GoogleOAuthProvider clientId="952783879606-2q3f1p31kf43aq11vs5vbi5nf9dsoueo.apps.googleusercontent.com">
      <AuthContext.Provider value={{
        user,
        setUser,
        refreshUser,
      }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

