import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, CheckCircle2, Clock, Blocks } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import { toast } from "sonner";
import { formatRelativeDate } from "@/lib/utils";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { useAuthContext } from "@/features/auth";
import { useWallet } from "@/features/wallet";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: string;
  currency: string;
  address: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  usdValue: string;
  hash: string;
  fee: string;
  gasPrice: string;
  blockNumber: string;
  confirmations: number;
  fullDate: string;
  nonce: string;
  labels?: string[];
}

interface TransactionDetailsDialogProps {
  transaction: Transaction;
}

// Format date as "Nov 5, 2025 • 3:53pm"
function formatDateWithTime(date: string | Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
  return `${dateStr} • ${timeStr}`;
}

export function TransactionDetailsDialog({ transaction }: TransactionDetailsDialogProps) {
  const { user } = useAuthContext();
  const { data: wallet } = useWallet(user?.id);
  const walletAddress = wallet?.address || "";
  const handleCopyHash = () => {
    navigator.clipboard.writeText(transaction.hash);
    toast.success("Transaction hash copied");
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(transaction.address);
    toast.success("Address copied");
  };

  const handleViewOnExplorer = () => {
    // Open Sepolia Etherscan
    window.open(`https://sepolia.etherscan.io/tx/${transaction.hash}`, '_blank');
    toast.success("Opening Sepolia Explorer...");
  };

  // Get dark background color based on transaction status/type
  const getBackgroundColor = () => {
    if (transaction.status === "pending") {
      return "rgba(80, 50, 5, 1)"; // Darker brown/orange
    } else if (transaction.status === "failed") {
      return "rgba(48, 16, 16, 1)"; // Darker red
    } else if (transaction.type === "receive") {
      return "rgba(20, 35, 55, 1)"; // Darker blue
    } else {
      return "rgba(10, 25, 15, 1)"; // Darker green for sent
    }
  };

  const statusBgColor = getBackgroundColor();

  return (
    <div 
      className="rounded-lg h-full flex flex-col"
      style={{ backgroundColor: statusBgColor }}
    >
      {/* Fixed Header */}
      <div className="p-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14">
            <TransactionStatusIcon
              status={
                transaction.status === "pending"
                  ? "pending"
                  : transaction.type === "receive"
                  ? "received"
                  : "sent"
              }
            />
          </div>
          <div className="flex-1">
            <h3 className="capitalize mb-1 text-white text-xl font-semibold">
              {transaction.type === "send" ? "Sent" : "Received"}
            </h3>
            <div className="text-sm text-gray-400">
              {formatRelativeDate(transaction.timestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Amount */}
              <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
                <p className="text-sm text-gray-400 mb-2">Amount</p>
                <p className="text-4xl mb-2 font-bold text-white">
                  {transaction.type === "receive" ? "+" : "-"}
                  ${transaction.usdValue !== '0' ? transaction.usdValue : '0.00'} USD
                </p>
                <p className="text-xl text-gray-400">
                  {transaction.type === "receive" ? "+" : "-"}
                  {transaction.amount} {transaction.currency}
                </p>
              </div>

        <Separator className="bg-white/10" />

        {/* Transaction Details */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">Transaction Details</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-400">Date</p>
              <p className="text-white">{formatDateWithTime(transaction.timestamp)}</p>
            </div>

            <div className="flex justify-between items-start gap-4">
              <p className="text-gray-400">{transaction.type === "send" ? "To" : "From"}</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-white font-mono">{transaction.address}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Block Number</p>
              <div className="flex items-center gap-1">
                <Blocks className="h-3 w-3 text-gray-400" />
                <p className="text-white">{transaction.blockNumber}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Nonce</p>
              <p className="text-white">{transaction.nonce}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Gas & Fees */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">Gas & Fees</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-400">Gas Used</p>
              {/* Gas used is in gas units (e.g., 21000) */}
              <p className="text-white font-medium">{transaction.fee} gas</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Gas Price</p>
              {/* TODO: Convert wei to gwei properly. Currently showing raw wei value */}
              <p className="text-white font-medium">{(parseInt(transaction.gasPrice) / 1e9).toFixed(4)} gwei</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Network Fee</p>
              {/* TODO: Calculate actual fee: gasUsed * gasPrice in ETH */}
              <p className="text-white font-medium">
                {((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18).toFixed(6)} ETH
              </p>
            </div>

            {transaction.type === 'send' && (
              <div className="flex justify-between">
                <p className="text-gray-400">Total Cost</p>
                <p className="text-white font-semibold">
                  {(parseFloat(transaction.amount) + ((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18)).toFixed(6)} ETH
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Transaction Hash */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Transaction Hash</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white font-mono flex-1">
              {transaction.hash.length > 42 
                ? `${transaction.hash.slice(0, 42)}...` 
                : transaction.hash}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-2 inline-flex items-center justify-center hover:bg-white/10 text-white"
                onClick={handleCopyHash}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-white/20 text-white bg-transparent hover:bg-white/20 hover:border-white/40 transition-colors"
            onClick={handleViewOnExplorer}
          >
            <ExternalLink className="h-4 w-4" />
            View on Sepolia Explorer
          </Button>
        </div>
      </div>
    </div>
  );
}

