import { Loader2, Users, Rocket, FileText } from "lucide-react";
import { usePayrolls } from "../hooks";
import { Payroll } from "../types";
import { useState } from "react";
import { SignPayrollDialog } from "./SignPayrollDialog";

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
  const { data: allPayrolls, isLoading, error } = usePayrolls();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  // Get all CREATED, SIGNED, and SCHEDULED payrolls (active payrolls)
  // Created = needs signature (grey icon)
  // Signed = already signed, will auto-schedule (purple rocket icon)
  // Scheduled = scheduled to execute (purple rocket icon)
  const payrollsToSign = allPayrolls?.filter(
    (p) => p.status === 'created' || p.status === 'signed' || p.status === 'scheduled'
  ).sort((a, b) => {
    // Show created (needs action) before others
    if (a.status === 'created' && b.status !== 'created') return -1;
    if (a.status !== 'created' && b.status === 'created') return 1;
    // Within same status, sort by scheduled date
    return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
  }) || [];

  return (
    <div className="payrolls-to-sign-panel-wrapper">
      <div className="payrolls-to-sign-panel-container">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h2 className="payrolls-to-sign-heading flex items-center gap-2">
            Active Payrolls
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
      {!isLoading && !error && (!payrollsToSign || payrollsToSign.length === 0) && (
        <div className="placeholder">
          <p className="text-gray-400">No pending payrolls</p>
          <p className="text-gray-500 text-sm mt-1">Created payrolls will appear here</p>
        </div>
      )}

      {/* Payrolls to Sign List */}
      {!isLoading && !error && payrollsToSign && payrollsToSign.length > 0 && (
        <div className="payrolls-to-sign-list-container">
          {payrollsToSign.map((payroll) => {
            const totalAmount = payroll.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
            const isCreated = payroll.status === 'created';
            const isSigned = payroll.status === 'signed' || payroll.status === 'scheduled';
            
            return (
              <div 
                key={payroll.id} 
                className="payroll-item rounded-lg cursor-pointer"
                onClick={(e) => {
                  setSelectedPayroll(payroll);
                  setSignDialogOpen(true);
                }}
              >
                {/* Grey icon for unsigned payrolls */}
                {isCreated && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Rocket icon for signed/scheduled payrolls */}
                {isSigned && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 shrink-0">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Payroll Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white text-sm">
                      {payroll.name}
                    </p>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      {payroll.recipients.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {formatDateTime(payroll.scheduledFor)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${isSigned ? 'text-white' : 'text-black'}`}>
                    ${(totalAmount * 3243.0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalAmount.toFixed(6)} ETH
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sign Dialog */}
      {selectedPayroll && (
        <SignPayrollDialog
          payroll={selectedPayroll}
          open={signDialogOpen}
          onOpenChange={(open) => {
            setSignDialogOpen(open);
            if (!open) {
              setSelectedPayroll(null);
            }
          }}
        />
      )}
      </div>
    </div>
  );
}

