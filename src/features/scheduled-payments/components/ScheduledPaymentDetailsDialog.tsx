import { Clock, Copy, ExternalLink, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import { toast } from "sonner";
import { ScheduledPayment } from "../types";

interface ScheduledPaymentDetailsDialogProps {
  payment: ScheduledPayment;
}

export function ScheduledPaymentDetailsDialog({ payment }: ScheduledPaymentDetailsDialogProps) {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(payment.recipientAddress);
    toast.success("Recipient address copied");
  };

  const handleCopyTransactionHash = () => {
    if (payment.transactionId) {
      navigator.clipboard.writeText(payment.transactionId);
      toast.success("Transaction hash copied");
    }
  };

  const handleViewOnExplorer = () => {
    if (payment.transactionId) {
      window.open(`https://sepolia.etherscan.io/tx/${payment.transactionId}`, '_blank');
      toast.success("Opening Sepolia Explorer...");
    }
  };

  const getStatusIcon = () => {
    switch (payment.status) {
      case 'completed':
        return <CheckCircle2 className="h-7 w-7 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-7 w-7 text-red-500" />;
      case 'failed':
        return <XCircle className="h-7 w-7 text-red-500" />;
      case 'processing':
        return <Clock className="h-7 w-7 text-orange-500" />;
      default:
        return <Clock className="h-7 w-7 text-purple-500" />;
    }
  };

  const getStatusColor = () => {
    switch (payment.status) {
      case 'completed':
        return 'bg-green-500/10';
      case 'cancelled':
        return 'bg-red-500/10';
      case 'failed':
        return 'bg-red-500/10';
      case 'processing':
        return 'bg-orange-500/10';
      default:
        return 'bg-purple-500/10';
    }
  };

  return (
    <div className="bg-white text-black rounded-lg -m-6 max-h-[85vh] min-h-[400px] flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center h-14 w-14 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-black text-xl font-semibold">Scheduled Payroll</h3>
              <Badge
                variant="outline"
                className={`text-xs ${
                  payment.status === 'completed'
                    ? 'border-green-500/50 text-green-600 bg-green-500/10'
                    : payment.status === 'cancelled' || payment.status === 'failed'
                    ? 'border-red-500/50 text-red-600 bg-red-500/10'
                    : payment.status === 'processing'
                    ? 'border-orange-500/50 text-orange-600 bg-orange-500/10'
                    : 'border-purple-500/50 text-purple-600 bg-purple-500/10'
                }`}
              >
                {payment.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(payment.scheduledFor).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Amount */}
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Amount</p>
          <p className="text-4xl mb-2 font-bold text-black">
            {payment.amount} ETH
          </p>
        </div>

        <Separator className="bg-gray-200" />

        {/* Payment Details */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-black">Payment Details</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start gap-4">
              <p className="text-gray-600">Recipient</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-black font-mono">
                  {payment.recipientName || payment.recipientAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-gray-100"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {payment.recipientName && (
              <div className="flex justify-between items-start gap-4">
                <p className="text-gray-600">Recipient Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-black font-mono">
                    {payment.recipientAddress.slice(0, 10)}...{payment.recipientAddress.slice(-8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:bg-gray-100"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <p className="text-gray-600">Scheduled Date</p>
              <p className="text-black">
                {new Date(payment.scheduledFor).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-600">Scheduled Time</p>
              <p className="text-black">
                {new Date(payment.scheduledFor).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>

            {payment.note && (
              <div className="flex justify-between items-start">
                <p className="text-gray-600">Note</p>
                <p className="text-black text-right max-w-[60%]">{payment.note}</p>
              </div>
            )}

            {payment.executedAt && (
              <div className="flex justify-between">
                <p className="text-gray-600">Executed At</p>
                <p className="text-black">
                  {new Date(payment.executedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}

            {payment.createdAt && (
              <div className="flex justify-between">
                <p className="text-gray-600">Created At</p>
                <p className="text-black">
                  {new Date(payment.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {payment.transactionId && (
          <>
            <Separator className="bg-gray-200" />

            {/* Transaction Hash */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-black">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-black font-mono flex-1">
                  {payment.transactionId.length > 42 
                    ? `${payment.transactionId.slice(0, 42)}...` 
                    : payment.transactionId}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-2 inline-flex items-center justify-center hover:bg-gray-100"
                    onClick={handleCopyTransactionHash}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-gray-300 text-black bg-transparent hover:bg-gray-100 hover:border-gray-400 transition-colors"
                onClick={handleViewOnExplorer}
              >
                <ExternalLink className="h-4 w-4" />
                View on Sepolia Explorer
              </Button>
            </div>
          </>
        )}

        {payment.errorMessage && (
          <>
            <Separator className="bg-gray-200" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-600">Error Message</p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {payment.errorMessage}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
