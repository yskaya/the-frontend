import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useLogin } from '@/features/auth/useAuth';
import { useAuthContext } from '@/features/auth/AuthProvider';
import { LoginGoogleButtonSkeleton } from './LoginGoogleButtonSkeleton';

interface LoginGoogleButtonProps {
  children?: React.ReactNode;
  loading?: boolean;
}

export const LoginGoogleButton: React.FC<LoginGoogleButtonProps> = ({ 
  children = "Login with Google",
  loading = false
}) => {
  // ✅ Call ALL hooks at the top - before any returns!
  const { setUser } = useAuthContext();
  const loginMutation = useLogin();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        // Use React Query mutation
        const data = await loginMutation.mutateAsync(codeResponse.code);
        
        if (data && data.user) {
          setUser(data.user);
          
          // Set redirecting state to prevent error flash
          setIsRedirecting(true);
          
          // Redirect immediately (cookies are set by backend response)
          window.location.href = '/dashboard';
        } else if (!data) {
          // Login failed but didn't throw - error notification shown by api.client
          setIsRedirecting(false);
        }
      } catch {
        // Error notification already shown by api.client
        // Don't rethrow - just stay on login page
        console.log('Login caught error - notification should be visible');
        setIsRedirecting(false);
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err);
    },
    flow: 'auth-code',
    scope: 'email profile openid'
  });

  // ✅ Conditional rendering AFTER all hooks
  if (loading || loginMutation.isPending || isRedirecting) {
    return <LoginGoogleButtonSkeleton>{children}</LoginGoogleButtonSkeleton>;
  }

  return (
    <a
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
      rel="noopener noreferrer"
      onClick={handleGoogleLogin}
    >
      {children}
    </a>
  );
};

