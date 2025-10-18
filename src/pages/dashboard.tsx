import { useEffect } from 'react';
import { LogoutButton, requireAuth, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';
import { queryClient } from '@/lib/queryClient';

interface DashboardProps {
  initialUser: User;
}

/**
 * Dashboard page - server-rendered, no Suspense needed
 * Cache pre-populated for instant future navigations
 */
const Dashboard = ({ initialUser }: DashboardProps) => {
  // Pre-populate React Query cache with server data for future navigations
  useEffect(() => {
    queryClient.setQueryData(['auth', 'session'], initialUser);
  }, [initialUser]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome, {initialUser.firstName || initialUser.email.split('@')[0]}!</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{initialUser.email}</p>
          <LogoutButton />
        </div>
      </main>
    </div>
  );
};

// ✨ Server-side auth validation - instant redirect if not logged in
export const getServerSideProps: GetServerSideProps = async (context) => {
  const result = await requireAuth(context);
  
  // Pass user as initialUser for Suspense
  if ('props' in result && result.props) {
    return {
      props: {
        initialUser: result.props.user,
      },
    };
  }
  
  return result;
};

export default Dashboard;
