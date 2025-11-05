'use client';

import { SchedulePaymentForm, ScheduledPaymentsList, PayrollDialog } from '@/features/scheduled-payments';

export default function ScheduledPaymentsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Scheduled Payments</h1>
          <p className="text-muted-foreground">
            Schedule ETH payments to be sent automatically at a future date and time
          </p>
        </div>
        <PayrollDialog />
      </div>

      <div className="grid grid-cols-1  gap-8">
        <ScheduledPaymentsList />
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How it works</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✅ Schedule payments to be sent automatically at a future date and time</li>
          <li>✅ Payments are checked every minute and executed when due</li>
          <li>✅ You can cancel pending payments before they execute</li>
          <li>✅ Make sure you have sufficient balance when the payment executes</li>
          <li>⚠️ Failed payments (e.g., insufficient balance) will be marked as failed and won't retry</li>
        </ul>
      </div>
    </div>
  );
}

