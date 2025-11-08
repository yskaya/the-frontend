/**
 * Scheduled Payment Types
 * Phase 1: Single scheduled payments (one-time only)
 */

export type ScheduledPaymentStatus = 
  | 'pending'    // Waiting to be executed
  | 'processing' // Currently being executed
  | 'completed'  // Successfully executed
  | 'failed'     // Execution failed
  | 'cancelled'; // Cancelled by user

export interface ScheduledPayment {
  id: string;
  userId: string;
  recipientAddress: string;
  recipientName?: string;
  amount: string; // ETH amount as string
  scheduledFor: string; // ISO date string
  status: ScheduledPaymentStatus;
  note?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  executedAt?: string; // ISO date string
  transactionId?: string; // Links to Transaction if completed
  errorMessage?: string; // Error details if failed
}

export interface CreateScheduledPaymentDto {
  recipientAddress: string;
  recipientName?: string;
  amount: string;
  scheduledFor: Date | string;
  note?: string;
}

export interface ScheduledPaymentFormData {
  recipientAddress: string;
  recipientName?: string;
  amount: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  note?: string;
}

/**
 * Payroll Types (Batch payroll with multiple recipients)
 * 
 * State Flow:
 * created -> signed -> scheduled -> processing -> completed/failed/cancelled
 */
export type PayrollStatus = 
  | 'created'    // Just created, needs signature
  | 'signed'     // Signed by user, will auto-schedule
  | 'scheduled'  // Waiting to be executed
  | 'processing' // Currently being executed
  | 'completed'  // All recipients processed
  | 'failed'     // Payroll failed
  | 'cancelled'; // Cancelled by user or auto-cancelled if unsigned

export type PayrollRecipientStatus = 
  | 'pending'    // Waiting to be executed
  | 'processing' // Currently being executed
  | 'completed'  // Successfully executed
  | 'failed';    // Execution failed

export interface PayrollRecipient {
  id: string;
  payrollId: string;
  recipientAddress: string;
  recipientName?: string;
  recipientEmail?: string; // Email address of recipient
  amount: string; // ETH amount per recipient
  status: PayrollRecipientStatus;
  transactionId?: string; // Links to Transaction if completed
  errorMessage?: string; // Error details if failed
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  executedAt?: string; // ISO date string
}

export interface Payroll {
  id: string;
  userId: string;
  name: string; // Payroll name (e.g., "October 2025 Payroll")
  scheduledFor: string; // ISO date string
  status: PayrollStatus;
  signature?: string; // User's signature (stored as text)
  signedAt?: string; // ISO date string when signed
  signedBy?: string; // User ID who signed (for audit)
  note?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  executedAt?: string; // ISO date string
  recipients: PayrollRecipient[];
}

export interface CreatePayrollDto {
  name: string;
  scheduledFor: Date | string;
  note?: string;
  recipients: {
    recipientAddress: string;
    recipientName?: string;
    recipientEmail?: string;
    amount: string; // Amount per recipient
  }[];
}

export interface PayrollFormData {
  name: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  note?: string;
  recipients: {
    contactId: string;
    amount: string;
  }[];
}

