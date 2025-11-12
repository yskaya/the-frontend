/**
 * Payroll Payments API Client
 * Handles communication with the wallet service payroll payment endpoints
 */

import { walletApi } from '@/lib';
import type { PayrollPayment, CreatePayrollPaymentDto, Payroll, CreatePayrollDto } from './types';

// Use gateway URL (relative path) - the API client already has baseURL set
// Note: Gateway has global prefix '/api', so we should NOT include '/api' in the path
// NestJS will handle the global prefix automatically
const PAYROLL_PAYMENTS_BASE_PATH = '/wallet/payroll-payments';

/**
 * Create a new payroll payment
 */
export async function createPayrollPayment(
  data: CreatePayrollPaymentDto
): Promise<PayrollPayment> {
  const response = await walletApi.post<PayrollPayment>(PAYROLL_PAYMENTS_BASE_PATH, data);
  if (!response.data) {
    throw new Error('Failed to create payroll payment');
  }
  return response.data;
}

/**
 * Get all payroll payments for the current user
 */
export async function getPayrollPayments(): Promise<PayrollPayment[]> {
  const response = await walletApi.get<PayrollPayment[]>(PAYROLL_PAYMENTS_BASE_PATH);
  return response.data || [];
}

/**
 * Get a specific payroll payment by ID
 */
export async function getPayrollPayment(id: string): Promise<PayrollPayment> {
  const response = await walletApi.get<PayrollPayment>(`${PAYROLL_PAYMENTS_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Payroll payment not found');
  }
  return response.data;
}

/**
 * Cancel a payroll payment (only if pending)
 */
export async function cancelPayrollPayment(id: string): Promise<{ message: string }> {
  const response = await walletApi.delete<{ message: string }>(`${PAYROLL_PAYMENTS_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Failed to cancel payroll payment');
  }
  return response.data;
}

/**
 * Payroll API endpoints
 */
const PAYROLL_BASE_PATH = '/wallet/payrolls';

/**
 * Create a new payroll with multiple recipients
 */
export async function createPayroll(data: CreatePayrollDto): Promise<Payroll> {
  try {
    const response = await walletApi.post<Payroll>(PAYROLL_BASE_PATH, data);
    if (!response.data) {
      throw new Error('Failed to create payroll: No data in response');
    }
    return response.data;
  } catch (error: any) {
    console.error('createPayroll error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create payroll';
    throw new Error(errorMessage);
  }
}

/**
 * Get all payrolls for the current user
 */
export async function getPayrolls(): Promise<Payroll[]> {
  const response = await walletApi.get<Payroll[]>(PAYROLL_BASE_PATH);
  return response.data || [];
}

/**
 * Get a specific payroll by ID
 */
export async function getPayroll(id: string): Promise<Payroll> {
  const response = await walletApi.get<Payroll>(`${PAYROLL_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Payroll not found');
  }
  return response.data;
}

/**
 * Sign a payroll - moves from 'created' to 'signed' state
 */
export async function signPayroll(
  id: string,
  signature: string
): Promise<Payroll> {
  const response = await walletApi.post<Payroll>(`${PAYROLL_BASE_PATH}/${id}/sign`, {
    signature,
  });
  
  if (!response.data) {
    throw new Error(response.error || 'Failed to sign payroll');
  }
  
  return response.data;
}

/**
 * Cancel a payroll (only if scheduled)
 */
export async function cancelPayroll(id: string): Promise<{ message: string }> {
  const response = await walletApi.delete<{ message: string }>(`${PAYROLL_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Failed to cancel payroll');
  }
  return response.data;
}

/**
 * Delete a payroll (only if cancelled or failed)
 */
export async function deletePayroll(id: string): Promise<{ message: string }> {
  const response = await walletApi.delete<{ message: string }>(`${PAYROLL_BASE_PATH}/${id}`, { action: 'delete' });
  if (!response.data) {
    throw new Error('Failed to delete payroll');
  }
  return response.data;
}

