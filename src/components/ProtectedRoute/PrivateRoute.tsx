
import { useContext, useEffect, ReactNode } from "react";
import { AuthContext } from "../../context/Auth/AuthProvider";
import { useRouter } from 'next/router';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, validateMe } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    validateMe();
  }, [validateMe]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return children;
}
