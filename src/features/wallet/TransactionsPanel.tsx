import { ArrowDownLeft, ArrowUpRight, Tag, ExternalLink, FileText, Loader2, Clock, Calendar } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { useTransactions } from "./useWallet";
import type { Transaction } from "./wallet.types";

export function TransactionsPanel() {
  const { data: transactions, isLoading, error } = useTransactions();

  console.log('[TransactionsPanel] Rendering:', {
    isLoading,
    hasError: !!error,
    transactionsCount: transactions?.length || 0,
    transactions: transactions?.slice(0, 2) // Log first 2 for debugging
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-white" />
        <h2 className="text-white text-xl font-semibold">
          Transactions {!isLoading && transactions && `(${transactions.length})`}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading transactions...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load transactions</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!transactions || transactions.length === 0) && (
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Your transaction history will appear here</p>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && !error && transactions && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => (
          <Dialog key={tx.id}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors text-left cursor-pointer">
                {/* Icon */}
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                    tx.isScheduled
                      ? "bg-purple-500/20"
                      : tx.type === "receive"
                      ? "bg-green-500/20"
                      : "bg-blue-500/20"
                  }`}
                >
                  {tx.isScheduled ? (
                    <Clock className="h-5 w-5 text-purple-400" />
                  ) : tx.type === "receive" ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-blue-400" />
                  )}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="capitalize font-medium text-white text-sm">
                      {tx.isScheduled ? "Scheduled Payment" : (tx.type === "send" ? "Sent" : "Received")}
                    </p>
                    {tx.isScheduled && (
                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400 bg-purple-500/10">
                        Scheduled
                      </Badge>
                    )}
                    {tx.status === "pending" && !tx.isScheduled && (
                      <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
                        Pending
                      </Badge>
                    )}
                    {tx.status === "processing" && tx.isScheduled && (
                      <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400 bg-orange-500/10">
                        Processing
                      </Badge>
                    )}
                    {tx.labels && tx.labels.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {tx.labels.length}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <code className="text-gray-500">
                      {tx.recipientName || `${tx.address.slice(0, 6)}...${tx.address.slice(-4)}`}
                    </code>
                    <span>•</span>
                    {tx.isScheduled && tx.scheduledFor ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tx.scheduledFor).toLocaleString()}
                      </span>
                    ) : (
                      <span>{new Date(tx.timestamp).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}</span>
                    )}
                  </div>
                  {tx.isScheduled && tx.note && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {tx.note}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p
                    className={`font-semibold text-sm ${
                      tx.type === "receive" ? "text-green-400" : "text-white"
                    }`}
                  >
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount} {tx.currency}
                  </p>
                  <p className="text-xs text-gray-400">
                    ${tx.usdValue}
                  </p>
                </div>

                <ExternalLink className="h-4 w-4 text-gray-500 shrink-0" />
              </button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <TransactionDetailsDialog transaction={tx} />
            </DialogContent>
          </Dialog>
        ))}
        </div>
      )}
    </div>
  );
}

