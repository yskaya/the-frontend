/**
 * Scheduled Payments API Client
 * Handles communication with the wallet service scheduled payments endpoints
 */

import { api } from '@/lib';
import type { ScheduledPayment, CreateScheduledPaymentDto } from './types';

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

