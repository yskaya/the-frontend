/**
 * Scheduled Payments API Client
 * Handles communication with the wallet service scheduled payments endpoints
 */

import { api } from '@/lib';
import type { ScheduledPayment, CreateScheduledPaymentDto, Payroll, CreatePayrollDto } from './types';

// Use gateway URL (relative path) - the API client already has baseURL set
// Note: Gateway has global prefix '/api', so we should NOT include '/api' in the path
// NestJS will handle the global prefix automatically
const BASE_PATH = '/wallet/scheduled-payments';

/**
 * Create a new scheduled payment
 */
export async function createScheduledPayment(
  data: CreateScheduledPaymentDto
): Promise<ScheduledPayment> {
  const response = await api.post<ScheduledPayment>(BASE_PATH, data);
  if (!response.data) {
    throw new Error('Failed to create scheduled payment');
  }
  return response.data;
}

/**
 * Get all scheduled payments for the current user
 */
export async function getScheduledPayments(): Promise<ScheduledPayment[]> {
  const response = await api.get<ScheduledPayment[]>(BASE_PATH);
  return response.data || [];
}

/**
 * Get a specific scheduled payment by ID
 */
export async function getScheduledPayment(id: string): Promise<ScheduledPayment> {
  const response = await api.get<ScheduledPayment>(`${BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Scheduled payment not found');
  }
  return response.data;
}

/**
 * Cancel a scheduled payment (only if pending)
 */
export async function cancelScheduledPayment(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`${BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Failed to cancel scheduled payment');
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
    const response = await api.post<Payroll>(PAYROLL_BASE_PATH, data);
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
  const response = await api.get<Payroll[]>(PAYROLL_BASE_PATH);
  return response.data || [];
}

/**
 * Get a specific payroll by ID
 */
export async function getPayroll(id: string): Promise<Payroll> {
  const response = await api.get<Payroll>(`${PAYROLL_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Payroll not found');
  }
  return response.data;
}

/**
 * Cancel a payroll (only if scheduled)
 */
export async function cancelPayroll(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`${PAYROLL_BASE_PATH}/${id}`);
  if (!response.data) {
    throw new Error('Failed to cancel payroll');
  }
  return response.data;
}

/**
 * Delete a payroll (only if cancelled or failed)
 */
export async function deletePayroll(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`${PAYROLL_BASE_PATH}/${id}`, { action: 'delete' });
  if (!response.data) {
    throw new Error('Failed to delete payroll');
  }
  return response.data;
}

