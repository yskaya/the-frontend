import { CheckCircle2, Loader2, Calendar, XCircle } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { useScheduledPayments } from "../hooks";
import { ScheduledPayment } from "../types";
import { ScheduledPaymentDetailsDialog } from "./ScheduledPaymentDetailsDialog";
import { useState } from "react";

export function CompletedPayrollsPanel() {
  const { data: allScheduledPayments, isLoading, error } = useScheduledPayments();
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null);

  // Filter to show completed and cancelled payments
  const completedPayments = allScheduledPayments?.filter(
    (p) => p.status === 'completed' || p.status === 'cancelled'
  ) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="h-5 w-5 text-white" />
        <h2 className="text-white text-xl font-semibold">
          Completed Payrolls {!isLoading && completedPayments && `(${completedPayments.length})`}
        </h2>
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
      {!isLoading && !error && (!completedPayments || completedPayments.length === 0) && (
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400">No completed payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Completed scheduled payments will appear here</p>
        </div>
      )}

      {/* Completed Payrolls List */}
      {!isLoading && !error && completedPayments && completedPayments.length > 0 && (
        <div className="space-y-2">
          {completedPayments.map((payment) => {
            const isCancelled = payment.status === 'cancelled';
            return (
              <Dialog key={payment.id}>
                <DialogTrigger asChild>
                  <div
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                      isCancelled ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {isCancelled ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white text-sm">
                          To {payment.recipientName || `${payment.recipientAddress.slice(0, 6)}...${payment.recipientAddress.slice(-4)}`}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isCancelled
                              ? 'border-red-500/50 text-red-400 bg-red-500/10'
                              : 'border-green-500/50 text-green-400 bg-green-500/10'
                          }`}
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {payment.executedAt
                          ? new Date(payment.executedAt).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })
                          : new Date(payment.scheduledFor).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                      </span>
                      {payment.note && (
                        <>
                          <span>•</span>
                          <span className="truncate">{payment.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-white text-sm">
                      {payment.amount} ETH
                    </p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0">
                {selectedPayment && <ScheduledPaymentDetailsDialog payment={selectedPayment} />}
              </DialogContent>
            </Dialog>
            );
          })}
        </div>
      )}
    </div>
  );
}
