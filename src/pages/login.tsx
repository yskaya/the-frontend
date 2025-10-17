import dynamic from 'next/dynamic';

// Dynamically import login content with no SSR to prevent 500 errors
const LoginContent = dynamic(
  () => import('@/components/Login').then(mod => ({ default: mod.LoginContent })),
  { ssr: false }
);

export default function LoginPage() {
  return <LoginContent />;
}
