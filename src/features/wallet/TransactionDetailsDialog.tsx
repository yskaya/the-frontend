import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, CheckCircle2, Clock, Blocks } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import { toast } from "sonner";

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

export function TransactionDetailsDialog({ transaction }: TransactionDetailsDialogProps) {
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

  return (
    <div className="bg-white text-black rounded-lg -m-6 max-h-[85vh] min-h-[400px] flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center h-14 w-14 rounded-full ${
              transaction.type === "receive"
                ? "bg-green-500/10"
                : "bg-blue-500/10"
            }`}
          >
            {transaction.type === "receive" ? (
              <ArrowDownLeft className="h-7 w-7 text-green-500" />
            ) : (
              <ArrowUpRight className="h-7 w-7 text-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="capitalize mb-1 text-black text-xl font-semibold">{transaction.type}</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={transaction.status === "completed" ? "default" : "outline"}
                className={
                  transaction.status === "pending"
                    ? "border-yellow-500/50 text-yellow-600 bg-yellow-50"
                    : transaction.status === "completed"
                    ? "bg-green-50 text-green-600 border-green-500/50"
                    : ""
                }
              >
                {transaction.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {transaction.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                {transaction.status}
              </Badge>
              {/* TODO: Calculate real confirmations from current block number - block number of transaction */}
              <span className="text-xs text-gray-500">
                {transaction.confirmations > 0 ? `${transaction.confirmations}+ confirmations` : 'Pending confirmation'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Amount */}
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Amount</p>
          <p className={`text-4xl mb-2 font-bold ${transaction.type === "receive" ? "text-green-600" : "text-black"}`}>
            {transaction.type === "receive" ? "+" : "-"}
            {transaction.amount} {transaction.currency}
          </p>
          {/* TODO: Implement real-time ETH to USD conversion using CoinGecko or similar API */}
          <p className="text-xl text-gray-500">
            {transaction.usdValue !== '0' ? `$${transaction.usdValue} USD` : 'USD conversion pending...'}
          </p>
        </div>

        <Separator className="bg-gray-200" />

        {/* Transaction Details */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-black">Transaction Details</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start gap-4">
              <p className="text-gray-600">{transaction.type === "send" ? "To" : "From"}</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-black font-mono">{transaction.address}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-gray-100"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Status</p>
              <p className="capitalize text-black font-medium">{transaction.status}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Date & Time</p>
              <p className="text-black">{transaction.fullDate}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Block Number</p>
              <div className="flex items-center gap-1">
                <Blocks className="h-3 w-3 text-gray-600" />
                <p className="text-black">{transaction.blockNumber}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Nonce</p>
              <p className="text-black">{transaction.nonce}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* Gas & Fees */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-black">Gas & Fees</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-600">Gas Used</p>
              {/* Gas used is in gas units (e.g., 21000) */}
              <p className="text-black font-medium">{transaction.fee} gas</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Gas Price</p>
              {/* TODO: Convert wei to gwei properly. Currently showing raw wei value */}
              <p className="text-black font-medium">{(parseInt(transaction.gasPrice) / 1e9).toFixed(4)} gwei</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Network Fee</p>
              {/* TODO: Calculate actual fee: gasUsed * gasPrice in ETH */}
              <p className="text-black font-medium">
                {((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18).toFixed(6)} ETH
              </p>
            </div>

            {transaction.type === 'send' && (
              <div className="flex justify-between">
                <p className="text-gray-600">Total Cost</p>
                <p className="text-black font-semibold">
                  {(parseFloat(transaction.amount) + ((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18)).toFixed(6)} ETH
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* Transaction Hash */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-black">Transaction Hash</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-black font-mono bg-gray-50 px-3 py-2 rounded-lg flex-1 border border-gray-200 break-all">
              {transaction.hash}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyHash}
              className="h-9 w-9 shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-gray-300 text-black hover:bg-gray-100"
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

