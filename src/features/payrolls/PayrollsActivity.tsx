'use client';

import { RefreshCw, Loader2, Users } from "lucide-react";
import { Button } from "@/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "./hooks";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Payroll } from "./types";
import { PayrollItem } from "./PayrollItem";
import { PayrollDialog } from "./PayrollDialog";
import { cn } from "@/lib/utils";
import { useDashboardContext } from "@/features/dashboard/DashboardProvider";

interface PayrollsActivityProps {
  embedded?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function PayrollsActivity({
  className,
}: PayrollsActivityProps) {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const deleteMutation = useDeletePayroll();
  const createPayrollMutation = useCreatePayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const { activeTab } = useDashboardContext();

  // Show processing, completed, cancelled, and failed payrolls
  // Exclude created, signed, scheduled (handled elsewhere in the UI)
  // Sort by execution status, then by date
  const payrolls = (allPayrolls || [])
    .filter((p) => 
      p.status === 'processing' || 
      p.status === 'completed' || 
      p.status === 'cancelled' || 
      p.status === 'failed'
    )
    .sort((a, b) => {
      const dateA = new Date(a.scheduledFor).getTime();
      const dateB = new Date(b.scheduledFor).getTime();
      return dateB - dateA; // Most recent first (descending)
    });

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening dialog
    if (confirm('Are you sure you want to cancel this payroll?')) {
      try {
        await cancelMutation.mutateAsync(id);
        toast.success('Payroll cancelled');
      } catch (error) {
        toast.error('Failed to cancel payroll');
      }
    }
  };

  const handleRestart = async (payroll: Payroll) => {
    if (confirm('Are you sure you want to restart this payroll? It will create a new scheduled payroll with the same recipients and amounts.')) {
      try {
        await createPayrollMutation.mutateAsync({
          name: payroll.name,
          scheduledFor: new Date(Date.now() + 60000).toISOString(), // Schedule for 1 minute from now
          note: payroll.note || undefined,
          recipients: payroll.recipients.map(r => ({
            recipientAddress: r.recipientAddress,
            recipientName: r.recipientName || undefined,
            amount: r.amount,
          })),
        });
        toast.success('Payroll restarted successfully');
      } catch (error: any) {
        toast.error('Failed to restart payroll', {
          description: error.message || 'An error occurred',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payroll? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Payroll deleted successfully');
      } catch (error: any) {
        toast.error('Failed to delete payroll', {
          description: error.message || 'An error occurred',
        });
      }
    }
  };

  const refreshPayrolls = () => {
    refetch();
    toast.success('Payrolls refreshed');
  };


  const content = (
    <>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading payrolls...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load payrolls</p>
        </div>
      )}

      {!isLoading && !error && (!payrolls || payrolls.length === 0) && (
        <div className="rounded-[12px] p-8 text-center">
          <p className="text-gray-400">No payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Create a payroll to get started</p>
        </div>
      )}

      {!isLoading && !error && payrolls && payrolls.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-8">
          {payrolls.map((payroll) => {
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            const totalAmountUSD = totalAmount * 3243.0;
            
            return (
              <Sheet key={payroll.id} open={selectedPayroll?.id === payroll.id} onOpenChange={(open) => {
                if (!open) {
                  setSelectedPayroll(null);
                } else if (open && selectedPayroll?.id !== payroll.id) {
                  setSelectedPayroll(payroll);
                }
              }}>
                <SheetTrigger asChild>
                  <button 
                    className="flex w-full items-center gap-[10px] text-left transition-opacity hover:opacity-80"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPayroll(payroll);
                    }}
                  >
                    <PayrollItem
                      status={payroll.status}
                      name={payroll.name}
                      recipients={payroll.recipients.length}
                      date={payroll.scheduledFor}
                      walletId={payroll.id}
                      amount={{
                        usd: totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        eth: totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      }}
                    />
                  </button>
                </SheetTrigger>
                <SheetContent 
                  side="bottom"
                  className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
                >
                  {selectedPayroll && (
                    <PayrollDialog 
                      payroll={selectedPayroll}
                      onCancel={selectedPayroll.status === 'scheduled' ? (id: string) => handleCancel({} as React.MouseEvent, id) : undefined}
                      onRestart={(selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') ? handleRestart : undefined}
                      onDelete={(selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') ? handleDelete : undefined}
                      isCancelling={cancelMutation.isPending}
                      isRestarting={createPayrollMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                    />
                  )}
                </SheetContent>
              </Sheet>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className={cn("w-full mx-auto flex flex-col", activeTab === 'prls' ? "gap-8" : "gap-4")}>
      <h2 className="font-[var(--font-nunito-sans)] text-[12px] font-semibold uppercase tracking-[0.4em] text-white/60">
        Payroll Activity
      </h2>
      {content}
    </div>
  );
}


