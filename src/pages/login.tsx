import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';
import { redirectIfAuthenticated } from '@/features/auth';
import { LoginGoogleButtonSkeleton } from '@/components/LoginGoogleButton/LoginGoogleButtonSkeleton';

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start max-w-4xl">
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-3xl font-bold">Welcome to PayPay</h1>
          <p className="text-gray-600">Sign in to continue</p>
          <LoginGoogleButton />
        </div>
      </main>
    </div>
  );
}

// ✨ Server-side check - redirects to dashboard if already logged in
export const getServerSideProps: GetServerSideProps = async (context) => {
  return redirectIfAuthenticated(context);
};
