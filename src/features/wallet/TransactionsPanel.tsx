import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { useTransactions } from "./useWallet";
import type { Transaction } from "./wallet.types";
import { PayrollsPanel } from "@/features/scheduled-payments";
import { usePayrolls } from "@/features/scheduled-payments/hooks";

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
  const { data: payrolls } = usePayrolls();

  const payrollHistoryCount = useMemo(() => {
    if (!payrolls) return 0;
    return payrolls.filter((p) =>
      p.status === "processing" ||
      p.status === "completed" ||
      p.status === "cancelled" ||
      p.status === "failed"
    ).length;
  }, [payrolls]);
  
  const getTransactionLabel = (tx: Transaction) => {
    if (tx.status === "pending") {
      return "Processing";
    }
    if (tx.status === "failed" && tx.labels?.includes("cancelled")) {
      return "Cancelled";
    }
    return tx.type === "send" ? "Sent" : "Received";
  };

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
          <Sheet key={tx.id}>
            <SheetTrigger asChild>
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
                      {getTransactionLabel(tx)}
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
            </SheetTrigger>
            <SheetContent 
              side="bottom"
              className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
            >
              <TransactionDetailsDialog transaction={tx} />
            </SheetContent>
          </Sheet>
        ))}
      </div>
    );
  };

  return (
     <div className="transactions-panel-wrapper">
       <div className="transactions-panel-container">
        <div className="grid gap-44 lg:grid-cols-2">
          <section className="space-y-4">
            <div className="payrolls-to-sign-heading text-white ml-2">
              Transactions ({transactions?.length ?? 0})
            </div>
            <div>{renderTransactionsColumn()}</div>
          </section>

          <section className="space-y-4">
            <div className="payrolls-to-sign-heading text-white ml-2">
              Payroll History ({payrollHistoryCount})
            </div>
            <div className="ml-2">
              <PayrollsPanel embedded />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

