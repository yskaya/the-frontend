import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { redirectIfAuthenticated } from '@/features/auth';
import { LoginGoogleButtonSkeleton } from '@/components/LoginGoogleButton/LoginGoogleButtonSkeleton';
import { PaypayLogo } from '@/components/PaypayLogo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

// ✨ LoginGoogleButton needs GoogleOAuthProvider, so we load it client-side only
const LoginGoogleButton = dynamic(
  () => import('@/components/LoginGoogleButton').then(mod => ({ default: mod.LoginGoogleButton })),
  { 
    ssr: false, 
    loading: () => <LoginGoogleButtonSkeleton />
  }
);

export default function LoginPage({ logout }: { logout?: boolean }) {
  // ✨ If this page renders, user is NOT authenticated (verified server-side)
  const router = useRouter();
  const [hasShownSessionToast, setHasShownSessionToast] = useState(false);

  useEffect(() => {
    if (hasShownSessionToast) {
      return;
    }

    const sessionExpiredQuery = router.query.sessionExpired;
    const hasSessionExpiredFlagInQuery =
      typeof sessionExpiredQuery === 'string' && sessionExpiredQuery === '1';

    const hasSessionExpiredFlagInStorage =
      typeof window !== 'undefined' && localStorage.getItem('session_expired') === '1';

    if (!hasSessionExpiredFlagInQuery && !hasSessionExpiredFlagInStorage) {
      return;
    }

    toast.error('Session expired', {
      description: 'Please sign in again.',
      duration: 5000,
    });

    setHasShownSessionToast(true);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_expired');
    }

    if (hasSessionExpiredFlagInQuery) {
      const newQuery = { ...router.query };
      delete newQuery.sessionExpired;
      void router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true },
      ).catch(() => {});
    }
  }, [router, hasShownSessionToast, logout]);
  
  return (
    <div className="dark min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Top Section - Welcome and Logo */}
      <div className="flex flex-col items-center mb-16">
        <p className="text-center font-handlee text-[18px] leading-6 tracking-[-0.03em] text-white">
          Welcome to
        </p>
        <PaypayLogo />
      </div>

      {/* Center Card */}
      <div className="mb-8 flex h-[336px] w-[388px] flex-col items-center gap-[60px] rounded-[48px] bg-[#301c3b] px-[44px] py-20">
        <h2 className="text-center font-nunito text-[30px] font-bold leading-[30px] tracking-[-0.03em] text-white">
          Sign in to your account
        </h2>
        <div className="flex justify-center">
          <LoginGoogleButton />
        </div>
      </div>

      {/* Bottom Terms */}
      <p className="w-[275px] rounded-lg px-4 py-2 text-center font-nunito text-[16px] font-normal leading-5 tracking-[-0.02em] text-white/40">
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
  const props = await redirectIfAuthenticated(context);
  if ('redirect' in props) {
    return props;
  }
  return {
    props: {
      logout: context.query.logout === '1' ? true : false,
    },
  };
};
