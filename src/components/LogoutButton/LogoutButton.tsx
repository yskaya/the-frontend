import React from 'react';
import { useLogout } from '@/features/auth/hooks';
import { useAuthContext } from '@/features/auth/AuthProvider';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = "rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5",
  children = "Logout"
}) => {
  const { setUser } = useAuthContext();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      // Use React Query mutation
      const data = await logoutMutation.mutateAsync();
      
      // CRITICAL: Always clear localStorage tokens, even if logout API call fails
      // This ensures logout works even if cookies are deleted
      console.log('[LogoutButton] Clearing localStorage tokens...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_user');
        console.log('[LogoutButton] ✅ localStorage tokens cleared');
      }
      
      // Clear user state
      setUser(null);
      
      // Only redirect if logout succeeded OR if we cleared localStorage (force logout)
      if (data || typeof window !== 'undefined') {
        // Use window.location for full page reload to clear cookies properly
        console.log('[LogoutButton] Redirecting to login...');
        window.location.href = '/login';
      }
    } catch (error) {
      // Even if logout API call fails, clear localStorage and redirect
      console.error('[LogoutButton] Logout API call failed, but clearing localStorage anyway:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('auth_user');
        setUser(null);
        window.location.href = '/login';
      }
    }
  };

  return (
    <button 
      onClick={() => {
        // Wrap in handler to catch any unhandled promises
        handleLogout().catch(err => {
          console.error('Logout button error caught:', err);
          // Error already handled by notification system
        });
      }}
      className={className}
    >
      {children}
    </button>
  );
};

