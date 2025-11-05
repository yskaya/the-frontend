import { Clock, Loader2, X, Calendar } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { useScheduledPayments, useCancelScheduledPayment } from "../hooks";
import { ScheduledPayment } from "../types";
import { toast } from "sonner";
import { ScheduledPaymentDetailsDialog } from "./ScheduledPaymentDetailsDialog";
import { useState } from "react";

export function ScheduledPaymentsPanel() {
  const { data: allScheduledPayments, isLoading, error } = useScheduledPayments();
  const cancelMutation = useCancelScheduledPayment();
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null);

  // Filter to show only pending and processing payments (not completed, failed, or cancelled)
  const scheduledPayments = allScheduledPayments?.filter(
    (p) => p.status === 'pending' || p.status === 'processing'
  ) || [];

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening dialog
    if (confirm('Are you sure you want to cancel this scheduled payment?')) {
      try {
        await cancelMutation.mutateAsync(id);
        toast.success('Scheduled payment cancelled');
      } catch (error) {
        toast.error('Failed to cancel scheduled payment');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-white" />
        <h2 className="text-white text-xl font-semibold">
          Scheduled Payrolls {!isLoading && scheduledPayments && `(${scheduledPayments.length})`}
        </h2>
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
      {!isLoading && !error && (!scheduledPayments || scheduledPayments.length === 0) && (
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400">No scheduled payments</p>
          <p className="text-gray-500 text-sm mt-1">Schedule a payment to get started</p>
        </div>
      )}

      {/* Scheduled Payments List */}
      {!isLoading && !error && scheduledPayments && scheduledPayments.length > 0 && (
        <div className="space-y-2">
          {scheduledPayments.map((payment) => (
            <Dialog key={payment.id}>
              <DialogTrigger asChild>
                <div
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                  onClick={() => setSelectedPayment(payment)}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center h-10 w-10 rounded-full shrink-0 bg-purple-500/20">
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white text-sm">
                        To {payment.recipientName || `${payment.recipientAddress.slice(0, 6)}...${payment.recipientAddress.slice(-4)}`}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs border-purple-500/50 text-purple-400 bg-purple-500/10"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.scheduledFor).toLocaleString('en-US', { 
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

                  {/* Amount and Actions */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-white text-sm">
                      {payment.amount} ETH
                    </p>
                    {payment.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCancel(e, payment.id)}
                        disabled={cancelMutation.isPending}
                        className="h-6 px-2 mt-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0">
                {selectedPayment && <ScheduledPaymentDetailsDialog payment={selectedPayment} />}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}

