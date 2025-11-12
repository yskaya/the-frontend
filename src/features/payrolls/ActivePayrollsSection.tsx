'use client';

import { Loader2 } from "lucide-react";
import { usePayrolls } from "./hooks";
import { Payroll } from "./types";
import { useState } from "react";
import { ActivePayrollDialog } from "./ActivePayrollDialog";
import { ActivePayrollItem } from "./ActivePayrollItem";
import { formatDateTime } from "@/lib/dateFormat";

export function ActivePayrollsSection() {
  const { data: allPayrolls, isLoading, error } = usePayrolls();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const activePayrolls =
    allPayrolls
      ?.filter(
        (p) => p.status === 'created' || p.status === 'signed' || p.status === 'scheduled'
      )
      .sort((a, b) => {
        if (a.status === 'created' && b.status !== 'created') return -1;
        if (a.status !== 'created' && b.status === 'created') return 1;
        return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
      }) || [];

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-[1200px] flex-col gap-[42px] rounded-[48px] bg-[rgba(31,0,55,0.7)] px-20 py-[60px]">
        <div className="flex items-center gap-2">
          <h2 className="font-[var(--font-nunito-sans)] text-[12px] font-semibold uppercase tracking-[0.1em] text-white/60">
            Active Payrolls
          </h2>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className="ml-2 text-gray-400">Loading active payrolls...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">Failed to load payrolls</p>
          </div>
        )}

        {!isLoading && !error && activePayrolls.length === 0 && (
          <div className="rounded-[12px] p-8 text-center">
            <p className="text-gray-400">No active payrolls</p>
            <p className="text-gray-500 text-sm mt-1">Created payrolls will appear here</p>
          </div>
        )}

        {!isLoading && !error && activePayrolls.length > 0 && (
          <div className="flex flex-col gap-8">
            {activePayrolls.map((payroll) => {
              const totalAmount = payroll.recipients.reduce(
                (sum, recipient) => sum + parseFloat(recipient.amount || '0'),
                0,
              );

              return (
                <div
                  key={payroll.id}
                  className="flex w-full items-center gap-[10px] rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => {
                    setSelectedPayroll(payroll);
                    setSignDialogOpen(true);
                  }}
                >
                  <ActivePayrollItem
                    name={payroll.name}
                    status={payroll.status}
                    date={payroll.scheduledFor}
                    receiversAmount={payroll.recipients.length}
                    price={{
                      usd: (totalAmount * 3243.0).toFixed(2),
                      eth: totalAmount.toFixed(6),
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {selectedPayroll && (
          <ActivePayrollDialog
            payroll={selectedPayroll}
            open={signDialogOpen}
            onOpenChange={(open) => {
              setSignDialogOpen(open);
              if (!open) {
                setSelectedPayroll(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}


