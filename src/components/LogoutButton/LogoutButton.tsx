import React from 'react';
import { useLogout } from '@/features/auth/useAuth';
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
    // Use React Query mutation
    const data = await logoutMutation.mutateAsync();
    
    // Only clear user and redirect if logout succeeded
    if (data) {
      setUser(null);
      // Use window.location for full page reload to clear cookies properly
      window.location.href = '/';
    }
    // If null, error notification already shown by mutation onError
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

