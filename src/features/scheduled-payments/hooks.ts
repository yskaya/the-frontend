/**
 * React Query hooks for Scheduled Payments
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createScheduledPayment,
  getScheduledPayments,
  getScheduledPayment,
  cancelScheduledPayment,
} from './api';
import type { CreateScheduledPaymentDto, ScheduledPayment } from './types';

const QUERY_KEY = 'scheduled-payments';

/**
 * Get all scheduled payments
 */
export function useScheduledPayments() {
  return useQuery<ScheduledPayment[]>({
    queryKey: [QUERY_KEY],
    queryFn: getScheduledPayments,
  });
}

/**
 * Get a specific scheduled payment
 */
export function useScheduledPayment(id: string) {
  return useQuery<ScheduledPayment>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getScheduledPayment(id),
    enabled: !!id,
  });
}

/**
 * Create a new scheduled payment
 */
export function useCreateScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduledPaymentDto) => createScheduledPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payment scheduled successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to schedule payment', {
        description: error.message || 'An error occurred',
      });
    },
  });
}

/**
 * Cancel a scheduled payment
 */
export function useCancelScheduledPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelScheduledPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Scheduled payment cancelled');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel payment', {
        description: error.message || 'An error occurred',
      });
    },
  });
}

