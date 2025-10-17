import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/router';
import { loginGoogle } from '@/api/auth.api';
import { useAuthContext } from '@/context/Auth/AuthProvider';

interface LoginGoogleButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoginGoogleButton: React.FC<LoginGoogleButtonProps> = ({ 
  className = "rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5",
  children = "Login with Google"
}) => {
  const { setUser } = useAuthContext();
  const router = useRouter();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const response = await loginGoogle(codeResponse.code);
      if (response) {
        setUser(response.user);
        router.push('/dashboard');
      }
      // If null, error notification already shown by API client
    },
    onError: (err) => console.error('Google OAuth failed:', err),
    flow: 'auth-code', //implicit || auth-code
    scope: 'email profile openid'
  });

  return (
    <a
      className={className}
      rel="noopener noreferrer"
      onClick={handleGoogleLogin}
    >
      {children}
    </a>
  );
};
