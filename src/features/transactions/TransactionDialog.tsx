'use client';

import { ArrowDownLeft, ArrowUpRight, Copy, ExternalLink, Blocks } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { toast } from "sonner";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { useAuthContext } from "@/features/auth";
import { useWallet } from "@/features/wallet";
import type { ReactNode } from "react";
import type { Transaction } from "@/features/wallet";
import { formatDateTime } from "@/lib/dateFormat";

interface TransactionDialogProps {
  transaction: Transaction;
}

export function TransactionDialog({ transaction }: TransactionDialogProps) {
  const { user } = useAuthContext();
  const { data: wallet } = useWallet(user?.id);
  const walletAddress = wallet?.address || "";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transaction.hash);
    toast.success("Transaction hash copied");
  };

  const handleViewOnExplorer = () => {
    window.open(`https://sepolia.etherscan.io/tx/${transaction.hash}`, '_blank');
    toast.success("Opening Sepolia Explorer...");
  };

  const getBackgroundColor = () => {
    if (transaction.status === "pending") {
      return "rgba(80, 50, 5, 1)";
    } else if (transaction.status === "failed") {
      return "rgba(48, 16, 16, 1)";
    } else if (transaction.type === "receive") {
      return "rgba(20, 35, 55, 1)";
    } else {
      return "rgba(10, 25, 15, 1)";
    }
  };

  const statusBgColor = getBackgroundColor();

  const statusMeta: Record<"success" | "processing" | "failed", { label: string }> = {
    success: {
      label: 'Success'
    },
    processing: {
      label: 'Processing'
    },
    failed: {
      label: 'Failed'
    }
  };

  const blockchainStatus: "success" | "processing" | "failed" =
    transaction.status === 'pending'
      ? 'processing'
      : transaction.status === 'failed'
        ? 'failed'
        : 'success';

  const statusBadge = statusMeta[blockchainStatus];
  const displayLabel =
    transaction.status === 'pending'
      ? 'Processing'
      : transaction.status === 'failed' && transaction.labels?.includes('cancelled')
        ? 'Cancelled'
        : transaction.status === 'failed'
          ? 'Failed'
          : transaction.type === 'send'
            ? 'Sent'
            : 'Received';
  

  const amountColor = (() => {
    if (transaction.status === "pending") {
      return "#fb923c";
    }
    if (transaction.status === "failed") {
      return "rgb(248 113 113 / var(--tw-text-opacity, 1))";
    }
    if (transaction.type === "send") {
      return "#00e476";
    }
    return "#439eef";
  })();

  return (
    <div
      className="rounded-lg h-full flex flex-col"
      style={{ backgroundColor: statusBgColor }}
    >
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
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-white text-xl font-semibold">
                {displayLabel}
              </h3>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  color:
                    blockchainStatus === 'processing'
                      ? '#fb923c'
                      : blockchainStatus === 'failed'
                        ? 'rgb(248 113 113)'
                        : transaction.type === 'receive'
                          ? '#439eef'
                          : '#00e476',
                  borderColor:
                    blockchainStatus === 'processing'
                      ? '#fb923c'
                      : blockchainStatus === 'failed'
                        ? 'rgb(248 113 113)'
                        : transaction.type === 'receive'
                          ? '#439eef'
                          : '#00e476',
                  backgroundColor:
                    blockchainStatus === 'processing'
                      ? 'rgba(251, 146, 60, 0.12)'
                      : blockchainStatus === 'failed'
                        ? 'rgba(248, 113, 113, 0.12)'
                        : transaction.type === 'receive'
                          ? 'rgba(67, 158, 239, 0.12)'
                          : 'rgba(0, 228, 118, 0.12)'
                }}
              >
                {statusBadge.label}
              </Badge>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span>{formatDateTime(transaction.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      {transaction.status === 'failed' && transaction.errorMessage && (
        <div className="px-8 pt-4">
          <details className="rounded-lg border border-red-500/40 bg-red-500/15 text-red-100 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">
              View error details
            </summary>
            <p className="mt-2 text-sm leading-5">{transaction.errorMessage}</p>
          </details>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-8 space-y-6">
        <div className="bg-white/5 rounded-lg mx-6 p-6 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-4xl font-bold" style={{ color: amountColor }}>
              {transaction.type === "receive" ? "+" : "-"}
              ${transaction.usdValue !== '0' ? parseFloat(transaction.usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
            <p className="text-xl text-gray-400">
              {transaction.type === "receive" ? "+" : "-"}
              {transaction.amount} {transaction.currency}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-300" />
          </div>

          <div className="grid gap-3 text-sm border-t border-white/10 pt-4 text-gray-300">
            <div className="flex justify-between">
              <span>Gas Used</span>
              <span className="text-white font-medium">{transaction.fee} gas</span>
            </div>
            <div className="flex justify-between">
              <span>Gas Price</span>
              <span className="text-white font-medium">{(parseInt(transaction.gasPrice) / 1e9).toFixed(4)} gwei</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span className="text-white font-medium">
                {((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18).toFixed(6)} ETH
              </span>
            </div>
            {transaction.type === 'send' && (
              <div className="flex justify-between">
                <span>Total Cost</span>
                <span className="text-white font-semibold">
                  {(parseFloat(transaction.amount) + ((parseInt(transaction.fee) * parseInt(transaction.gasPrice)) / 1e18)).toFixed(6)} ETH
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mx-6 w-[calc(100%-3rem)] gap-2 border-white/20 text-white bg-transparent hover:bg-white/20"
          onClick={handleViewOnExplorer}
        >
          <ExternalLink className="h-4 w-4" />
          View on Sepolia Explorer
        </Button>

        <div className="space-y-4 px-6">
          <div className="space-y-4">
            <DetailRow label="Tx Hash">
              <div className="flex items-center gap-2">
                <code className="text-sm text-white font-mono break-all flex-1">
                  {transaction.hash.length > 18
                    ? `${transaction.hash.slice(0, 10)}…${transaction.hash.slice(-6)}`
                    : transaction.hash}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                  onClick={handleCopyHash}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </DetailRow>
            <DetailRow label="From">
              <div className="flex items-center gap-2">
                <code className="text-sm text-white font-mono break-all flex-1">
                  {(() => {
                    const value = transaction.type === 'receive'
                      ? transaction.from || transaction.address
                      : transaction.from || walletAddress;
                    return value.length > 32 ? `${value.slice(0, 18)}…${value.slice(-10)}` : value;
                  })()}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                  onClick={() => {
                    const value = transaction.type === 'receive'
                      ? transaction.from || transaction.address
                      : transaction.from || walletAddress;
                    navigator.clipboard.writeText(value);
                    toast.success('Address copied');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </DetailRow>
            <DetailRow label="To">
              <div className="flex items-center gap-2">
                <code className="text-sm text-white font-mono break-all flex-1">
                  {(() => {
                    const value = transaction.type === 'send'
                      ? transaction.address
                      : walletAddress;
                    return value.length > 32 ? `${value.slice(0, 18)}…${value.slice(-10)}` : value;
                  })()}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-white/10 text-white"
                  onClick={() => {
                    const value = transaction.type === 'send'
                      ? transaction.address
                      : walletAddress;
                    navigator.clipboard.writeText(value);
                    toast.success('Address copied');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </DetailRow>
            {transaction.recipientName && (
              <DetailRow label="Recipient">
                <span className="text-sm text-gray-300">{transaction.recipientName}</span>
              </DetailRow>
            )}
            <DetailRow label="Date">
              <span className="text-sm text-white">{formatDateTime(transaction.timestamp)}</span>
            </DetailRow>
            <DetailRow label="Block">
              <div className="flex items-center gap-1 text-white">
                <Blocks className="h-3 w-3 text-gray-400" />
                <span>{transaction.blockNumber}</span>
              </div>
            </DetailRow>
            <DetailRow label="Nonce">
              <span className="text-sm text-white">{transaction.nonce}</span>
            </DetailRow>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-4 text-left">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0 w-24 sm:w-32">{label}</span>
      <div className="text-sm text-white flex-1 text-left flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}



