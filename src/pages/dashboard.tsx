import { useEffect, useState, useRef } from 'react';
import { requireAuth, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';
import { queryClient } from '@/lib';
import { useWallet, useCreateWallet, useRefreshWallet, useSyncTransactions } from '@/features/wallet';
import { Wallet, Users, Send, Share2, LogOut, Plus, Copy, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/ui/sheet';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Dialog, DialogContent } from '@/ui/dialog';
import { LogoutButton } from '@/components/LogoutButton';
import { ContactsPanel } from '@/features/contacts';
import { TransactionsPanel, SendCryptoDialog, ReceiveCryptoDialog } from '@/features/wallet';
import { PayrollDialog, ScheduledPaymentsPanel, CompletedPayrollsPanel, PayrollsToSignPanel, PayrollDetailsDialog, PayrollsPanel } from '@/features/scheduled-payments';
import { toast } from 'sonner';


interface DashboardProps {
  initialUser: User | null;
}

/**
 * Dashboard page - matches FigmaFiles/App.tsx styling with dark theme
 */
const Dashboard = ({ initialUser }: DashboardProps) => {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendRecipient, setSendRecipient] = useState<{ address: string; name: string } | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [payrollsOpen, setPayrollsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isClientAuthValid, setIsClientAuthValid] = useState<boolean | null>(null);
  const [clientUser, setClientUser] = useState<User | null>(initialUser);
  
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
        const { validate } = await import('@/features/auth/auth.api');
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
  
  // Use clientUser if server-side user is not available (cookies blocked or deleted)
  const user = initialUser && initialUser.id ? initialUser : clientUser;
  
  // CRITICAL: All hooks must be called BEFORE any conditional returns
  // This ensures hooks are called in the same order every render
  // Use optional userId - hooks will handle undefined gracefully
  const userId = user?.id;
  const { data: wallet, isLoading: walletLoading } = useWallet(userId);
  const createWalletMutation = useCreateWallet(userId);
  const refreshWallet = useRefreshWallet(userId);
  const syncTransactions = useSyncTransactions();
  const hasSyncedOnLogin = useRef(false);
  
  // Pre-populate auth cache (MUST be called before conditional returns)
  useEffect(() => {
    if (user) {
      queryClient.setQueryData(['auth', 'session'], user);
    }
  }, [user]);
  
  // Auto-sync transactions on login (only once) - MUST be called before conditional returns
  useEffect(() => {
    if (wallet && !hasSyncedOnLogin.current && !walletLoading) {
      hasSyncedOnLogin.current = true;
      console.log('[Dashboard] Auto-syncing transactions on login...');
      syncTransactions.mutate();
    }
  }, [wallet, walletLoading, syncTransactions]);
  
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

  // Handler to open send dialog with pre-filled recipient
  const handleOpenSendTo = (address: string, name: string) => {
    setSendRecipient({ address, name });
    setSendOpen(true);
    // Keep contacts panel open - only the contact detail dialog closes
  };

  const walletAddress = wallet?.address || "";
  const balance = wallet?.balance || "0";
  // Calculate USD value using same conversion rate as other places (3243.0)
  const ETH_PRICE = 3243.0;
  const balanceUSD = (parseFloat(balance) * ETH_PRICE).toFixed(2);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard!');
    }
  };

  return (
    <div className="dark min-h-screen bg-black text-white">
      {/* Modern Minimal Header */}
      <header className="border-b border-white/10 bg-gradient-to-b from-zinc-900/50 to-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Menu */}
            <div className="flex gap-3">
              <Sheet open={payrollsOpen} onOpenChange={setPayrollsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 rounded-full border gap-2 transition-all ${
                      payrollsOpen 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    <span className="hidden sm:inline text-sm">Payrolls</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-[500px] min-w-[300px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0">
                  <PayrollsPanel />
                </SheetContent>
              </Sheet>
            </div>

            {/* Center - PayPay Logo */}
            <div className="flex-1 flex justify-center">
              <div className="paypay-logo-container" style={{ fontSize: '27px' }}>
                <span className="text-white">pay</span>
                <span className="paypay-logo-purple">pay</span>
              </div>
            </div>

            {/* Right - Avatar */}
            <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full p-0 hover:bg-white/10"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white/10 text-white border border-white/20">
                      {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
                     <SheetContent side="right" className="w-full sm:w-[500px] min-w-[300px] bg-[rgba(20,0,35,0.95)] border-white/10">
                       <div className="space-y-6 p-8">
                         {/* User Info */}
                         <div className="flex flex-col items-center gap-4 pt-8">
                           <Avatar className="h-20 w-20">
                             <AvatarFallback className="bg-white/10 text-white text-2xl border-2 border-white/20">
                               {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                             </AvatarFallback>
                           </Avatar>
                           <div className="text-center">
                             <p className="text-white font-semibold text-lg">
                               {user?.firstName && user?.lastName 
                                 ? `${user.firstName} ${user.lastName}`
                                 : user?.email || 'User'
                               }
                             </p>
                             <p className="text-gray-400 text-sm mt-1">
                               {user?.email || ''}
                             </p>
                           </div>
                         </div>

                         {/* Separator */}
                         <div className="border-t border-white/10"></div>

                         {/* Contacts Link */}
                         <Sheet open={contactsOpen} onOpenChange={setContactsOpen}>
                           <SheetTrigger asChild>
                             <Button
                               variant="ghost"
                               className="w-full justify-start text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg"
                             >
                               <Users className="h-4 w-4" />
                               Contacts
                             </Button>
                           </SheetTrigger>
                           <SheetContent side="right" className="w-full sm:w-[500px] min-w-[300px] right-[500px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0">
                             <ContactsPanel onSendTo={handleOpenSendTo} />
                           </SheetContent>
                         </Sheet>

                         {/* Separator */}
                         <div className="border-t border-white/10"></div>

                         {/* Actions */}
                         <div className="space-y-2 flex justify-center">
                           <LogoutButton 
                             className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-2 px-4 py-3 rounded-lg"
                           >
                             <LogOut className="h-4 w-4" />
                             Exit
                           </LogoutButton>
                         </div>
                       </div>
                     </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Big Balance Widget or Create Wallet */}
        {walletLoading ? (
          <div className="wallet-box">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Loading wallet...</p>
            </div>
          </div>
        ) : !wallet ? (
          <div className="wallet-box text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No Wallet Found</h2>
              <p className="text-gray-400 mb-6">
                Create a new Ethereum wallet to start sending and receiving crypto
              </p>
              <Button
                onClick={() => createWalletMutation.mutate()}
                disabled={createWalletMutation.isPending}
                className="h-12 gap-2 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold"
              >
                <Plus className="h-5 w-5" />
                {createWalletMutation.isPending ? 'Creating Wallet...' : 'Create Wallet'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Half - Wallet */}
            <div className="wallet-box">
              <div className="flex flex-col gap-6">
                {/* Wallet Address with Network */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-400 font-mono">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyAddress}
                      className="h-6 w-6 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Network - Aligned Right */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <p className="text-xs font-medium text-white">{wallet?.network || 'Sepolia'}</p>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-5xl font-bold text-white">
                      ${balanceUSD}{" "}
                      <span className="text-3xl text-gray-400">USD</span>
                    </p>
                    {/* Refresh Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshWallet}
                      className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      title="Refresh wallet"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xl text-gray-400">
                    {balance}{" "}
                    <span className="text-lg text-gray-500">ETH</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => setSendOpen(true)}
                    className="h-12 gap-2 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold"
                  >
                    <Send className="h-5 w-5" />
                    Send
                  </Button>
                  <Button
                    onClick={() => setReceiveOpen(true)}
                    className="h-12 gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/30 rounded-xl font-semibold"
                  >
                    <Share2 className="h-5 w-5" />
                    Receive
                  </Button>
                  <PayrollDialog 
                    buttonClassName="h-12 gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/50 rounded-xl font-semibold"
                    buttonText="Schedule"
                  />
                </div>
              </div>
            </div>

            {/* Right Half - Payrolls to Sign */}
            <div>
              <PayrollsToSignPanel />
            </div>
          </div>
        )}

        {/* Transactions - Below */}
        {wallet && (
          <div className="mt-8">
            <TransactionsPanel />
          </div>
        )}
      </main>

      {/* Send Dialog */}
      <Dialog open={sendOpen} onOpenChange={(open) => {
        setSendOpen(open);
        if (!open) setSendRecipient(null);
      }}>
        <DialogContent aria-describedby={undefined}>
          <SendCryptoDialog 
            recipientAddress={sendRecipient?.address}
            recipientName={sendRecipient?.name}
            onSuccess={() => setSendOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent aria-describedby={undefined}>
          <ReceiveCryptoDialog walletAddress={walletAddress} />
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-gradient-to-t from-zinc-900/50 to-black/50 backdrop-blur-xl mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-6">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms
            </button>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
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

export default Dashboard;
