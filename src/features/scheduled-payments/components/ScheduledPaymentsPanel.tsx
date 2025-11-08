import { Clock, Loader2, X, Calendar, RefreshCw, Users, Trash2 } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "../hooks";
import { Payroll } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";

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

// Format date and time together
function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} • ${formatTime(date)}`;
}

export function ScheduledPaymentsPanel() {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const deleteMutation = useDeletePayroll();
  const createPayrollMutation = useCreatePayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Show pending payrolls: created, signed, scheduled
  // Exclude processing, completed, failed, cancelled (those go to PayrollsPanel)
  // Sort by status priority first, then by scheduled date
  const payrolls = (allPayrolls || [])
    .filter((p) => 
      p.status === 'created' || 
      p.status === 'signed' || 
      p.status === 'scheduled'
    )
    .sort((a, b) => {
      // Status priority: created (needs action) > signed > scheduled
      const statusOrder: Record<string, number> = { created: 0, signed: 1, scheduled: 2 };
      const statusA = statusOrder[a.status] ?? 999;
      const statusB = statusOrder[b.status] ?? 999;
      
      if (statusA !== statusB) {
        return statusA - statusB; // Sort by status priority
      }
      
      // Within same status, sort by scheduled date (nearest first)
      const dateA = new Date(a.scheduledFor).getTime();
      const dateB = new Date(b.scheduledFor).getTime();
      return dateA - dateB;
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
        // Create a new payroll with the same recipients and amounts
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

  return (
    <div className="scheduled-payrolls-panel-wrapper">
      <div className="scheduled-payrolls-panel-container">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="scheduled-payrolls-heading">
            {!isLoading && payrolls ? (
              <>
                <span className="text-white">{payrolls.length}</span> Payrolls
              </>
            ) : (
              'Payrolls'
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPayrolls}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading scheduled payments...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load scheduled payments</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!payrolls || payrolls.length === 0) && (
        <div className="placeholder">
          <p className="text-gray-400">No payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Create a payroll to get started</p>
        </div>
      )}

      {/* Payrolls List */}
      {!isLoading && !error && payrolls && payrolls.length > 0 && (
        <div className="scheduled-payrolls-list-container">
          {payrolls.map((payroll) => {
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            const completedCount = payroll.recipients.filter(r => r.status === 'completed').length;
            const pendingCount = payroll.recipients.filter(r => r.status === 'pending').length;
            const processingCount = payroll.recipients.filter(r => r.status === 'processing').length;
            
            return (
              <Sheet key={payroll.id}>
                <SheetTrigger asChild>
                  <div
                    className="payroll-item"
                    onClick={() => setSelectedPayroll(payroll)}
                  >
                    {/* Icon */}
                    <TransactionStatusIcon
                      status={
                        payroll.status === 'created'
                          ? 'created' // Blue - needs signature
                          : payroll.status === 'signed'
                          ? 'signed' // Green - signed
                          : payroll.status === 'scheduled'
                          ? 'scheduled' // Purple - scheduled
                          : payroll.status === 'processing'
                          ? 'processing' // Orange - processing
                          : payroll.status === 'completed'
                          ? 'sent' // Green - completed
                          : 'failed' // Red - failed/cancelled
                      }
                    />

                    {/* Payroll Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white text-sm">
                          {payroll.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {payroll.recipients.length}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(payroll.scheduledFor)}
                        </span>
                      </div>
                      {processingCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          {processingCount > 0 && <span className="text-yellow-400">{processingCount} processing</span>}
                          {pendingCount > 0 && <span className="text-gray-400">{pendingCount} pending</span>}
                        </div>
                      )}
                    </div>

                    {/* Amount and Actions */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-white text-sm">
                        ${(totalAmount * 3243.0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {totalAmount.toFixed(6)} ETH
                      </p>
                    </div>
                  </div>
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
                      theme="white"
                    />
                  )}
                </SheetContent>
              </Sheet>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

