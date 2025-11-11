import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import {
  getWallet,
  getWalletWithTransactions,
  sendCrypto,
  createWallet,
  type SendTransactionRequest,
  type SendTransactionResponse,
  type CreateWalletResponse,
} from './wallet.api';
import { Wallet, Transaction } from './wallet.types';

/**
 * Get user's wallet with smart polling and window visibility awareness
 * - Normal: 60 seconds
 * - After send (pending): 5 seconds
 * - Paused when window not active
 */
export const useWallet = (userId?: string) => {
  const queryClient = useQueryClient();
  const isVisible = useWindowVisibility();
  const [isPendingTransaction, setIsPendingTransaction] = useState(false);
  const hasRefetchedOnFocus = useRef(false);

  // Check if there are pending transactions or processing payroll payments
  useEffect(() => {
    const checkPending = () => {
      const transactions = queryClient.getQueryData<Transaction[]>(['transactions']);
      const payrollPayments = queryClient.getQueryData<any[]>(['payroll-payments']);
      
      // Check for pending transactions (transactions only have 'pending', 'completed', or 'failed' status)
      const hasPendingTx = transactions?.some(tx => 
        tx.status === 'pending'
      );
      
      // Check for processing payroll payments (payrolls)
      const hasProcessingPayroll = payrollPayments?.some(p => 
        p.status === 'processing'
      );
      
      setIsPendingTransaction(hasPendingTx || hasProcessingPayroll || false);
    };

    // Check immediately
    checkPending();
    
    // Check periodically
    const interval = setInterval(checkPending, 1000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Refetch immediately when window becomes visible
  useEffect(() => {
    if (isVisible && !hasRefetchedOnFocus.current) {
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
      hasRefetchedOnFocus.current = true;
    }
    
    if (!isVisible) {
      hasRefetchedOnFocus.current = false;
    }
  }, [isVisible, queryClient, userId]);

  return useQuery<Wallet | null>({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      // Use combined endpoint to fetch wallet + transactions in one call (optimizes polling)
      const result = await getWalletWithTransactions(userId);
      
      // Update transactions cache from the combined response
      if (result.transactions.length > 0) {
        queryClient.setQueryData<Transaction[]>(['transactions'], result.transactions);
      }
      
      return result.wallet;
    },
    staleTime: 1000 * 60, // 60 seconds
    // Poll every 60 seconds (1 minute) when window is visible
    refetchInterval: () => {
      // Stop polling if window is not visible
      if (!isVisible) return false;
      
      // Always poll every 60 seconds
      return 1000 * 60;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
};

/**
 * Manual refresh wallet
 */
export const useRefreshWallet = (userId?: string) => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
    toast.success('Wallet refreshed');
  };
};

/**
 * Create wallet mutation
 */
export const useCreateWallet = (userId?: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateWalletResponse, Error, void>({
    mutationFn: () => createWallet(userId),
    onSuccess: (response) => {
      toast.success('Wallet created successfully!', {
        description: `Address: ${response.address.slice(0, 10)}...`,
      });
      
      // Invalidate wallet query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
    },
    onError: (error) => {
      toast.error('Failed to create wallet', { description: error.message });
    },
  });
};

/**
 * Send crypto mutation with enhanced polling trigger
 */
export const useSendCrypto = () => {
  const queryClient = useQueryClient();
  
  return useMutation<SendTransactionResponse, Error, SendTransactionRequest>({
    mutationFn: sendCrypto,
    onSuccess: (response) => {
      toast.success('Transaction sent!', {
        description: `Sent ${response.amount} ETH to ${response.to.slice(0, 10)}...`,
      });
      
      // Invalidate and start aggressive polling
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
    },
    onError: (error) => {
      toast.error('Failed to send transaction', { description: error.message });
    },
  });
};
