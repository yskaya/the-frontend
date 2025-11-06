import { Loader2, Calendar, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "../hooks";
import { Payroll } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";

export function CompletedPayrollsPanel() {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const deleteMutation = useDeletePayroll();
  const createPayrollMutation = useCreatePayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Filter to show only completed payrolls
  const completedPayrolls = allPayrolls?.filter(
    (p) => p.status === 'completed'
  ) || [];

  const refreshPayrolls = () => {
    refetch();
    toast.success('Payrolls refreshed');
  };

  const handleRestart = async (payroll: Payroll) => {
    if (confirm('Are you sure you want to restart this payroll? It will create a new scheduled payroll with the same recipients and amounts.')) {
      try {
        // Create a new payroll with the same data
        const newPayroll = {
          name: payroll.name,
          scheduledFor: new Date().toISOString(), // Schedule for now
          note: payroll.note,
          recipients: payroll.recipients.map((r) => ({
            recipientAddress: r.recipientAddress,
            recipientName: r.recipientName,
            amount: r.amount,
          })),
        };
        await createPayrollMutation.mutateAsync(newPayroll);
        toast.success('Payroll restarted successfully');
        refetch();
      } catch (error: any) {
        toast.error('Failed to restart payroll', {
          description: error?.message || 'An error occurred',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payroll? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Payroll deleted successfully');
        refetch();
      } catch (error: any) {
        toast.error('Failed to delete payroll', {
          description: error?.message || 'An error occurred',
        });
      }
    }
  };

  return (
    <div className="completed-payrolls-panel-wrapper">
      <div className="completed-payrolls-panel-container">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="completed-payrolls-heading">
            {!isLoading && completedPayrolls ? (
              <>
                <span className="text-white">{completedPayrolls.length}</span> Completed Payrolls
              </>
            ) : (
              'Completed Payrolls'
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
          <span className="ml-2 text-gray-400">Loading completed payrolls...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load completed payrolls</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!completedPayrolls || completedPayrolls.length === 0) && (
        <div className="placeholder">
          <p className="text-gray-400">No completed payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Completed payrolls will appear here</p>
        </div>
      )}

      {/* Completed Payrolls List */}
      {!isLoading && !error && completedPayrolls && completedPayrolls.length > 0 && (
        <div className="completed-payrolls-list-container">
          {completedPayrolls.map((payroll) => {
            const isCancelled = payroll.status === 'cancelled';
            const isFailed = payroll.status === 'failed';
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            const failedCount = payroll.recipients.filter(r => r.status === 'failed').length;
            
            return (
              <Dialog key={payroll.id}>
                <DialogTrigger asChild>
                  <div
                    className="payroll-item"
                    onClick={() => setSelectedPayroll(payroll)}
                  >
                    {/* Icon */}
                    <TransactionStatusIcon
                      status={
                        isCancelled || isFailed
                          ? 'failed'
                          : 'sent'
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
                          {payroll.executedAt
                            ? formatRelativeDate(payroll.executedAt)
                            : formatRelativeDate(payroll.scheduledFor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
                      </div>
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
                </DialogTrigger>
                <DialogContent 
                  aria-describedby={undefined} 
                  className="!border-0 !shadow-none !p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:!zoom-out-0 data-[state=open]:!zoom-in-0 !fixed !right-0 !left-auto !top-0 !bottom-0 !w-full !max-w-[700px] !h-screen !max-h-screen rounded-none transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 overflow-hidden"
                >
                  {selectedPayroll && (
                    <PayrollDetailsDialog 
                      payroll={selectedPayroll}
                      onRestart={(selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') ? handleRestart : undefined}
                      onDelete={(selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') ? handleDelete : undefined}
                      isRestarting={createPayrollMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                    />
                  )}
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
