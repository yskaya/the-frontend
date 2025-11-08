import { Copy, Trash2, RefreshCw, X, FileSignature, Rocket, Calendar, Users } from "lucide-react";
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
import { StickyNote } from '@/ui/sticky-note';

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
  theme?: 'dark' | 'white';
}

export function PayrollDetailsDialog({ 
  payroll, 
  onCancel, 
  onRestart, 
  onDelete,
  onSign,
  isCancelling = false,
  isRestarting = false,
  isDeleting = false,
  theme = 'dark'
}: PayrollDetailsDialogProps) {
  const { data: transactions } = useTransactions();
  const [selectedTransaction, setSelectedTransaction] = useState<{ hash?: string; id?: string } | null>(null);
  
  const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
  const totalAmountUSD = totalAmount * 3243.0;
  const networkFeeEth = totalAmount > 0 ? 0.002 : 0;
  const appFeeRate = 0.005;
  const appFeeEth = totalAmount * appFeeRate;
  const grandTotalEth = totalAmount + (totalAmount > 0 ? appFeeEth + networkFeeEth : 0);
  const grandTotalUsd = grandTotalEth * 3243.0;

  const getStatusIcon = () => {
    switch (payroll.status) {
      case 'created':
        return 'created'; // Blue icon for created
      case 'signed':
        return 'signed'; // Green checkmark for signed
      case 'scheduled':
        return 'scheduled'; // Purple icon for scheduled
      case 'processing':
        return 'processing'; // Orange icon for processing
      case 'completed':
        return 'sent'; // Green icon for completed
      case 'failed':
      case 'cancelled':
        return 'failed'; // Red icon for failed/cancelled
      default:
        return 'scheduled';
    }
  };

  // Get dark background color based on payroll status
  const getBackgroundColor = () => {
    switch (payroll.status) {
      case 'created':
        return "rgba(29, 47, 72, 1)"; // Dark blue for created
      case 'signed':
        return "rgba(24, 62, 38, 1)"; // Dark green for signed
      case 'scheduled':
        return "rgba(88, 28, 135, 1)"; // Purple for scheduled
      case 'processing':
        return "rgba(115, 76, 9, 1)"; // Brown/orange for processing
      case 'completed':
        return "rgba(10, 25, 15, 1)"; // Dark green for completed
      case 'cancelled':
      case 'failed':
        return "rgba(72, 24, 24, 1)"; // Dark red for failed/cancelled
      default:
        return "rgba(20, 20, 20, 1)"; // Dark grey default
    }
  };

  const statusBgColor = getBackgroundColor();
  const isWhite = theme === 'white';

  const darkPalette = (() => {
    switch (payroll.status) {
      case 'signed':
      case 'completed':
        return {
          cardBg: 'bg-emerald-900/30',
          cardBorder: 'border-emerald-500/20',
          heading: 'text-emerald-100',
          sub: 'text-emerald-300',
          label: 'text-emerald-300',
          muted: 'text-emerald-400',
          divider: 'border-emerald-500/20',
        } as const;
      case 'processing':
        return {
          cardBg: 'bg-[rgba(80,50,5,0.45)]',
          cardBorder: 'border-[rgba(160,110,40,0.45)]',
          heading: 'text-amber-100',
          sub: 'text-amber-300',
          label: 'text-amber-200',
          muted: 'text-amber-300',
          divider: 'border-[rgba(160,110,40,0.45)]',
        } as const;
      case 'created':
        return {
          cardBg: 'bg-slate-900/40',
          cardBorder: 'border-blue-500/20',
          heading: 'text-slate-100',
          sub: 'text-slate-300',
          label: 'text-slate-300',
          muted: 'text-slate-400',
          divider: 'border-blue-500/20',
        } as const;
      case 'failed':
      case 'cancelled':
        return {
          cardBg: 'bg-red-900/30',
          cardBorder: 'border-red-500/20',
          heading: 'text-red-100',
          sub: 'text-red-300',
          label: 'text-red-300',
          muted: 'text-red-400',
          divider: 'border-red-500/20',
        } as const;
      default:
        return {
          cardBg: 'bg-purple-900/30',
          cardBorder: 'border-purple-500/20',
          heading: 'text-purple-100',
          sub: 'text-purple-300',
          label: 'text-purple-300',
          muted: 'text-purple-400',
          divider: 'border-purple-500/20',
        } as const;
    }
  })();

  const palette = isWhite
    ? {
        cardBg: 'bg-gray-50',
        cardBorder: 'border-gray-200',
        heading: 'text-gray-900',
        sub: 'text-gray-600',
        label: 'text-gray-600',
        muted: 'text-gray-500',
        divider: 'border-gray-200',
      }
    : darkPalette;

  const recipientDivider = isWhite ? 'border-gray-200' : 'border-white/10';
  const recipientHover = isWhite ? 'hover:bg-gray-100' : 'hover:bg-white/10';
  const isScheduledStatus = payroll.status === 'scheduled';
  const secondaryTextClass = isWhite ? 'text-gray-600' : isScheduledStatus ? 'text-white' : 'text-white/80';
  const mutedTextClass = isWhite ? 'text-gray-500' : isScheduledStatus ? 'text-white' : 'text-white/70';
  const subtleTextClass = isWhite ? 'text-gray-400' : isScheduledStatus ? 'text-gray-300' : 'text-gray-400';

  const mainAmountColor = (() => {
    if (isWhite) return '#1f2937'; // gray-900
    switch (payroll.status) {
      case 'completed':
        return '#00e476';
      case 'signed':
      case 'scheduled':
        return '#a855f7';
      case 'processing':
        return '#fb923c';
      case 'cancelled':
      case 'failed':
        return 'rgb(248 113 113 / var(--tw-text-opacity, 1))';
      default:
        return '#439eef';
    }
  })();

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
      className={`rounded-lg h-full flex flex-col ${isWhite ? '' : ''}`}
      style={{ backgroundColor: isWhite ? 'transparent' : statusBgColor }}
    >
      {/* Fixed Header */}
      <div className={`p-8 pb-4 border-b ${isWhite ? 'border-gray-200' : 'border-white/10'}`}>
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
              <h3 className={`text-xl font-semibold ${isWhite ? 'text-gray-900' : 'text-white'}`}>{payroll.name}</h3>
              <Badge
                variant="outline"
                className={`text-xs ${
                  payroll.status === 'cancelled' || payroll.status === 'failed'
                    ? 'border-red-500/50 text-red-400 bg-red-500/10'
                    : payroll.status === 'processing'
                    ? 'border-orange-500/50 text-orange-400 bg-orange-500/10'
                    : payroll.status === 'completed'
                    ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                    : payroll.status === 'scheduled'
                    ? 'border-purple-500/50 text-purple-200 bg-purple-500/10'
                    : payroll.status === 'signed'
                    ? 'border-purple-500/50 text-purple-200 bg-purple-500/10'
                    : 'border-gray-500/40 text-gray-300 bg-gray-500/10'
                }`}
              >
                {payroll.status === 'completed'
                  ? 'Success'
                  : payroll.status === 'created'
                  ? 'Created'
                  : payroll.status === 'scheduled'
                  ? 'Scheduled'
                  : payroll.status}
              </Badge>
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
            <div className={`text-sm space-y-1 ${isWhite ? 'text-gray-600' : 'text-gray-200'}`}>
              {[
                { label: 'Created On', value: payroll.createdAt && formatDateTime(payroll.createdAt), show: payroll.status === 'created' },
                { label: 'Scheduled For', value: formatDateTime(payroll.scheduledFor), show: true },
                { label: 'Executed', value: payroll.executedAt && formatDateTime(payroll.executedAt), show: !!payroll.executedAt },
                { label: payroll.status === 'cancelled' ? 'Cancelled On' : 'Failed On', value: payroll.updatedAt && formatDateTime(payroll.updatedAt), show: payroll.status === 'cancelled' || payroll.status === 'failed' },
              ]
                .filter(item => item.show && item.value)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="text-white/70">{item.label}</span>
                    <span className="text-white">{item.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {payroll.note && (
              <StickyNote value={payroll.note} tone={isWhite ? 'light' : 'dark'} disabled />
            )}

            {/* Payroll Summary */}
            <div className={`rounded-lg border transition-all duration-700 ease-in-out ${palette.cardBg} ${palette.cardBorder} p-6 space-y-6`}>
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: mainAmountColor }}>
                  ${grandTotalUsd.toFixed(2)}
                </p>
                <p className="text-white text-xl">
                  {grandTotalEth.toFixed(6)} ETH
                </p>
              </div>

              <div className={`grid gap-3 text-sm border-t ${palette.divider} pt-4`}>
                <div className="flex justify-between">
                  <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Subtotal</span>
                  <span className="text-white">{totalAmount.toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Platform Fee (0.5%)</span>
                  <span className="text-white">{appFeeEth.toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Network Fee (est.)</span>
                  <span className="text-white">{networkFeeEth.toFixed(3)} ETH</span>
                </div>
              </div>
            </div>

            {/* Scheduled & Signed Info */}
            <div className={`space-y-2 text-sm px-6 ${secondaryTextClass}`}>
              <div className="flex justify-between">
                <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Scheduled For</span>
                <span className="text-white">{formatDateTime(payroll.scheduledFor)}</span>
              </div>
              {payroll.signedAt && (
                <div className="flex justify-between">
                  <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Signed On</span>
                  <span className="text-white">{formatDateTime(payroll.signedAt)}</span>
                </div>
              )}
              {payroll.executedAt && (
                <div className="flex justify-between">
                  <span className={isScheduledStatus ? 'text-white' : 'text-white/70'}>Executed</span>
                  <span className="text-white">{formatDateTime(payroll.executedAt)}</span>
                </div>
              )}
            </div>

            <Separator className={`transition-colors duration-700 ease-in-out ${isWhite ? 'bg-gray-200' : 'bg-white/10'}`} />

            {/* Recipients */}
            <div className="space-y-2 px-6">
              <p className={`text-[11px] uppercase tracking-wide font-semibold mb-4 ${isScheduledStatus ? 'text-white' : (isWhite ? 'text-gray-500' : 'text-white/80')}`}>
                Recipients ({payroll.recipients.length})
              </p>
              <div className="space-y-3">
                {payroll.recipients.map((recipient, index) => {
                  const recipientAmount = parseFloat(recipient.amount || '0');
                  const recipientAmountUSD = recipientAmount * 3243.0;
                  
                  // Find transaction by transactionId (could be hash or database ID)
                  const transaction = recipient.transactionId 
                    ? transactions?.find(tx => 
                        tx.hash === recipient.transactionId || 
                        tx.id === recipient.transactionId
                      )
                    : null;

                  const isSelected = !!(selectedTransaction && (
                    (selectedTransaction.hash === recipient.transactionId) ||
                    (selectedTransaction.id === recipient.transactionId)
                  ));

                  const isOpen = !!(isSelected && transaction);

                  return (
                    <Sheet 
                      key={recipient.id} 
                      open={isOpen}
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedTransaction(null);
                        } else if (open && transaction) {
                          setSelectedTransaction({ hash: transaction.hash, id: transaction.id });
                        }
                      }}
                    >
                      <div 
                        className={`flex items-center justify-between gap-3 text-sm py-2 border-b last:border-b-0 ${transaction ? recipientHover : ''} ${recipientDivider}`}
                        onClick={() => {
                          if (transaction) {
                            setSelectedTransaction({ hash: transaction.hash, id: transaction.id });
                          } else if (recipient.transactionId) {
                            console.log('[PayrollDetailsDialog] Transaction not found:', {
                              transactionId: recipient.transactionId,
                              availableTransactions: transactions?.length || 0,
                            });
                            toast.info(`Transaction not found. ID: ${recipient.transactionId?.slice(0, 10)}...`);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`font-medium truncate ${isWhite ? 'text-gray-900' : 'text-white'}`}>
                                  {recipient.recipientName || `Recipient ${index + 1}`}
                                </p>
                                {recipient.recipientEmail && (
                                  <>
                                    <span className={`text-xs ${isWhite ? 'text-gray-400' : subtleTextClass}`}>•</span>
                                    <span className={`text-xs truncate ${isWhite ? 'text-gray-600' : subtleTextClass}`}>
                                      {recipient.recipientEmail}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <code className={`font-mono truncate max-w-[200px] ${isWhite ? 'text-gray-500' : isScheduledStatus ? 'text-white' : 'text-white/70'}`}>
                                  {recipient.recipientAddress}
                                </code>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 shrink-0 ${isWhite ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : isScheduledStatus ? 'text-white hover:text-white hover:bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCopyAddress(recipient.recipientAddress);
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`${isWhite ? 'text-gray-900' : isScheduledStatus ? 'text-white' : 'text-white'} text-lg font-semibold leading-tight`}>${recipientAmountUSD.toFixed(2)}</p>
                              <p className={`${isWhite ? 'text-gray-600' : mutedTextClass} text-xs`}>
                                {recipient.amount} ETH
                              </p>
                            </div>
                          </div>
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

