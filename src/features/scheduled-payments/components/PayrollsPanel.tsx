import { RefreshCw, Loader2, Users } from "lucide-react";
import { Button } from "@/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "../hooks";
import { toast } from "sonner";
import { useState } from "react";
import { Payroll } from "../types";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";
import { formatRelativeDate } from "@/lib/utils";

// Format date as "May 26, 2025"
function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format date with time as "May 26, 2025 • 01:00pm"
function formatDateWithTime(date: string | Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
  return `${dateStr} • ${timeStr}`;
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

// Format date and time together
function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} • ${formatTime(date)}`;
}

interface PayrollsPanelProps {
  embedded?: boolean;
}

export function PayrollsPanel({ embedded = false }: PayrollsPanelProps) {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const deleteMutation = useDeletePayroll();
  const createPayrollMutation = useCreatePayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Show processing, completed, cancelled, and failed payrolls
  // Exclude created, signed, scheduled (those go to ScheduledPaymentsPanel)
  // Sort by execution status, then by date
  const payrolls = (allPayrolls || [])
    .filter((p) => 
      p.status === 'processing' || 
      p.status === 'completed' || 
      p.status === 'cancelled' || 
      p.status === 'failed'
    )
    .sort((a, b) => {
      // Status priority: processing > completed > failed > cancelled
      const statusOrder: Record<string, number> = { processing: 0, completed: 1, failed: 2, cancelled: 3 };
      const statusA = statusOrder[a.status] ?? 999;
      const statusB = statusOrder[b.status] ?? 999;
      
      if (statusA !== statusB) {
        return statusA - statusB; // Sort by status priority
      }
      
      // Within same status, sort by scheduled date (most recent first)
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

  const header = !embedded ? (
    <div className="flex items-center justify-between gap-2">
      <h2 className="transactions-history-heading flex items-center gap-2">
        Payroll History
      </h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={refreshPayrolls}
        className="text-white hover:text-white hover:bg-white/10"
        title="Refresh payrolls"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  ) : null;

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
        <div className="placeholder">
          <p className="text-gray-400">No payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Create a payroll to get started</p>
        </div>
      )}

      {!isLoading && !error && payrolls && payrolls.length > 0 && (
        <div className="flex-1 overflow-y-auto transaction-list-container">
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
                    className="transaction-item-button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPayroll(payroll);
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`transaction-icon-container ${
                        payroll.status === 'processing'
                          ? 'transaction-icon-pending'
                          : payroll.status === 'completed'
                          ? 'transaction-icon-sent'
                          : payroll.status === 'failed' || payroll.status === 'cancelled'
                          ? 'transaction-icon-sent'
                          : 'transaction-icon-pending'
                      }`}
                    >
                      <TransactionStatusIcon
                        status={
                          payroll.status === 'processing'
                            ? 'processing'
                            : payroll.status === 'completed'
                            ? 'sent'
                            : payroll.status === 'failed' || payroll.status === 'cancelled'
                            ? 'failed'
                            : 'scheduled'
                        }
                      />
                    </div>

                    {/* Payroll Info */}
                    <div className="transaction-info-container">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="transaction-item-text">
                          {payroll.name}
                        </span>
                        <span className="dot-separator">•</span>
                        <span className="transaction-date-time flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {payroll.recipients.length}
                        </span>
                      </div>
                      <div className="transaction-hash">
                        {formatDateWithTime(payroll.scheduledFor)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="transaction-amount-container">
                      <p className="transaction-usd-amount">
                        ${totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="transaction-amount">
                        {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH
                      </p>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent 
                  side="bottom"
                  className="w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden bg-transparent border-0 p-0"
                >
                  {selectedPayroll && (
                    <PayrollDetailsDialog 
                      payroll={selectedPayroll}
                      onCancel={selectedPayroll.status === 'scheduled' ? (id) => handleCancel({} as React.MouseEvent, id) : undefined}
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

  if (embedded) {
    return (
      <div className="flex flex-col gap-4 h-full">
        {content}
      </div>
    );
  }

  return (
    <div className="transactions-panel-wrapper">
      <div className="transactions-panel-container">
        {header}
        {content}
      </div>
    </div>
  );
}

