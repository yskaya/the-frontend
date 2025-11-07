/**
 * React Query hooks for Scheduled Payments
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import {
  createScheduledPayment,
  getScheduledPayments,
  getScheduledPayment,
  cancelScheduledPayment,
  createPayroll,
  getPayrolls,
  getPayroll,
  cancelPayroll,
  deletePayroll,
} from './api';
import type { CreateScheduledPaymentDto, ScheduledPayment, CreatePayrollDto, Payroll } from './types';

const QUERY_KEY = 'scheduled-payments';

/**
 * Get all scheduled payments with smart polling and window visibility
 * - Normal: 60 seconds
 * - Payroll due soon (within 1 min) or processing: 5 seconds
 * - Paused when window not active
 */
export function useScheduledPayments() {
  const queryClient = useQueryClient();
  const isVisible = useWindowVisibility();
  const [shouldPollFrequently, setShouldPollFrequently] = useState(false);
  const hasRefetchedOnFocus = useRef(false);

  const { data: payments, isLoading, error } = useQuery<ScheduledPayment[]>({
    queryKey: [QUERY_KEY],
    queryFn: getScheduledPayments,
    staleTime: 1000 * 45, // Increased from 30s to 45s to reduce unnecessary refetches
    // Smart polling: 10s if payroll due/processing (increased from 5s), 60s otherwise, but ONLY if window is visible
    refetchInterval: () => {
      // Stop polling if window is not visible
      if (!isVisible) return false;
      
      // Poll frequently if payroll due/processing (10s instead of 5s to reduce costs), otherwise normal speed
      return shouldPollFrequently ? 1000 * 10 : 1000 * 60;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // Check if any payroll is due soon or processing
  useEffect(() => {
    if (!payments) return;
    
    const now = new Date();
    const hasProcessing = payments.some(p => p.status === 'processing');
    const hasDueSoon = payments.some(p => {
      if (p.status === 'processing') return true;
      if (p.status !== 'pending') return false;
      
      const scheduledFor = new Date(p.scheduledFor);
      const timeUntilDue = scheduledFor.getTime() - now.getTime();
      // If due within 1 minute, poll frequently
      return timeUntilDue <= 60000 && timeUntilDue > 0;
    });
    
    // When a payroll moves to processing, immediately refresh wallet and transactions
    if (hasProcessing) {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
    
    setShouldPollFrequently(hasDueSoon || hasProcessing);
  }, [payments, queryClient]);

  // Refetch immediately when window becomes visible
  useEffect(() => {
    if (isVisible && !hasRefetchedOnFocus.current) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      hasRefetchedOnFocus.current = true;
    }
    
    if (!isVisible) {
      hasRefetchedOnFocus.current = false;
    }
  }, [isVisible, queryClient]);

  return {
    data: payments,
    isLoading,
    error,
  };
}

/**
 * Manual refresh scheduled payments
 */
export function useRefreshScheduledPayments() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success('Payrolls refreshed');
  };
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

/**
 * Payroll hooks
 */
const PAYROLL_QUERY_KEY = 'payrolls';

/**
 * Get all payrolls with smart polling
 */
export function usePayrolls() {
  const queryClient = useQueryClient();
  const isVisible = useWindowVisibility();
  const [shouldPollFrequently, setShouldPollFrequently] = useState(false);
  const hasRefetchedOnFocus = useRef(false);

  const { data: payrolls, isLoading, error, refetch } = useQuery<Payroll[]>({
    queryKey: [PAYROLL_QUERY_KEY],
    queryFn: getPayrolls,
    staleTime: 1000 * 60, // 60 seconds
    refetchInterval: () => {
      if (!isVisible) return false;
      // Poll every 60 seconds when should poll frequently, otherwise no polling
      return shouldPollFrequently ? 1000 * 60 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // Check if any payroll needs polling (1 min before execution until 10 mins after)
  useEffect(() => {
    if (!payrolls) return;
    
    const now = new Date();
    const hasActivePolling = payrolls.some(p => {
      if (p.status !== 'scheduled' && p.status !== 'processing') return false;
      
      const scheduledFor = new Date(p.scheduledFor);
      const timeUntilDue = scheduledFor.getTime() - now.getTime();
      const timeSinceDue = now.getTime() - scheduledFor.getTime();
      
      // Start polling 1 minute before execution
      const shouldStartPolling = timeUntilDue <= 60000 && timeUntilDue > 0;
      
      // Continue polling if processing or up to 10 minutes after scheduled time
      const shouldContinuePolling = p.status === 'processing' || (timeSinceDue >= 0 && timeSinceDue <= 600000);
      
      return shouldStartPolling || shouldContinuePolling;
    });
    
    // Refresh wallet/transactions when payroll is processing
    const hasProcessing = payrolls.some(p => p.status === 'processing');
    if (hasProcessing) {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
    
    setShouldPollFrequently(hasActivePolling);
  }, [payrolls, queryClient]);

  // Refetch immediately when window becomes visible
  useEffect(() => {
    if (isVisible && !hasRefetchedOnFocus.current) {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      hasRefetchedOnFocus.current = true;
    }
    
    if (!isVisible) {
      hasRefetchedOnFocus.current = false;
    }
  }, [isVisible, queryClient]);

  return {
    data: payrolls,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Create a new payroll
 */
export function useCreatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePayrollDto) => createPayroll(data),
    onSuccess: () => {
      // Invalidate both payrolls and scheduled payments queries
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Payroll created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create payroll', {
        description: error.message || 'An error occurred',
      });
    },
  });
}

/**
 * Get a specific payroll by ID
 */
export function usePayroll(id: string) {
  return useQuery<Payroll>({
    queryKey: [PAYROLL_QUERY_KEY, id],
    queryFn: () => getPayroll(id),
    enabled: !!id,
  });
}

/**
 * Cancel a payroll
 */
export function useCancelPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelPayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
      toast.success('Payroll cancelled');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel payroll', {
        description: error.message || 'An error occurred',
      });
    },
  });
}

/**
 * Delete a payroll
 */
export function useDeletePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
      toast.success('Payroll deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete payroll', {
        description: error.message || 'An error occurred',
      });
    },
  });
}

