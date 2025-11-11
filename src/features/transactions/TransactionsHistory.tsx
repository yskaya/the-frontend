'use client';

import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { TransactionDialog } from "./TransactionDialog";
import { useTransactions } from "./hooks";
import type { Transaction } from "@/features/wallet";
import { cn } from "@/lib/utils";
import { TransactionItem } from "./TransactionItem";
import { useState } from "react";

interface TransactionsHistoryProps {
  embedded?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function TransactionsHistory({
  className,
}: TransactionsHistoryProps) {
  const { data: transactions, isLoading, error } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
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
        <div className="placeholder">
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Your transaction history will appear here</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto transaction-list-container">
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
                className="transaction-item-button"
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
  const gapClass = selectedTransaction ? "gap-8" : "gap-4";

  return (
    <div className={cn("max-w-[700px] w-full mx-auto flex flex-col", gapClass, className)}>
      <div className="payrolls-to-sign-heading">Transaction history</div>
      {content}
    </div>
  );
}


