'use client';

import { RefreshCw, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";

interface TransactionItemProps {
  status: string;
  type: 'send' | 'receive';
  labels?: string[];
  timestamp: string | number | Date;
  walletId: string;
  amount: string;
  usdValue?: string;
  currency?: string;
}

function resolveStatus(status: string, labels?: string[]) {
  if (status === 'failed' && labels?.includes('cancelled')) return 'cancelled';
  if (['pending', 'failed', 'completed', 'processing', 'scheduled', 'cancelled'].includes(status)) {
    return status as 'pending' | 'failed' | 'completed' | 'processing' | 'scheduled' | 'cancelled';
  }
  return 'completed';
}

function getIcon(status: ReturnType<typeof resolveStatus>, type: TransactionItemProps['type']) {
  if (status === 'pending' || status === 'processing') {
    return <RefreshCw className="h-5 w-5 text-white" />;
  }

  if (type === 'receive') {
    return <ArrowDownLeft className="h-5 w-5 text-white" />;
  }

  return <ArrowUpRight className="h-5 w-5" />;
}

function getStatusClass(status: ReturnType<typeof resolveStatus>, type: TransactionItemProps['type']) {
  if (status === 'pending' || status === 'processing') return 'transaction-icon-pending';
  if (status === 'failed' || status === 'cancelled') return 'transaction-icon-failed';
  if (type === 'receive') return 'transaction-icon-received';
  return 'transaction-icon-sent';
}

function getLabel(status: ReturnType<typeof resolveStatus>, type: TransactionItemProps['type']) {
  if (status === 'pending' || status === 'processing') return 'Processing';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'failed') return 'Failed';
  return type === 'send' ? 'Sent' : 'Received';
}

export function TransactionItem({
  status,
  type,
  labels,
  timestamp,
  walletId,
  amount,
  usdValue,
  currency = "ETH",
}: TransactionItemProps) {
  const normalizedStatus = resolveStatus(status, labels);
  const displayLabel = getLabel(normalizedStatus, type);

  const numericAmount = Number.parseFloat(amount || "0");
  const formattedAsset = Number.isNaN(numericAmount)
    ? `${amount} ${currency}`
    : `${numericAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currency}`;

  const numericUsd = Number.parseFloat(usdValue || "0");
  const formattedUsd = Number.isNaN(numericUsd)
    ? (usdValue ?? "0.00")
    : numericUsd.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return (
    <>
      <div className={`transaction-icon-container ${getStatusClass(normalizedStatus, type)}`}>
        {getIcon(normalizedStatus, type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white text-sm">{displayLabel}</p>
          <span className="text-xs text-gray-500">•</span>
          <code className="text-[11px] font-mono text-gray-500 truncate">{walletId}</code>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDateTime(timestamp)}</span>
        </div>
      </div>

      <div className="transaction-amount-container">
        <p className="transaction-usd-amount">
          ${formattedUsd}
        </p>
        <p className="transaction-amount">
          {formattedAsset}
        </p>
      </div>
    </>
  );
}


