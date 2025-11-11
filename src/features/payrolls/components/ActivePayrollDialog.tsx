import { useState, useEffect } from 'react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent } from '@/ui/sheet';
import { Label } from '@/ui/label';
import { Separator } from '@/ui/separator';
import { StickyNote } from '@/ui/sticky-note';
import { useSignPayroll, useDeletePayroll } from '../hooks';
import { Payroll } from '../types';
import { Users, Calendar, RefreshCw, Rocket, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

interface SignPayrollDialogProps {
  payroll: Payroll;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivePayrollDialog({ payroll, open, onOpenChange }: SignPayrollDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInputs, setShowInputs] = useState(true);
  const [justSigned, setJustSigned] = useState(false);
  const [localSignature, setLocalSignature] = useState('');
  const [localSignedAt, setLocalSignedAt] = useState('');
  const signMutation = useSignPayroll();
  const deleteMutation = useDeletePayroll();

  // Reset state when payroll changes or modal opens
  useEffect(() => {
    if (open && payroll.status === 'created') {
      setShowInputs(true);
      setIsProcessing(false);
      setLocalSignedAt('');
    }
  }, [payroll.id, payroll.status, open]);

  const handleSign = async () => {
    try {
      setIsProcessing(true);

      const signatureValue = localSignature || payroll.signature || 'Signed via quick sign';
      const signedTimestamp = new Date().toISOString();

      // Store signature locally before API call
      setLocalSignature(signatureValue);
      setLocalSignedAt(signedTimestamp);
      
      await signMutation.mutateAsync({
        id: payroll.id,
        signature: signatureValue,
      });
      
      // Start transition immediately after API success
      // Fade out inputs and buttons
      setShowInputs(false);
      
      // After inputs fade out, change to signed state
      setTimeout(() => {
        setIsProcessing(false);
        setJustSigned(true);
      }, 700);
      
      toast.success('Payroll signed successfully! It will be executed at the scheduled time.');
    } catch (error) {
      setIsProcessing(false);
      setLocalSignature('');
      setLocalSignedAt('');
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payroll? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(payroll.id);
      onOpenChange(false);
      setLocalSignature('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCopyRecipientAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied');
  };

  const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
  const totalAmountUSD = totalAmount * 3243.0; // ETH price
  const networkFeeEth = totalAmount > 0 ? 0.002 : 0; // Placeholder flat fee
  const appFeeRate = 0.005; // 0.5%
  const appFeeEth = totalAmount * appFeeRate;
  const grandTotalEth = totalAmount + (totalAmount > 0 ? appFeeEth + networkFeeEth : 0);
  const grandTotalUsd = grandTotalEth * 3243.0;

  // Check if signed from payroll status OR local state (just signed)
  const isSigned = payroll.status === 'signed' || payroll.status === 'scheduled' || justSigned;
  const visualStatus = justSigned ? 'signed' : payroll.status;

  const cardPalette = (() => {
    switch (visualStatus) {
      case 'signed':
      case 'scheduled':
        return {
          bg: 'bg-purple-900/30',
          border: 'border-purple-500/20',
          heading: 'text-purple-100',
          sub: 'text-purple-300',
          label: 'text-purple-300',
          muted: 'text-purple-100',
          divider: 'border-purple-500/20',
          noteTone: 'dark' as const,
        };
      case 'completed':
        return {
          bg: 'bg-emerald-900/30',
          border: 'border-emerald-500/20',
          heading: 'text-emerald-100',
          sub: 'text-emerald-300',
          label: 'text-emerald-300',
          muted: 'text-emerald-400',
          divider: 'border-emerald-500/20',
          noteTone: 'dark' as const,
        };
      case 'processing':
        return {
          bg: 'bg-[rgba(80,50,5,0.45)]',
          border: 'border-[rgba(160,110,40,0.45)]',
          heading: 'text-amber-100',
          sub: 'text-amber-300',
          label: 'text-amber-200',
          muted: 'text-amber-300',
          divider: 'border-[rgba(160,110,40,0.45)]',
          noteTone: 'dark' as const,
        };
      case 'failed':
      case 'cancelled':
        return {
          bg: 'bg-red-900/30',
          border: 'border-red-500/20',
          heading: 'text-red-100',
          sub: 'text-red-300',
          label: 'text-red-300',
          muted: 'text-red-400',
          divider: 'border-red-500/20',
          noteTone: 'dark' as const,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          heading: 'text-gray-900',
          sub: 'text-gray-600',
          label: 'text-gray-600',
          muted: 'text-gray-500',
          divider: 'border-gray-200',
          noteTone: 'light' as const,
        };
    }
  })();

  const summaryLabelClass = isSigned ? 'text-white/70' : cardPalette.label;
  const summaryValueClass = isSigned ? 'text-white' : cardPalette.muted;
  const infoLabelClass = isSigned ? 'text-white/70' : cardPalette.label;
  const infoValueClass = isSigned ? 'text-white' : cardPalette.muted;
  const signedTimestamp = localSignedAt || payroll.signedAt || null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={`w-full max-w-[600px] mx-auto h-full max-h-screen overflow-hidden border-0 p-0 transition-all duration-700 ease-in-out ${
          isSigned ? 'bg-[#2D1B4E]' : 'bg-white'
        }`}
      >
        <div className="rounded-lg h-full flex flex-col">
          {/* Fixed Header */}
        <div className={`p-8 pb-4 border-b transition-colors duration-700 ease-in-out ${isSigned ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              {/* Icon: Grey for unsigned, Purple rocket for signed - with smooth cross-fade */}
              <div className="relative w-14 h-14 shrink-0">
                {/* Grey document icon - fades out */}
                <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-gray-500 transition-all duration-700 ease-in-out ${
                  isSigned 
                    ? 'opacity-0 scale-75' 
                    : 'opacity-100 scale-100'
                }`}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                
                {/* Purple rocket icon - fades in */}
                <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-purple-500 transition-all duration-700 ease-in-out ${
                  isSigned 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-75'
                }`}>
                  <Rocket className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-1 transition-colors duration-700 ease-in-out ${isSigned ? 'text-white' : 'text-gray-900'}`}>
                  {payroll.name || 'Scheduled Payroll'}
                </h3>
                <div className={`text-sm transition-colors duration-700 ease-in-out ${isSigned ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isSigned
                    ? `Scheduled for ${formatDateTime(payroll.scheduledFor)}`
                    : 'Review and sign this payroll to authorize its execution'
                  }
                </div>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {payroll.note && (
              <StickyNote
                value={payroll.note}
                tone={cardPalette.noteTone}
                disabled
              />
            )}

            {/* Summary */}
            <div className={`rounded-lg border transition-all duration-700 ease-in-out ${cardPalette.bg} ${cardPalette.border} p-6 space-y-6`}>
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: '#a855f7' }}>
                  ${grandTotalUsd.toFixed(2)}
                </p>
                <p className={isSigned ? 'text-white text-xl' : 'text-gray-500 text-xl'}>
                  {grandTotalEth.toFixed(6)} ETH
                </p>
              </div>

              <div className={`grid gap-3 text-sm border-t ${cardPalette.divider} pt-4`}>
                <div className="flex justify-between">
                  <span className={summaryLabelClass}>Subtotal</span>
                  <span className={summaryValueClass}>{totalAmount.toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className={summaryLabelClass}>Platform Fee (0.5%)</span>
                  <span className={summaryValueClass}>{appFeeEth.toFixed(3)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className={summaryLabelClass}>Network Fee (est.)</span>
                  <span className={summaryValueClass}>{networkFeeEth.toFixed(3)} ETH</span>
                </div>
              </div>
            </div>

            {/* Scheduled & Signed Info */}
            <div className="space-y-2 text-sm px-6">
              <div className="flex justify-between">
                <span className={infoLabelClass}>Scheduled For</span>
                <span className={infoValueClass}>{formatDateTime(payroll.scheduledFor)}</span>
              </div>
              {isSigned && signedTimestamp && (
                <div className="flex justify-between">
                  <span className={infoLabelClass}>Signed On</span>
                  <span className={infoValueClass}>{formatDateTime(signedTimestamp)}</span>
                </div>
              )}
            </div>
 
            <Separator className={`transition-colors duration-700 ease-in-out ${isSigned ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Recipients List */}
            <div className="space-y-2 px-6">
              <Label
                htmlFor="recipients"
                className={`text-[11px] uppercase tracking-wide font-semibold transition-colors duration-700 ease-in-out mb-4 ${
                  isSigned ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                Recipients ({payroll.recipients.length})
              </Label>
              <div className="space-y-3">
                {payroll.recipients.map((recipient, index) => {
                  const usdValue = (parseFloat(recipient.amount) * 3243.0).toFixed(2);
                  return (
                    <div key={index} className="text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`font-medium truncate ${isSigned ? 'text-white' : 'text-gray-900'}`}>
                              {recipient.recipientName || `Recipient ${index + 1}`}
                            </p>
                            {recipient.recipientEmail && (
                              <>
                                <span className={`text-xs ${isSigned ? 'text-gray-400' : 'text-gray-400'}`}>•</span>
                                <span className={`text-xs truncate ${isSigned ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {recipient.recipientEmail}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <code className={`font-mono truncate max-w-[200px] ${isSigned ? 'text-gray-300' : 'text-gray-500'}`}>
                              {recipient.recipientAddress}
                            </code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 shrink-0 ${isSigned ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700'}`}
                              onClick={() => handleCopyRecipientAddress(recipient.recipientAddress)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-semibold leading-tight ${isSigned ? 'text-white' : 'text-gray-900'}`}>{recipient.amount} ETH</p>
                          <p className={`text-xs ${isSigned ? 'text-gray-300' : 'text-gray-600'}`}>≈ ${usdValue}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
 
            <Separator className={`transition-colors duration-700 ease-in-out ${isSigned ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Action Buttons - Only show for unsigned */}
            {!isSigned && (
              <div
                className={`space-y-3 transition-all duration-700 ease-in-out ${
                  !showInputs ? 'opacity-0 h-0 overflow-hidden scale-95' : 'opacity-100 h-auto scale-100'
                }`}
              >
                <Button
                  type="button"
                  onClick={handleSign}
                  disabled={isProcessing || deleteMutation.isPending}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Signing...' : 'Sign Payroll'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full h-12 rounded-2xl border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isProcessing || deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Cancelling...' : 'Cancel'}
                </Button>
              </div>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="text-center transition-all duration-300 animate-in fade-in">
                <div className={`inline-flex items-center gap-2 ${isSigned ? 'text-white' : 'text-purple-600'}`}>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Signing payroll...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

