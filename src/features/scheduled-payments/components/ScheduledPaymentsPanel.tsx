import { Clock, Loader2, X, Calendar, RefreshCw, Users, Trash2 } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { usePayrolls, useCancelPayroll, useCreatePayroll, useDeletePayroll } from "../hooks";
import { Payroll } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";

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

  // Filter to show scheduled, processing, cancelled, and failed payrolls (not completed)
  const scheduledPayrolls = allPayrolls?.filter(
    (p) => p.status === 'scheduled' || p.status === 'processing' || p.status === 'cancelled' || p.status === 'failed'
  ) || [];

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
            Scheduled Payrolls {!isLoading && scheduledPayrolls && `(${scheduledPayrolls.length})`}
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
      {!isLoading && !error && (!scheduledPayrolls || scheduledPayrolls.length === 0) && (
        <div className="placeholder">
          <p className="text-gray-400">No scheduled payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Create a payroll to get started</p>
        </div>
      )}

      {/* Scheduled Payrolls List */}
      {!isLoading && !error && scheduledPayrolls && scheduledPayrolls.length > 0 && (
        <div className="scheduled-payrolls-list-container">
          {scheduledPayrolls.map((payroll) => {
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            const completedCount = payroll.recipients.filter(r => r.status === 'completed').length;
            const pendingCount = payroll.recipients.filter(r => r.status === 'pending').length;
            const processingCount = payroll.recipients.filter(r => r.status === 'processing').length;
            
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
                        payroll.status === 'processing'
                          ? 'pending'
                          : payroll.status === 'failed'
                          ? 'failed'
                          : payroll.status === 'cancelled'
                          ? 'failed'
                          : 'scheduled'
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
                        {payroll.note && (
                          <>
                            <span>•</span>
                            <span className="truncate">{payroll.note}</span>
                          </>
                        )}
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
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-0">
                  {selectedPayroll && (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-black">{selectedPayroll.name}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            selectedPayroll.status === 'cancelled' || selectedPayroll.status === 'failed'
                              ? 'border-red-500/50 text-red-400 bg-red-500/10'
                              : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                          }`}
                        >
                          {selectedPayroll.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Scheduled for: <span className="text-black">{formatDateTime(selectedPayroll.scheduledFor)}</span></p>
                        {selectedPayroll.note && <p className="text-sm text-gray-400">Note: <span className="text-black">{selectedPayroll.note}</span></p>}
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="text-sm font-semibold text-black mb-2">Recipients ({selectedPayroll.recipients.length})</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {selectedPayroll.recipients.map((recipient) => (
                            <div key={recipient.id} className="p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-black">{recipient.recipientName || recipient.recipientAddress.slice(0, 10)}...</p>
                                  <p className="text-xs text-gray-400 font-mono">{recipient.recipientAddress}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-black">{recipient.amount} ETH</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {recipient.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(selectedPayroll.status === 'scheduled' || selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') && (
                        <div className="border-t border-white/10 pt-4 space-y-2">
                          {selectedPayroll.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(e, selectedPayroll.id);
                              }}
                              disabled={cancelMutation.isPending}
                              className="w-full h-10 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Payroll
                            </Button>
                          )}
                          {(selectedPayroll.status === 'failed' || selectedPayroll.status === 'cancelled') && (
                            <div className="space-y-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestart(selectedPayroll);
                                }}
                                disabled={createPayrollMutation.isPending}
                                className="w-full h-10 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restart Payroll
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(selectedPayroll.id);
                                }}
                                disabled={deleteMutation.isPending}
                                className="w-full h-10 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Payroll
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

