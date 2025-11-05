import { Loader2, Calendar, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { usePayrolls } from "../hooks";
import { Payroll } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import "../../../components.css";

export function CompletedPayrollsPanel() {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Filter to show only completed payrolls
  const completedPayrolls = allPayrolls?.filter(
    (p) => p.status === 'completed'
  ) || [];

  const refreshPayrolls = () => {
    refetch();
    toast.success('Payrolls refreshed');
  };

  return (
    <div className="completed-payrolls-panel-wrapper">
      <div className="completed-payrolls-panel-container">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="completed-payrolls-heading">
            Completed Payrolls {!isLoading && completedPayrolls && `(${completedPayrolls.length})`}
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
                        {payroll.note && (
                          <>
                            <span>•</span>
                            <span className="truncate">{payroll.note}</span>
                          </>
                        )}
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
                              : 'border-green-500/50 text-green-400 bg-green-500/10'
                          }`}
                        >
                          {selectedPayroll.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Scheduled for: <span className="text-black">{formatRelativeDate(selectedPayroll.scheduledFor)}</span></p>
                        {selectedPayroll.executedAt && <p className="text-sm text-gray-400">Executed at: <span className="text-black">{formatRelativeDate(selectedPayroll.executedAt)}</span></p>}
                        {selectedPayroll.note && <p className="text-sm text-gray-400">Note: <span className="text-black">{selectedPayroll.note}</span></p>}
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="text-sm font-semibold text-black mb-2">Recipients ({selectedPayroll.recipients.length})</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {selectedPayroll.recipients.map((recipient) => {
                            const isRecipientFailed = recipient.status === 'failed';
                            return (
                              <div key={recipient.id} className={`p-3 rounded-lg ${isRecipientFailed ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-black">{recipient.recipientName || recipient.recipientAddress.slice(0, 10)}...</p>
                                    <p className="text-xs text-gray-400 font-mono">{recipient.recipientAddress}</p>
                                    {recipient.errorMessage && (
                                      <p className="text-xs text-red-400 mt-1">{recipient.errorMessage}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-black">{recipient.amount} ETH</p>
                                    <Badge variant="outline" className={`text-xs mt-1 ${isRecipientFailed ? 'border-red-500/50 text-red-400' : ''}`}>
                                      {recipient.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
