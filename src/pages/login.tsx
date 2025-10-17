import { LoginContent } from '@/components/Login';
import { redirectIfAuthenticated } from '@/lib/serverAuth';
import { GetServerSideProps } from 'next';

export default function LoginPage() {
  return <LoginContent />;
}

// ✨ Server-side check - redirects to dashboard if already logged in
export const getServerSideProps: GetServerSideProps = async (context) => {
  return redirectIfAuthenticated(context);
};
