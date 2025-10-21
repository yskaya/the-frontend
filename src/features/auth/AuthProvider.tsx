import { createContext, useContext, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { validate } from './auth.api';
import { User } from './auth.types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuthContext = () => useContext(AuthContext);

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
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Optional: Refresh user data from API (useful after updates)
  const refreshUser = useCallback(async () => {
    const user = await validate();
    setUser(user);
  }, []);

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

