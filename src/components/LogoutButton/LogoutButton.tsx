import React from 'react';
import { logout } from '@/api/auth.api';
import { useAuthContext } from '@/context/Auth/AuthProvider';

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  children = "Logout"
}) => {
  const { setUser } = useAuthContext();

  const handleLogout = async () => {
    const response = await logout();
    // Only clear user and redirect if logout succeeded
    if (response?.data) {
      setUser(null);
      // Use window.location for full page reload to clear cookies properly
      window.location.href = '/';
    }
    // If response has error, notification already shown by API client
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
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
    >
      {children}
    </button>
  );
};
