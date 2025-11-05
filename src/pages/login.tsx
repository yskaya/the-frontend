import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';
import { redirectIfAuthenticated } from '@/features/auth';
import { LoginGoogleButtonSkeleton } from '@/components/LoginGoogleButton/LoginGoogleButtonSkeleton';
import Link from 'next/link';
import '../components.css';

// ✨ LoginGoogleButton needs GoogleOAuthProvider, so we load it client-side only
const LoginGoogleButton = dynamic(
  () => import('@/components/LoginGoogleButton').then(mod => ({ default: mod.LoginGoogleButton })),
  { 
    ssr: false, 
    loading: () => <LoginGoogleButtonSkeleton />
  }
);

export default function LoginPage() {
  // ✨ If this page renders, user is NOT authenticated (verified server-side)
  
  return (
    <div className="dark min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Top Section - Welcome and Logo */}
      <div className="flex flex-col items-center mb-16">
        <p className="welcome-text">
          Welcome to
        </p>
        <div className="paypay-logo-container">
          <span className="text-white">pay</span>
          <span className="paypay-logo-purple">pay</span>
        </div>
      </div>

      {/* Center Card */}
      <div className="signin-box mb-8">
        <h2 className="signin-heading">
          Sign in to your account
        </h2>
        <div className="flex justify-center">
          <LoginGoogleButton />
        </div>
      </div>

      {/* Bottom Terms */}
      <p className="terms-text">
        By continuing to log in, you agree to the{' '}
        <Link href="/terms" className="font-bold hover:underline">
          terms of use
        </Link>
        {' '}and{' '}
        <Link href="/policy" className="font-bold hover:underline">
          policy
        </Link>
      </p>
    </div>
  );
}

// ✨ Server-side check - redirects to dashboard if already logged in
export const getServerSideProps: GetServerSideProps = async (context) => {
  return redirectIfAuthenticated(context);
};
