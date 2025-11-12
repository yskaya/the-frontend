import { useEffect, useState, useRef } from 'react';
import { requireAuth, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';
import { queryClient } from '@/lib';
import {
  useCreateWallet,
  NetworkPanel,
  WalletSection,
  WalletNotFound,
  WalletLoading,
  WalletSectionHandle,
} from '@/features/blockchain';
import { PaypayLogo } from '@/components/PaypayLogo';
import { ActivePayrollsSection } from '@/features/payrolls';
import { RefreshBanner } from '@/components/RefreshBanner';
import { DashboardProvider } from '@/features/dashboard/DashboardProvider';
import { DashboardLists } from '@/features/dashboard/DashboardLists';
import { useRefreshAll } from '@/features/dashboard/useRefreshAll';
import { ProfilePanel } from '@/features/dashboard/ProfilePanel';
import { BlockchainProvider } from '@/features/blockchain';

interface DashboardProps {
  initialUser: User | null;
}

interface DashboardContentProps {
  user: User;
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const walletSectionRef = useRef<WalletSectionHandle>(null);
  const { wallet, walletLoading, isRefreshing, showPullIndicator } = useRefreshAll(user.id);
  const createWalletMutation = useCreateWallet(user.id);

  const handleOpenSendTo = (address: string, name: string) => {
    walletSectionRef.current?.openSendTo(address, name);
  };

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0f0a1c] to-[#1a102e] text-white">
        <RefreshBanner isRefreshing={showPullIndicator || isRefreshing} />
        <header className="border-b border-white/10 bg-gradient-to-b from-black/60 to-black/20 backdrop-blur-xl">
          <div className="max-w-[1200px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <NetworkPanel networkName={wallet?.network || 'Sepolia'} />
              <PaypayLogo size="sm" />
              <ProfilePanel user={user} onSendTo={handleOpenSendTo} />
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-10">
          {walletLoading ? (
            <WalletLoading />
          ) : !wallet ? (
            <WalletNotFound
              onCreateWallet={() => createWalletMutation.mutate()}
              isCreatingWallet={createWalletMutation.isPending}
            />
          ) : (
            <div className="grid grid-cols-2 gap-10">
              <WalletSection ref={walletSectionRef} wallet={wallet} />
              <ActivePayrollsSection />
            </div>
          )}

          {wallet && <DashboardLists />}
        </main>
      </div>
    </DashboardProvider>
  );
};

/**
 * Dashboard page - matches FigmaFiles/App.tsx styling with dark theme
 */
