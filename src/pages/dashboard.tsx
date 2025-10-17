import { useAuthContext } from '@/context/Auth/AuthProvider';
import { LogoutButton } from '@/components/LogoutButton';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Dashboard = () => {
  const { user } = useAuthContext();

  return (
    <ProtectedRoute>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <div className="flex flex-col gap-4">
            {user && (
              <>
                <p>Welcome <br/>{user.email}</p>
                <LogoutButton />
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

// Disable SSR for this page
export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default Dashboard;
