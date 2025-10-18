import { useEffect } from 'react';
import { LogoutButton, requireAuth, useAuthContext, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const { setUser } = useAuthContext();

  // Sync server-side user data to context on mount
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  // Safety check - should never happen with requireAuth, but just in case
  if (!user || !user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome, {user.firstName || user.email.split('@')[0]}!</p>
          <p className="text-sm text-gray-600">{user.email}</p>
          <LogoutButton />
        </div>
      </main>
    </div>
  );
};

// ✨ Server-side auth validation - no loading state, instant redirect
export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context);
};

export default Dashboard;
