'use client';

import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { TransactionDialog } from "./TransactionDialog";
import { useTransactions } from "./BlockchainProvider";
import type { Transaction } from "@/features/blockchain/types";
import { cn } from "@/lib/utils";
import { TransactionItem } from "./TransactionItem";
import { useState } from "react";
import { useDashboardContext } from "@/features/dashboard/DashboardProvider";

interface TransactionsActivityProps {
  embedded?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function TransactionsActivity({
  className,
}: TransactionsActivityProps) {
  const { data: transactions, isLoading, error } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { activeTab } = useDashboardContext();

  const renderTransactionsColumn = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading transactions...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load transactions</p>
        </div>
      );
    }

    if (!transactions || transactions.length === 0) {
      return (
        <div className="rounded-[12px] p-8 text-center">
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Your transaction history will appear here</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto space-y-8">
        {transactions.map((tx) => (
          <Sheet
            key={tx.id}
            open={selectedTransaction?.id === tx.id}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedTransaction(null);
              } else if (selectedTransaction?.id !== tx.id) {
                setSelectedTransaction(tx);
              }
            }}
          >
            <SheetTrigger asChild>
              <button
                className="flex w-full items-center gap-[10px] text-left transition-opacity hover:opacity-80"
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedTransaction(tx);
                }}
              >
                <TransactionItem
                  status={tx.status}
                  type={tx.type}
                  labels={tx.labels}
                  timestamp={tx.timestamp}
                  walletId={tx.hash}
                  amount={tx.amount}
                  usdValue={tx.usdValue}
                  currency={tx.currency}
                />
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
            >
              {selectedTransaction && (
                <TransactionDialog transaction={selectedTransaction} />
              )}
            </SheetContent>
          </Sheet>
        ))}
      </div>
    );
  };

  const content = renderTransactionsColumn();
  

  return (
    <div className={cn("w-full mx-auto flex flex-col", activeTab === 'txs' ? "gap-8" : "gap-4", className)}>
      <div className="font-[var(--font-nunito-sans)] text-[12px] font-semibold uppercase tracking-[0.4em] text-white/60">
        Transaction history
      </div>
      {content}
    </div>
  );
}


