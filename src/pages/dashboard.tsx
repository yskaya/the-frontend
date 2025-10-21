import { useEffect, useState } from 'react';
import { requireAuth, type User } from '@/features/auth';
import { GetServerSideProps } from 'next';
import { queryClient } from '@/lib';
import { useWallet, useCreateWallet } from '@/features/wallet';
import { Wallet, Users, Send, Share2, Eye, EyeOff, LogOut, Plus, Copy } from 'lucide-react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/ui/sheet';
import { Dialog, DialogContent } from '@/ui/dialog';
import { LogoutButton } from '@/components/LogoutButton';
import { ContactsPanel } from '@/features/contacts';
import { TransactionsPanel, SendCryptoDialog, ReceiveCryptoDialog } from '@/features/wallet';
import { toast } from 'sonner';


interface DashboardProps {
  initialUser: User;
}

/**
 * Dashboard page - matches FigmaFiles/App.tsx styling with dark theme
 */
const Dashboard = ({ initialUser }: DashboardProps) => {
  const [showBalance, setShowBalance] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendRecipient, setSendRecipient] = useState<{ address: string; name: string } | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);
  
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const createWalletMutation = useCreateWallet();

  // Handler to open send dialog with pre-filled recipient
  const handleOpenSendTo = (address: string, name: string) => {
    setSendRecipient({ address, name });
    setSendOpen(true);
    // Keep contacts panel open - only the contact detail dialog closes
  };

  // Pre-populate auth cache
  useEffect(() => {
    queryClient.setQueryData(['auth', 'session'], initialUser);
  }, [initialUser]);

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
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            {/* Title & Email */}
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-white">PayPay</h1>
              <span className="text-xs text-gray-400 truncate max-w-[250px]">
                {initialUser.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Menu Button - Always on top, within container */}
      <div className="fixed top-4 left-0 right-0 z-[100] pointer-events-none">
        <div className="max-w-4xl mx-auto px-6 flex justify-end pointer-events-auto">
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Big Balance Widget or Create Wallet */}
        {walletLoading ? (
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-white/20 p-8 backdrop-blur-xl">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Loading wallet...</p>
            </div>
          </div>
        ) : !wallet ? (
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-white/20 p-8 backdrop-blur-xl text-center">
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
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-white/20 p-8 backdrop-blur-xl">
            {/* Network & Wallet Address - Top Row */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              {/* Network indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Network</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs font-medium text-white">{wallet?.network || 'Sepolia'}</p>
                </div>
              </div>
              
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
            </div>

            {/* Balance */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Balance</p>
                {showBalance ? (
                  <>
                    <p className="text-5xl font-bold text-white mb-2">
                      {balance}{" "}
                      <span className="text-3xl text-gray-400">ETH</span>
                    </p>
                    <p className="text-xl text-gray-400">${balanceUSD} USD</p>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold text-white mb-2">••••••••</p>
                    <p className="text-xl text-gray-400">$••••••••</p>
                  </>
                )}
              </div>
              
              {/* Eye Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {showBalance ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        )}

        {/* Transaction History - Only show if wallet exists */}
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Links */}
            <div className="flex items-center gap-6">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms
              </button>
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </button>
            </div>
            
            {/* Exit Button */}
            <LogoutButton 
              className="h-9 px-4 gap-2 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all flex items-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Exit</span>
            </LogoutButton>
          </div>
        </div>
      </footer>
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
