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
        console.log('[LoginGoogleButton] Google OAuth success, code received');
        console.log('[LoginGoogleButton] Calling loginMutation.mutateAsync...');
        const data = await loginMutation.mutateAsync(codeResponse.code);
        console.log('[LoginGoogleButton] Login mutation completed, data:', data);
        console.log('[LoginGoogleButton] Cookies after mutation:', document.cookie);
        
        if (data && data.user) {
          console.log('[LoginGoogleButton] Login successful, user:', data.user);
          setUser(data.user);
          
          // Set redirecting state to prevent error flash
          setIsRedirecting(true);
          
          console.log('[LoginGoogleButton] Redirecting to /dashboard...');
          // Redirect immediately (cookies are set by backend response)
          window.location.href = '/dashboard';
        } else if (!data) {
          // Login failed but didn't throw - error notification shown by api.client
          console.log('[LoginGoogleButton] Login failed - no data returned');
          setIsRedirecting(false);
        } else {
          console.log('[LoginGoogleButton] Login failed - data exists but no user:', data);
          setIsRedirecting(false);
        }
      } catch (error) {
        // Error notification already shown by api.client
        // Don't rethrow - just stay on login page
        console.error('[LoginGoogleButton] Login caught error:', error);
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
    <button
      className="bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={handleGoogleLogin}
      type="button"
      style={{
        width: '300px',
        height: '56px',
        borderRadius: '14px',
        padding: '10px 24px',
        gap: '8px',
      }}
    >
      {/* Google G Logo */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fillRule="evenodd">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.965-2.18l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.052-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.948 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.55 0 9s.348 2.827.957 4.042l2.99-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.948 7.29C4.66 5.157 6.65 3.58 9 3.58z" fill="#EA4335"/>
        </g>
      </svg>
      <span className="google-button-text">
        Sign in with Google
      </span>
    </button>
  );
};

