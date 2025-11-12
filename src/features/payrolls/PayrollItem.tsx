'use client';

import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { formatDateTime } from "@/lib/dateFormat";
import type { PayrollStatus } from "./types";
import { Users } from "lucide-react";

interface PayrollItemProps {
  status: PayrollStatus;
  name: string;
  recipients: number;
  date: string | number | Date;
  walletId: string;
  amount: {
    usd: string;
    eth: string;
  };
}

function getIconStatus(status: PayrollStatus) {
  switch (status) {
    case "processing":
      return "processing";
    case "completed":
      return "sent";
    case "failed":
    case "cancelled":
      return "failed";
    case "signed":
    case "scheduled":
      return "scheduled";
    case "created":
      return "created";
    default:
      return "processing";
  }
}

export function PayrollItem({
  status,
  name,
  recipients,
  date,
  walletId,
  amount,
}: PayrollItemProps) {
  return (
    <>
      <TransactionStatusIcon status={getIconStatus(status)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white text-sm">{name}</p>
          <span className="text-xs text-gray-500">•</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            {recipients}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDateTime(date)}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-sm text-white">${amount.usd}</p>
        <p className="text-xs text-gray-500 mt-1">{amount.eth} ETH</p>
      </div>
    </>
  );
}


