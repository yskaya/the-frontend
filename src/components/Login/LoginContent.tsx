import React from 'react';
import dynamic from 'next/dynamic';

// ✨ LoginGoogleButton needs GoogleOAuthProvider, so we load it client-side only
// Loading skeleton matches the actual button styling to prevent layout shift
const LoginGoogleButton = dynamic(
  () => import('@/components/LoginGoogleButton').then(mod => ({ default: mod.LoginGoogleButton })),
  { 
    ssr: false, 
    loading: () => (
      <div className="rounded-full border border-solid border-gray-300 flex items-center justify-center bg-gray-200 text-transparent gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 animate-pulse">
        Login with Google
      </div>
    )
  }
);

export const LoginContent = () => {
  // ✨ No need for client-side auth checks - server handles redirect in login.tsx
  // If this component renders, user is NOT authenticated (verified server-side)
  
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
};
