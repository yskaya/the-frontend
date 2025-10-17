import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      console.log('✅ Google OAuth success callback triggered');
      console.log('Code response:', codeResponse);
      
      try {
        const response = await loginGoogle(codeResponse.code);
        console.log('API response:', response);
        
        if (response && response.user) {
          console.log('Login successful, user:', response.user);
          setUser(response.user);
          
          // Wait a bit to ensure cookies are fully set by browser
          console.log('Waiting for cookies to be set...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('Cookies after login:', document.cookie);
          console.log('Redirecting to dashboard...');
          
          // Full page reload to ensure cookies are sent to server-side getServerSideProps
          window.location.href = '/dashboard';
        } else {
          console.error('Login failed - no user in response');
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    },
    onError: (err) => {
      console.error('❌ Google OAuth error:', err);
    },
    flow: 'auth-code',
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
