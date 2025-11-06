import { Calendar, RefreshCw, Loader2, Users } from "lucide-react";
import { Button } from "@/ui/button";
import { ScrollArea } from "@/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "../hooks";
import { toast } from "sonner";
import { useState } from "react";
import { Payroll } from "../types";
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

export function PayrollsPanel() {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const deleteMutation = useDeletePayroll();
  const createPayrollMutation = useCreatePayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Show all payrolls except scheduled (processing, cancelled, failed, completed)
  // Sort by scheduling date (scheduledFor) - nearest scheduled date first
  const payrolls = (allPayrolls || [])
    .filter((p) => p.status !== 'scheduled') // Exclude scheduled payrolls
    .sort((a, b) => {
      const dateA = new Date(a.scheduledFor).getTime();
      const dateB = new Date(b.scheduledFor).getTime();
      return dateA - dateB; // Nearest scheduled date first (ascending)
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white text-xl font-semibold flex items-center gap-2">
                {!isLoading && payrolls ? (
                  <>
                    <span className="text-white">{payrolls.length}</span> Payrolls
                  </>
                ) : (
                  'Payrolls'
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={refreshPayrolls}
                  title="Refresh payrolls"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </h2>
            </div>
            <p className="text-gray-400 text-sm">Manage scheduled and completed payrolls</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="px-8 pb-8 pt-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
              <span className="ml-2 text-gray-400">Loading payrolls...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">Failed to load payrolls</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!payrolls || payrolls.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-400">No payrolls</p>
              <p className="text-gray-500 text-sm mt-1">Create a payroll to get started</p>
            </div>
          )}

          {/* Payrolls List */}
          {!isLoading && !error && payrolls && payrolls.length > 0 && (
            <div className="flex flex-col gap-6" style={{ gap: '24px' }}>
              {payrolls.map((payroll) => {
                const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
                const pendingCount = payroll.recipients.filter(r => r.status === 'pending').length;
                const processingCount = payroll.recipients.filter(r => r.status === 'processing').length;
                
                return (
                  <Sheet key={payroll.id} open={selectedPayroll?.id === payroll.id} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedPayroll(null);
                    } else if (open && selectedPayroll?.id !== payroll.id) {
                      setSelectedPayroll(payroll);
                    }
                  }}>
                    <SheetTrigger asChild>
                      <div
                        className="payroll-item rounded-lg cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedPayroll(payroll);
                        }}
                      >
                        {/* Icon */}
                        <TransactionStatusIcon
                          status={
                            payroll.status === 'completed'
                              ? 'sent' // Green icon for completed
                              : payroll.status === 'processing'
                              ? 'pending' // Orange icon for processing
                              : payroll.status === 'failed' || payroll.status === 'cancelled'
                              ? 'failed' // Red icon for failed/cancelled
                              : 'scheduled' // Grey icon for scheduled
                          }
                        />

                        {/* Payroll Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white text-sm">
                              {payroll.name}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Users className="h-3 w-3" />
                              {payroll.recipients.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
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

                        {/* Amount */}
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
                      side="left" 
                      noOverlay={true}
                      className="w-full sm:w-[500px] sm:left-[500px] min-w-[300px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0"
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

        </div>
      </ScrollArea>
    </div>
  );
}

