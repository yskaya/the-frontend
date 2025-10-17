import { createContext, useContext, useState, useCallback } from 'react';
import { validate } from '@/api/auth.api';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  validateMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const validateMe = useCallback(async () => {
    const data = await validate();
    if (data) {
      setUser(data as User);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // validateMe is now called in ProtectedRoute component

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      setUser,
      validateMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
};


