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

