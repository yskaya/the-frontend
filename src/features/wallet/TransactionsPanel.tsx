import { ArrowDownLeft, ArrowUpRight, Tag, ExternalLink, FileText, Loader2, Clock, Calendar, RefreshCw, RotateCcw } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { useTransactions, useRefreshTransactions, useSyncTransactions } from "./useWallet";
import type { Transaction } from "./wallet.types";
import { formatRelativeDate } from "@/lib/utils";
import "../../components.css";

// Format date as "May 26, 2025"
function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format time as "01:00pm"
function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
}

export function TransactionsPanel() {
  const { data: transactions, isLoading, error } = useTransactions();
  const refreshTransactions = useRefreshTransactions();
  const syncTransactions = useSyncTransactions();
  
  // Reset button: refresh + sync
  const handleReset = async () => {
    refreshTransactions();
    syncTransactions.mutate();
  };

  console.log('[TransactionsPanel] Rendering:', {
    isLoading,
    hasError: !!error,
    transactionsCount: transactions?.length || 0,
    transactions: transactions?.slice(0, 2) // Log first 2 for debugging
  });

  return (
    <div className="transactions-panel-wrapper">
      <div className="transactions-panel-container">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="transactions-history-heading">
            Transactions history
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={syncTransactions.isPending}
            className="text-white hover:text-white hover:bg-white/10"
            title="Reset and sync transactions"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
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
        <div className="placeholder">
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Your transaction history will appear here</p>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && !error && transactions && transactions.length > 0 && (
        <div className="flex-1 overflow-y-auto transaction-list-container">
          {transactions.map((tx) => (
            <Dialog key={tx.id}>
              <DialogTrigger asChild>
                <button className="transaction-item-button">
                  {/* Icon */}
                  <div
                    className={`transaction-icon-container ${
                      tx.status === "pending"
                        ? "transaction-icon-pending"
                        : tx.type === "receive"
                        ? "transaction-icon-received"
                        : "transaction-icon-sent"
                    }`}
                  >
                    {tx.status === "pending" ? (
                      <RefreshCw className="h-5 w-5 text-white" />
                    ) : tx.type === "receive" ? (
                      <ArrowDownLeft className="h-5 w-5 text-white" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>

                  {/* Transaction Info */}
                  <div className="transaction-info-container">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="transaction-item-text">
                        {tx.status === "pending" ? "Pending" : (tx.type === "send" ? "Sent" : "Received")}
                      </span>
                      <span className="dot-separator">•</span>
                      <span className="transaction-date-time">
                        {formatDate(tx.timestamp)}
                      </span>
                      <span className="dot-separator">•</span>
                      <span className="transaction-date-time">
                        {formatTime(tx.timestamp)}
                      </span>
                    </div>
                    <div className="transaction-hash">
                      {tx.hash}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="transaction-amount-container">
                    <p className="transaction-usd-amount">
                      ${parseFloat(tx.usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="transaction-amount">
                      {parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                    </p>
                  </div>
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
    </div>
  );
}

