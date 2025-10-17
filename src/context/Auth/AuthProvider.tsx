import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { validate } from '@/api/auth.api';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuthContext = () => useContext(AuthContext);

/**
 * ✨ Simplified AuthProvider - works with server-side auth
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
    try {
      const data = await validate();
      if (data) {
        setUser(data as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};


