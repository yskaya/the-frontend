import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Wallet as WalletIcon, Send, Share2, Plus, Copy } from "lucide-react";
import type { Wallet } from "./types";
import { Button } from "@/ui/button";
import { CreatePayrollDialog } from "@/features/payrolls";
import { SendCryptoDialog } from "./SendCryptoDialog";
import { ReceiveCryptoDialog } from "./ReceiveCryptoDialog";
import { toast } from "sonner";

const ETH_PRICE = 3243.0;

export interface WalletSectionHandle {
  openSendTo: (address: string, name: string) => void;
  openReceive: () => void;
}

interface WalletSectionProps {
  wallet: Wallet;
}

interface WalletNotFoundProps {
  onCreateWallet: () => void;
  isCreatingWallet: boolean;
}

export const WalletLoading = () => (
  <div className="flex w-full min-h-[300px] flex-col gap-[42px] rounded-[48px] bg-[rgba(31,0,55,0.7)] px-20 py-[60px]">
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Loading wallet...</p>
    </div>
  </div>
);

export const WalletNotFound = ({ onCreateWallet, isCreatingWallet }: WalletNotFoundProps) => (
  <div className="flex w-full min-h-[300px] flex-col gap-[42px] rounded-[48px] bg-[rgba(31,0,55,0.7)] px-20 py-[60px] text-center">
    <div className="max-w-md mx-auto">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
        <WalletIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">No Wallet Found</h2>
      <p className="text-gray-400 mb-6">
        Create a new Ethereum wallet to start sending and receiving crypto
      </p>
      <Button
        onClick={onCreateWallet}
        disabled={isCreatingWallet}
        className="h-12 gap-2 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold"
      >
        <Plus className="h-5 w-5" />
        {isCreatingWallet ? "Creating Wallet..." : "Create Wallet"}
      </Button>
    </div>
  </div>
);

export const WalletSection = forwardRef<WalletSectionHandle, WalletSectionProps>(
  ({ wallet }, ref) => {
    const [sendOpen, setSendOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [sendRecipient, setSendRecipient] = useState<{ address: string; name: string } | null>(null);

    const walletAddress = wallet.address;
    const balance = wallet.balance ?? "0";

    const balanceUSD = useMemo(() => {
      const amount = parseFloat(balance || "0");
      if (Number.isNaN(amount)) {
        return "0.00";
      }
      return (amount * ETH_PRICE).toFixed(2);
    }, [balance]);

    const copyAddress = () => {
      if (!walletAddress || typeof navigator === "undefined") {
        return;
      }

      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied to clipboard!");
    };

    const openSendDialog = (recipient?: { address: string; name: string }) => {
      setSendRecipient(recipient ?? null);
      setSendOpen(true);
    };

    const openReceiveDialog = () => {
      setReceiveOpen(true);
    };

    useImperativeHandle(
      ref,
      () => ({
        openSendTo: (address: string, name: string) => {
          openSendDialog({ address, name });
        },
        openReceive: openReceiveDialog,
      }),
      []
    );

    return (
      <>
        <div className="flex w-full min-h-[300px] flex-col gap-[42px] rounded-[48px] bg-[rgba(31,0,55,0.7)] px-20 py-[60px]">
          <div className="flex flex-col gap-6">
            {/* Wallet Address with Network */}
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-400 font-mono">
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                className="h-6 w-6 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                aria-label="Copy wallet address"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Balance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-5xl font-bold text-white">
                  ${balanceUSD}
                </p>
              </div>
              <p className="text-xl text-gray-400">
                {balance}{" "}
                <span className="text-lg text-gray-500">ETH</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openSendDialog()}
                className="h-12 gap-2 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold"
              >
                <Send className="h-5 w-5" />
                Send
              </Button>
              <Button
                onClick={openReceiveDialog}
                className="h-12 gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/30 rounded-xl font-semibold"
              >
                <Share2 className="h-5 w-5" />
                Receive
              </Button>
              <CreatePayrollDialog
                buttonClassName="h-12 gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/50 rounded-xl font-semibold"
                buttonText="Schedule"
              />
            </div>
          </div>
        </div>

        <SendCryptoDialog
          recipientAddress={sendRecipient?.address}
          recipientName={sendRecipient?.name}
          isOpen={sendOpen}
          onOpenChange={(open) => {
            setSendOpen(open);
            if (!open) {
              setSendRecipient(null);
            }
          }}
          onSuccess={() => {
            setSendOpen(false);
            setSendRecipient(null);
          }}
        />

        <ReceiveCryptoDialog
          walletAddress={walletAddress}
          isOpen={receiveOpen}
          onOpenChange={setReceiveOpen}
        />
      </>
    );
  }
);

WalletSection.displayName = "WalletSection";

