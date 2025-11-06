import { Loader2, Calendar, RefreshCw, Users, FileSignature, Rocket } from "lucide-react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { usePayrolls, useCancelPayroll } from "../hooks";
import { Payroll, PayrollRecipient } from "../types";
import { toast } from "sonner";
import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils";
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

export function PayrollsToSignPanel() {
  const { data: allPayrolls, isLoading, error, refetch } = usePayrolls();
  const cancelMutation = useCancelPayroll();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Get all scheduled payrolls (they will be shown but without sign button)
  const scheduledPayrolls = allPayrolls?.filter(
    (p) => p.status === 'scheduled'
  ) || [];

  // Add a dummy static payroll for demonstration (one example with signed status)
  const dummyPayroll: Payroll = {
    id: 'dummy-1',
    userId: 'dummy-user',
    name: 'October 2025 Payroll',
    scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: 'signed', // Signed status
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recipients: [
      {
        id: 'dummy-recipient-1',
        payrollId: 'dummy-1',
        recipientAddress: '0x1234567890123456789012345678901234567890',
        recipientName: 'John Doe',
        amount: '0.5',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dummy-recipient-2',
        payrollId: 'dummy-1',
        recipientAddress: '0x0987654321098765432109876543210987654321',
        recipientName: 'Jane Smith',
        amount: '0.3',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  // Combine scheduled payrolls with dummy (show both in same block)
  // Scheduled payrolls first, then signed (dummy) at the bottom
  const allPayrollsToSign = [...scheduledPayrolls, dummyPayroll];

  const handleSign = async (payroll: Payroll) => {
    // TODO: Implement sign/payroll execution logic
    toast.info(`Signing payroll: ${payroll.name}`);
    // This would trigger the payroll execution
    setSelectedPayroll(null);
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this payroll?')) {
      try {
        await cancelMutation.mutateAsync(id);
        toast.success('Payroll cancelled');
        setSelectedPayroll(null);
      } catch (error: any) {
        toast.error('Failed to cancel payroll', {
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
    <div className="payrolls-to-sign-panel-wrapper">
      <div className="payrolls-to-sign-panel-container">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h2 className="payrolls-to-sign-heading flex items-center gap-2">
            Pending Payrolls
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPayrolls}
              className="text-white hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </h2>
        </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
          <span className="ml-2 text-gray-400">Loading pending payrolls...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load payrolls</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!allPayrollsToSign || allPayrollsToSign.length === 0) && (
        <div className="placeholder">
          <p className="text-gray-400">No pending payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Scheduled payrolls will appear here</p>
        </div>
      )}

      {/* Payrolls to Sign List */}
      {!isLoading && !error && allPayrollsToSign && allPayrollsToSign.length > 0 && (
        <div className="payrolls-to-sign-list-container">
          {allPayrollsToSign.map((payroll) => {
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            
            return (
              <Sheet key={payroll.id} open={selectedPayroll?.id === payroll.id} onOpenChange={(open) => {
                if (!open) {
                  setSelectedPayroll(null);
                } else if (open && selectedPayroll?.id !== payroll.id) {
                  setSelectedPayroll(payroll);
                }
              }}>
                <SheetTrigger asChild>
                  <div className="payroll-item rounded-lg cursor-pointer">
                    {/* Icon - rocket for dummy (signed), no icon for scheduled (with sign button) */}
                    {payroll.id === 'dummy-1' && (
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
                    )}

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

                    {/* Sign Button - show only for scheduled payrolls (not dummy) */}
                    {payroll.id !== 'dummy-1' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayroll(payroll);
                        }}
                        className="ml-4 h-10 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg"
                      >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Sign
                      </Button>
                    )}
                  </div>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  noOverlay={true}
                  className="w-full sm:w-[500px] min-w-[300px] h-screen overflow-hidden bg-[rgba(20,0,35,0.95)] border-white/10 p-0 flex flex-col left-1/2 -translate-x-1/2 right-auto data-[state=open]:animate-zoom-in-0 data-[state=closed]:animate-zoom-out-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-right-0 origin-center"
                >
                  {selectedPayroll && (
                    <PayrollDetailsDialog 
                      payroll={selectedPayroll}
                      onSign={() => handleSign(selectedPayroll)}
                      onCancel={handleCancel}
                      isCancelling={cancelMutation.isPending}
                    />
                  )}
                </SheetContent>
              </Sheet>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

