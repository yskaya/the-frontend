import { useEffect, useState, useRef } from 'react';
import { requireAuth, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';
import { queryClient } from '@/lib';
import { useWallet, useCreateWallet, useRefreshWallet, useSyncTransactions } from '@/features/wallet';
import { Wallet, Users, Send, Share2, LogOut, Plus, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/ui/sheet';
import { Dialog, DialogContent } from '@/ui/dialog';
import { LogoutButton } from '@/components/LogoutButton';
import { ContactsPanel } from '@/features/contacts';
import { TransactionsPanel, SendCryptoDialog, ReceiveCryptoDialog } from '@/features/wallet';
import { PayrollDialog, ScheduledPaymentsPanel, CompletedPayrollsPanel } from '@/features/scheduled-payments';
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
  const [isClientAuthValid, setIsClientAuthValid] = useState<boolean | null>(null);
  const [clientUser, setClientUser] = useState<User | null>(initialUser);
  
  // Client-side auth validation fallback (for when cookies are blocked)
  useEffect(() => {
    // If we have initialUser from server-side, we're good
    if (initialUser && initialUser.id) {
      console.log('[Dashboard] Using server-side authenticated user');
      setIsClientAuthValid(true);
      return;
    }
    
    // Otherwise, check localStorage for tokens (cookies blocked)
    console.log('[Dashboard] No server-side user, checking localStorage...');
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    
    if (!accessToken || !userId) {
      console.log('[Dashboard] No tokens in localStorage, redirecting to login');
      setIsClientAuthValid(false);
      window.location.href = '/login';
      return;
    }
    
    // Validate token with API call
    console.log('[Dashboard] Validating token from localStorage...');
    const validateAuth = async () => {
      try {
        const { validate } = await import('@/features/auth/auth.api');
        const user = await validate();
        if (user) {
          console.log('[Dashboard] ✅ Client-side auth validated, user:', user.email);
          setClientUser(user);
          setIsClientAuthValid(true);
        } else {
          console.log('[Dashboard] ❌ Client-side auth validation failed');
          setIsClientAuthValid(false);
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('[Dashboard] ❌ Client-side auth validation error:', error);
        setIsClientAuthValid(false);
        window.location.href = '/login';
      }
    };
    
    validateAuth();
  }, [initialUser]);
  
  // Use clientUser if server-side user is not available (cookies blocked)
  const user = initialUser && initialUser.id ? initialUser : clientUser;
  
  // Don't render until we know auth status
  if (isClientAuthValid === false || !user) {
    return null; // Will redirect
  }
  
  const { data: wallet, isLoading: walletLoading } = useWallet(user.id);
  const createWalletMutation = useCreateWallet(user.id);
  const refreshWallet = useRefreshWallet(user.id);
  const syncTransactions = useSyncTransactions();
  const hasSyncedOnLogin = useRef(false);

  // Handler to open send dialog with pre-filled recipient
  const handleOpenSendTo = (address: string, name: string) => {
    setSendRecipient({ address, name });
    setSendOpen(true);
    // Keep contacts panel open - only the contact detail dialog closes
  };

  // Pre-populate auth cache
  useEffect(() => {
    if (user) {
      queryClient.setQueryData(['auth', 'session'], user);
    }
  }, [user]);

  // Auto-sync transactions on login (only once)
  useEffect(() => {
    if (wallet && !hasSyncedOnLogin.current && !walletLoading) {
      hasSyncedOnLogin.current = true;
      console.log('[Dashboard] Auto-syncing transactions on login...');
      syncTransactions.mutate();
    }
  }, [wallet, walletLoading, syncTransactions]);

  const walletAddress = wallet?.address || "";
  const balance = wallet?.balance || "0";
  const balanceUSD = wallet?.balanceUSD || "0";

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
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            {/* Title & Email */}
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">PayPay</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate max-w-[250px]">
                  {user?.email || ''}
                </span>
                <LogoutButton 
                  className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  exit
                </LogoutButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Menu Buttons - Always on top, within container */}
      <div className="fixed top-4 left-0 right-0 z-[100] pointer-events-none">
        <div className="max-w-[1200px] mx-auto px-6 flex justify-end gap-3 pointer-events-auto">
          {/* Contacts */}
          <Sheet open={contactsOpen} onOpenChange={setContactsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-3 rounded-full border gap-2 transition-all ${
                  contactsOpen 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Contacts</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-1/2">
              <ContactsPanel onSendTo={handleOpenSendTo} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

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
          <div className="wallet-box">
            {/* Left Part */}
            <div className="wallet-box-left">
              {/* Wallet Address */}
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

              {/* Balance */}
              <div>
                <div className="flex items-center gap-2 mb-2">
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

            {/* Right Part - Network Only */}
            <div className="wallet-box-right">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-xs font-medium text-white">{wallet?.network || 'Sepolia'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled and To Sign - Two columns */}
        {wallet && (
          <div className="mt-8 space-y-6">
            {/* Top Row: Scheduled and To Sign side by side */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Scheduled */}
              <div>
                <ScheduledPaymentsPanel />
              </div>

              {/* Right Column - To Sign */}
              <div>
                <CompletedPayrollsPanel />
              </div>
            </div>

            {/* Bottom Row: Transactions full width */}
            <div>
              <TransactionsPanel />
            </div>
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
  const result = await requireAuth(context);
  
  // Pass user as initialUser for Suspense (if available)
  // If cookies are blocked, result will have redirect, but we'll handle it client-side
  if ('props' in result && result.props) {
    return {
      props: {
        initialUser: result.props.user,
      },
    };
  }
  
  // If server-side auth failed (cookies blocked), return empty props
  // Client-side will check localStorage and validate
  return {
    props: {
      initialUser: null as any, // Will be handled client-side
    },
  };
};

export default Dashboard;
