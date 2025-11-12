'use client';

import { Users, Rocket, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PayrollStatus } from "./types";
import { formatDateTime } from "@/lib/dateFormat";

interface ActivePayrollItemProps {
  name: string;
  status: PayrollStatus;
  date: string;
  receiversAmount: number;
  price: {
    usd: string;
    eth: string;
  };
}

export function ActivePayrollItem({
  name,
  status,
  date,
  receiversAmount,
  price,
}: ActivePayrollItemProps) {
  const isCreated = status === "created";
  const isSigned = status === "signed" || status === "scheduled";

  return (
    <>
      {isCreated && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 shrink-0">
          <FileText className="h-5 w-5 text-white" />
        </div>
      )}

      {isSigned && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 shrink-0">
          <Rocket className="h-5 w-5 text-white" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white text-sm">{name}</p>
          <span className="text-xs text-gray-500">•</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            {receiversAmount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatDateTime(date)}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className={cn(
            "font-semibold text-sm",
            isSigned ? "text-white" : "text-white/80",
          )}
        >
          ${price.usd}
        </p>
        <p className="text-xs text-gray-500 mt-1">{price.eth} ETH</p>
      </div>
    </>
  );
}


