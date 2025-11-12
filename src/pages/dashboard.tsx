import { useRef } from 'react';
import type { GetServerSideProps } from 'next';
import { type User, useClientAuth } from '@/features/auth';
import {
  useWallet,
  WalletNetworkPanel,
  WalletSection,
  WalletNotFound,
  WalletLoading,
  WalletSectionHandle,
  BlockchainProvider,
} from '@/features/blockchain';
import { ActivePayrollsSection } from '@/features/payrolls';
import { ProfilePanel } from '@/features/profile/ProfilePanel';
import { PaypayLogo } from '@/components/PaypayLogo';
import { RefreshBanner, useRefreshAll } from '@/features/syncData';
import { DashboardProvider } from './DashboardProvider';
import { DashboardLists } from './DashboardLists';

interface DashboardContentProps {
  user: User;
}

interface DashboardProps {
  serverUser: User | null;
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const isRefreshing = useRefreshAll(user.id);
  const { data: wallet, isLoading: isWalletLoading } = useWallet(user.id);
  /* TODO: get rid of ref */
  const walletSectionRef = useRef<WalletSectionHandle | null>(null);
  return (
    <DashboardProvider>
      <div className="min-h-screen">
        
        <RefreshBanner isVisible={isRefreshing} />
        <header className="border-b border-white/10 backdrop-blur-xl">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
            <WalletNetworkPanel />
            <PaypayLogo size="sm" />
            <ProfilePanel walletSectionRef={walletSectionRef} />
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-10">
          {isWalletLoading ? (
            <WalletLoading />
          ) : !wallet ? (
            <WalletNotFound />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-10">
                <WalletSection ref={walletSectionRef} wallet={wallet} />
                <ActivePayrollsSection />
              </div>
              <DashboardLists />
            </>
          )}
        </main>
      </div>
    </DashboardProvider>
  );
};

const DashboardView = () => {
  const { user, status } = useClientAuth();

  if (status !== 'authenticated' || !user) {
    return null;
  }

  return (
    <BlockchainProvider userId={user.id}>
      <DashboardContent user={user} />
    </BlockchainProvider>
  );
};

// ✨ Server-side auth validation - instant redirect if not logged in
// NOTE: If cookies are blocked, this will return no user, but client-side auth will handle it
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = context.req.headers.cookie || '';
    const hasAuthCookies =
      cookies.includes('access_token=') || cookies.includes('refresh_token=');

    // Use validateServerAuth directly instead of requireAuth
    // This allows us to NOT redirect if cookies aren't present, letting client-side handle it
    const { validateServerAuth } = await import('@/features/auth/serverAuth');
    const user = await validateServerAuth(context);
    
    // If user found via cookies (server-side auth worked), return it
    if (user && user.id) {
      console.log('[Dashboard SSR] ✅ Server-side auth successful, user:', user.email);
      return {
        props: {
          serverUser: user,
        },
      };
    }
    
    // If no user found via cookies, DON'T redirect - let client-side handle it with localStorage
    // This prevents redirect loops when cookies aren't stored in browser (cross-origin issue)
    console.log('[Dashboard SSR] Server-side auth failed (cookies blocked or not present)');
    console.log('[Dashboard SSR] Allowing client-side auth to handle it with localStorage');
    
    if (!hasAuthCookies) {
      return {
        props: {
          serverUser: null as any, // Will be handled client-side
        },
      };
    }

    return {
      redirect: {
        destination: '/login?sessionExpired=1',
        permanent: false,
      },
    };
  } catch (error) {
    console.error('[Dashboard SSR] Error in getServerSideProps:', error);
    // On error, allow client-side to handle it
    return {
      props: {
        serverUser: null as any,
      },
    };
  }
};

const Dashboard = (_props: DashboardProps) => (
  <DashboardProvider>
    <DashboardView />
  </DashboardProvider>
);

export default Dashboard;