const DashboardView = ({ initialUser }: DashboardProps) => {
  const [isClientAuthValid, setIsClientAuthValid] = useState<boolean | null>(null);
  const [clientUser, setClientUser] = useState<User | null>(initialUser);
  const user = initialUser && initialUser.id ? initialUser : clientUser;
  const userId = user?.id;
  
  // Client-side auth validation fallback (for when cookies are blocked or deleted)
  useEffect(() => {
    // If we have initialUser from server-side, we're good
    // BUT we still need to check localStorage as a fallback in case cookies are deleted
    if (initialUser && initialUser.id) {
      console.log('[Dashboard] ✅ Using server-side authenticated user');
      setIsClientAuthValid(true);
      
      // CRITICAL: Also store user ID in localStorage if not already there
      // This ensures localStorage is always available as fallback
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      if (!storedUserId && typeof window !== 'undefined') {
        console.log('[Dashboard] Storing user ID in localStorage as fallback');
        localStorage.setItem('user_id', initialUser.id);
      }
      
      // Don't return early - continue to check localStorage as fallback
      // This ensures if cookies are deleted, we can still authenticate
    }
    
    // ALWAYS check localStorage for tokens (even if server-side auth worked)
    // This ensures localStorage is always available as fallback if cookies are deleted
    console.log('[Dashboard] Checking localStorage as fallback...');
    
    // Helper function to validate tokens and set user
    async function validateAndSetUser(accessToken: string, userId: string): Promise<boolean> {
      console.log('[Dashboard] ✅ Tokens found in localStorage, validating...');
      console.log('[Dashboard] Token preview:', accessToken.substring(0, 50) + '...');
      try {
        const { validate } = await import('@/features/auth/api');
        const user = await validate();
        console.log('[Dashboard] Validate returned:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
        });
        if (user && user.id) {
          console.log('[Dashboard] ✅ Client-side auth validated, user:', user.email);
          setClientUser(user);
          setIsClientAuthValid(true);
          return true; // Success
        } else {
          console.log('[Dashboard] ❌ Client-side auth validation returned invalid user');
          console.log('[Dashboard] User object:', user);
          return false; // Failed
        }
      } catch (error: any) {
        console.error('[Dashboard] ❌ Client-side auth validation error:', error);
        console.error('[Dashboard] Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        // Redirect to login on any auth error
        console.log('[Dashboard] Auth validation failed, redirecting to login');
        setIsClientAuthValid(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return false; // Failed and redirecting
      }
    }
    
    // CRITICAL: Check localStorage IMMEDIATELY first (before any delays)
    // localStorage persists across redirects, so it should be available immediately
    const checkAuthImmediately = async () => {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      
      console.log('[Dashboard] IMMEDIATE localStorage check:', {
        hasAccessToken: !!accessToken,
        hasUserId: !!userId,
        hasInitialUser: !!initialUser,
        accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
        userIdPreview: userId || null,
        allLocalStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : [],
      });
      
      // If we have initialUser but localStorage tokens are missing, we need to set them
      // This can happen if cookies worked but localStorage wasn't set during login
      if (initialUser && initialUser.id && (!accessToken || !userId)) {
        console.log('[Dashboard] WARNING: Server-side auth worked but localStorage is missing tokens');
        console.log('[Dashboard] This means localStorage was not set during login - setting it now as fallback');
        // Note: We can't set access_token here because we don't have it (cookies are HttpOnly)
        // But we can set user_id for future use
        if (!userId && typeof window !== 'undefined') {
          localStorage.setItem('user_id', initialUser.id);
        }
        // We already have the user from server-side, so we're good
        return true; // Success - we have initialUser
      }
      
      // If we have tokens in localStorage, validate them
      if (accessToken && userId) {
        // Found tokens immediately - validate them right away
        console.log('[Dashboard] ✅ Tokens found immediately in localStorage, validating...');
        const success = await validateAndSetUser(accessToken, userId);
        return success; // Return true if successful
      }
      
      // If we have initialUser but no localStorage tokens, we're still good (cookies work)
      if (initialUser && initialUser.id) {
        console.log('[Dashboard] ✅ Using server-side user (cookies work, localStorage not needed)');
        return true; // Success - we have initialUser
      }
      
      return false; // Not found
    };
    
    // Try immediate check
    checkAuthImmediately().then((success) => {
      if (!success) {
        // If failed and we don't have initialUser, redirect to login
        if (!initialUser || !initialUser.id) {
          console.log('[Dashboard] ❌ No valid tokens found, redirecting to login');
          setIsClientAuthValid(false);
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    });
  }, [initialUser]);
  
  // Pre-populate auth cache (MUST be called before conditional returns)
  useEffect(() => {
    if (user) {
      queryClient.setQueryData(['auth', 'session'], user);
    }
  }, [user]);
  
  // Now safe to do conditional returns AFTER all hooks are called
  if (isClientAuthValid === false) {
    // Auth check completed and failed - redirecting
    return null; // Will redirect
  }
  
  // If we're still checking auth and don't have a user yet, show loading state
  // BUT: If we have localStorage tokens, we're still checking, so don't redirect yet
  if (isClientAuthValid === null && !user) {
    // Check if we have localStorage tokens - if yes, we're still validating
    const hasLocalStorageTokens = typeof window !== 'undefined' && 
      localStorage.getItem('access_token') && 
      localStorage.getItem('user_id');
    
    if (!hasLocalStorageTokens) {
      // No tokens in localStorage either - we're truly not authenticated
      // Still checking auth - show nothing (or loading spinner)
      return null; // Will either authenticate or redirect
    } else {
      // We have localStorage tokens but validation is still in progress
      // Wait a bit more before redirecting
      return null; // Will either authenticate or redirect
    }
  }
  
  // Type guard: At this point, we must have a user
  if (!user || !user.id) {
    return null; // Shouldn't happen, but TypeScript needs this
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
    // Use validateServerAuth directly instead of requireAuth
    // This allows us to NOT redirect if cookies aren't present, letting client-side handle it
    const { validateServerAuth } = await import('@/features/auth/serverAuth');
    const user = await validateServerAuth(context);
    
    // If user found via cookies (server-side auth worked), return it
    if (user && user.id) {
      console.log('[Dashboard SSR] ✅ Server-side auth successful, user:', user.email);
      return {
        props: {
          initialUser: user,
        },
      };
    }
    
    // If no user found via cookies, DON'T redirect - let client-side handle it with localStorage
    // This prevents redirect loops when cookies aren't stored in browser (cross-origin issue)
    console.log('[Dashboard SSR] Server-side auth failed (cookies blocked or not present)');
    console.log('[Dashboard SSR] Allowing client-side auth to handle it with localStorage');
    
    return {
      props: {
        initialUser: null as any, // Will be handled client-side
      },
    };
  } catch (error) {
    console.error('[Dashboard SSR] Error in getServerSideProps:', error);
    // On error, allow client-side to handle it
    return {
      props: {
        initialUser: null as any,
      },
    };
  }
};

const Dashboard = (props: DashboardProps) => (
  <DashboardProvider>
    <DashboardView {...props} />
  </DashboardProvider>
);

export default Dashboard;
