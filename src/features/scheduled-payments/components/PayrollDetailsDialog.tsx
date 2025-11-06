import { Copy, Trash2, RefreshCw, X, FileSignature, Rocket } from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Separator } from "@/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { toast } from "sonner";
import { formatRelativeDate } from "@/lib/utils";
import { Payroll } from "../types";
import { TransactionStatusIcon } from "@/ui/TransactionStatusIcon";
import { useTransactions } from "@/features/wallet";
import { TransactionDetailsDialog } from "@/features/wallet/TransactionDetailsDialog";
import { useState } from "react";

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

interface PayrollDetailsDialogProps {
  payroll: Payroll;
  onCancel?: (id: string) => void;
  onRestart?: (payroll: Payroll) => void;
  onDelete?: (id: string) => void;
  onSign?: () => void;
  isCancelling?: boolean;
  isRestarting?: boolean;
  isDeleting?: boolean;
}

export function PayrollDetailsDialog({ 
  payroll, 
  onCancel, 
  onRestart, 
  onDelete,
  onSign,
  isCancelling = false,
  isRestarting = false,
  isDeleting = false
}: PayrollDetailsDialogProps) {
  const { data: transactions } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<{ hash?: string; id?: string } | null>(null);
  
  const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
  const totalAmountUSD = totalAmount * 3243.0;

  const getStatusIcon = () => {
    switch (payroll.status) {
      case 'completed':
        return 'sent'; // Green icon for completed
      case 'processing':
        return 'pending'; // Orange icon for processing
      case 'failed':
      case 'cancelled':
        return 'failed'; // Red icon for failed/cancelled
      case 'signed':
        return 'sent'; // Use sent icon for signed (will be styled differently)
      default:
        return 'scheduled'; // Grey icon for scheduled
    }
  };

  // Get dark background color based on payroll status
  const getBackgroundColor = () => {
    switch (payroll.status) {
      case 'completed':
        return "rgba(10, 25, 15, 1)"; // Darker green (same as sent)
      case 'cancelled':
      case 'failed':
        return "rgba(48, 16, 16, 1)"; // Darker red
      case 'processing':
        return "rgba(80, 50, 5, 1)"; // Darker brown/orange (same as pending)
      case 'signed':
        return "rgba(80, 50, 100, 1)"; // Darker purple for signed
      default:
        return "rgba(20, 20, 20, 1)"; // Darker grey for scheduled
    }
  };

  const statusBgColor = getBackgroundColor();

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  const handleViewTransaction = (transactionId: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${transactionId}`, '_blank');
    toast.success("Opening Sepolia Explorer...");
  };

  return (
    <div 
      className="rounded-lg h-full flex flex-col"
      style={{ backgroundColor: statusBgColor }}
    >
      {/* Fixed Header */}
      <div className="p-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14">
            {payroll.status === 'signed' ? (
              <div className="transaction-icon-container" style={{ 
                backgroundColor: 'rgb(168, 85, 247)', // Purple background
                border: '2px solid rgba(0, 0, 0, 0.1)', 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Rocket className="h-5 w-5" style={{ color: 'white' }} />
              </div>
            ) : (
              <TransactionStatusIcon status={getStatusIcon()} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white text-xl font-semibold">{payroll.name}</h3>
              {payroll.status !== 'completed' && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    payroll.status === 'cancelled' || payroll.status === 'failed'
                      ? 'border-red-500/50 text-red-400 bg-red-500/10'
                      : payroll.status === 'processing'
                      ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                      : payroll.status === 'signed'
                      ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                      : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                  }`}
                >
                  {payroll.status}
                </Badge>
              )}
              {(payroll.status === 'cancelled' || payroll.status === 'failed') && (
                <>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(payroll.id);
                      }}
                      disabled={isDeleting}
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title="Delete payroll"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  {onRestart && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestart(payroll);
                      }}
                      disabled={isRestarting}
                      className="h-6 w-6 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      title="Restart payroll"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              {(payroll.status === 'cancelled' || payroll.status === 'failed') ? (
                <div>
                  {payroll.status === 'cancelled' ? 'Cancelled' : 'Failed'}: {formatDateTime(payroll.updatedAt || payroll.executedAt || new Date().toISOString())}
                </div>
              ) : (
                <div>{formatDateTime(payroll.executedAt || payroll.scheduledFor)}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Amount */}
        <div className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
          <p className="text-sm text-gray-400 mb-2">Amount</p>
          <p className="text-4xl mb-2 font-bold text-white">
            ${totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xl text-gray-400">
            {totalAmount.toFixed(6)} ETH
          </p>
        </div>

        <Separator className="bg-white/10" />

        {/* Payroll Details */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">Payroll Details</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-400">Scheduled for</p>
              <p className="text-white">{formatDateTime(payroll.scheduledFor)}</p>
            </div>

            {payroll.executedAt && (
              <div className="flex justify-between">
                <p className="text-gray-400">Executed</p>
                <p className="text-white">{formatRelativeDate(payroll.executedAt)}</p>
              </div>
            )}

            {(payroll.status === 'cancelled' || payroll.status === 'failed') && (
              <div className="flex justify-between">
                <p className="text-gray-400">
                  {payroll.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                </p>
                <p className="text-white">{formatDateTime(payroll.updatedAt || payroll.executedAt || new Date().toISOString())}</p>
              </div>
            )}

            {payroll.note && (
              <div className="flex justify-between items-start">
                <p className="text-gray-400">Note</p>
                <p className="text-white text-right max-w-[60%]">{payroll.note}</p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Recipients */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">
            {payroll.recipients.length} {payroll.recipients.length === 1 ? 'Recipient' : 'Recipients'}
          </p>
          
                <div className="space-y-0" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {payroll.recipients.map((recipient, index) => {
                    const recipientAmount = parseFloat(recipient.amount || '0');
                    const recipientAmountUSD = recipientAmount * 3243.0;
                    const isFailed = recipient.status === 'failed';
                    
                    // Find transaction by transactionId (could be hash or database ID)
                    // Try matching by hash first, then by ID
                    const transaction = recipient.transactionId 
                      ? transactions?.find(tx => 
                          tx.hash === recipient.transactionId || 
                          tx.id === recipient.transactionId
                        )
                      : null;

                    const isSelected = selectedTransaction && (
                      (selectedTransaction.hash === recipient.transactionId) ||
                      (selectedTransaction.id === recipient.transactionId)
                    );

                    return (
                      <Sheet 
                        key={recipient.id} 
                        open={isSelected && !!transaction}
                        onOpenChange={(open) => {
                          if (!open) {
                            setSelectedTransaction(null);
                          } else if (open && transaction) {
                            setSelectedTransaction({ hash: transaction.hash, id: transaction.id });
                          }
                        }}
                      >
                        <div 
                          className="flex justify-between gap-4 cursor-pointer hover:bg-white/5 rounded-lg transition-colors w-full"
                          style={{ padding: '6px 12px', margin: '0 -12px', alignItems: 'center' }}
                          onClick={() => {
                            if (transaction) {
                              setSelectedTransaction({ hash: transaction.hash, id: transaction.id });
                            } else {
                              console.log('[PayrollDetailsDialog] Transaction not found:', {
                                transactionId: recipient.transactionId,
                                availableTransactions: transactions?.length || 0,
                                transactionHashes: transactions?.map(tx => tx.hash).slice(0, 5),
                                transactionIds: transactions?.map(tx => tx.id).slice(0, 5),
                              });
                              toast.info(`Transaction not found. ID: ${recipient.transactionId?.slice(0, 10)}...`);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {recipient.recipientName || recipient.recipientAddress.slice(0, 10) + '...'}
                              </p>
                              {recipient.executedAt && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(recipient.executedAt)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-gray-400 font-mono">
                                {recipient.recipientAddress.slice(0, 10)}...{recipient.recipientAddress.slice(-8)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 shrink-0 hover:bg-white/10 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAddress(recipient.recipientAddress);
                                }}
                                title="Copy recipient address"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {recipient.errorMessage && (
                              <div className="mt-2 text-xs text-red-300">
                                {recipient.errorMessage}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end">
                            <p className="text-2xl font-bold text-white">
                              ${recipientAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {recipientAmount.toFixed(6)} ETH
                            </p>
                          </div>
                        </div>
                        {transaction && (
                          <SheetContent 
                            side="left" 
                            noOverlay={true}
                            className="w-full sm:w-[500px] sm:left-[1000px] min-w-[300px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0"
                          >
                            <TransactionDetailsDialog transaction={transaction} />
                          </SheetContent>
                        )}
                        {!transaction && recipient.transactionId && (
                          <SheetContent 
                            side="left" 
                            noOverlay={true}
                            className="w-full sm:w-[500px] sm:left-[1000px] min-w-[300px] h-screen overflow-y-auto bg-[rgba(20,0,35,0.95)] border-white/10 p-0"
                          >
                            <div className="p-8">
                              <h3 className="text-white text-xl font-semibold mb-4">Transaction Details</h3>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-gray-400 text-sm mb-1">Transaction ID</p>
                                  <code className="text-white font-mono text-sm break-all">
                                    {recipient.transactionId}
                                  </code>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm mb-2">Transaction not found in local cache</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 border-white/20 text-white bg-transparent hover:bg-white/20"
                                    onClick={() => {
                                      window.open(`https://sepolia.etherscan.io/tx/${recipient.transactionId}`, '_blank');
                                    }}
                                  >
                                    View on Etherscan
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        )}
                      </Sheet>
              );
            })}
          </div>
        </div>
      </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/10 shrink-0 space-y-3">
              {payroll.status === 'scheduled' && onSign && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSign();
                  }}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg"
                >
                  <FileSignature className="h-5 w-5 mr-2" />
                  Sign Payroll
                </Button>
              )}
              {(payroll.status === 'scheduled' || payroll.status === 'signed') && onCancel && (
                <Button
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(payroll.id);
                  }}
                  disabled={isCancelling}
                  className="w-full h-12 text-white font-semibold rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(185, 28, 28, 0.5)', // Dark red with 50% opacity
                  }}
                  onMouseEnter={(e) => {
                    if (!isCancelling) {
                      e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.7)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCancelling) {
                      e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.5)';
                    }
                  }}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Payroll'}
                </Button>
              )}
            </div>
    </div>
  );
}

