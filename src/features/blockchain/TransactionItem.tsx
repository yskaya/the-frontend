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

function getStyles(status: ReturnType<typeof resolveStatus>, type: TransactionItemProps['type']) {
  if (status === 'pending' || status === 'processing') {
    return {
      container: 'bg-[#734c09]',
      icon: 'text-[#fe9902]',
    };
  }

  if (status === 'failed' || status === 'cancelled') {
    return {
      container: 'bg-[#481818]',
      icon: 'text-[#ef4444]',
    };
  }

  if (type === 'receive') {
    return {
      container: 'bg-[#1d2f48]',
      icon: 'text-[#439eef]',
    };
  }

  return {
    container: 'bg-[#183e26]',
    icon: 'text-[#00e476]',
  };
}

function getIcon(
  status: ReturnType<typeof resolveStatus>,
  type: TransactionItemProps['type'],
  iconClass: string,
) {
  if (status === 'pending' || status === 'processing') {
    return <RefreshCw className={`h-5 w-5 ${iconClass}`} />;
  }

  if (type === 'receive') {
    return <ArrowDownLeft className={`h-5 w-5 ${iconClass}`} />;
  }

  return <ArrowUpRight className={`h-5 w-5 ${iconClass}`} />;
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
  const { container, icon } = getStyles(normalizedStatus, type);

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
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black/10 ${container}`}>
        {getIcon(normalizedStatus, type, icon)}
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

      <div className="shrink-0 text-right">
        <p className="mb-1 font-[var(--font-nunito-sans)] text-base font-semibold text-white">
          ${formattedUsd}
        </p>
        <p className="font-[var(--font-nunito-sans)] text-xs text-gray-500">
          {formattedAsset}
        </p>
      </div>
    </>
  );
}


