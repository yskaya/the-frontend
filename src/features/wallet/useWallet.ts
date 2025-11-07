import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import {
  getWallet,
  getWalletWithTransactions,
  getTransactions,
  sendCrypto,
  createWallet,
  syncTransactions,
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

  // Check if there are pending transactions or processing scheduled payments
  useEffect(() => {
    const checkPending = () => {
      const transactions = queryClient.getQueryData<Transaction[]>(['transactions']);
      const scheduledPayments = queryClient.getQueryData<any[]>(['scheduled-payments']);
      
      // Check for pending transactions (transactions only have 'pending', 'completed', or 'failed' status)
      const hasPendingTx = transactions?.some(tx => 
        tx.status === 'pending'
      );
      
      // Check for processing scheduled payments (payrolls)
      const hasProcessingPayroll = scheduledPayments?.some(p => 
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
 * Get wallet transactions with smart polling and window visibility
 * OPTIMIZED: Disables automatic polling since wallet hook already includes transactions
 * via getWalletWithTransactions. Only fetches on manual refresh or window focus.
 * - No automatic polling (wallet hook handles it via combined endpoint)
 * - Refetches on window focus
 * - Manual refresh available
 */
export const useTransactions = () => {
  const queryClient = useQueryClient();
  const isVisible = useWindowVisibility();
  const hasRefetchedOnFocus = useRef(false);

  // Refetch immediately when window becomes visible
  useEffect(() => {
    if (isVisible && !hasRefetchedOnFocus.current) {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] }); // Also refresh wallet
      hasRefetchedOnFocus.current = true;
    }
    
    if (!isVisible) {
      hasRefetchedOnFocus.current = false;
    }
  }, [isVisible, queryClient]);

  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    staleTime: 1000 * 30, // Increased from 10s to 30s to reduce refetches
    // OPTIMIZED: No automatic polling - wallet hook already polls with transactions
    // This prevents duplicate requests. Wallet uses getWalletWithTransactions which
    // updates the transactions cache automatically.
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
};

/**
 * Manual refresh transactions
 */
export const useRefreshTransactions = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    toast.success('Transactions refreshed');
  };
};

/**
 * Sync transactions from blockchain (fetches missing transactions)
 */
export const useSyncTransactions = () => {
  const queryClient = useQueryClient();
  const userId = typeof document !== 'undefined' ? (() => {
    const cookies = document.cookie;
    const userIdMatch = cookies.match(/user_id=([^;]+)/);
    return userIdMatch ? userIdMatch[1] : undefined;
  })() : undefined;
  
  return useMutation<{ message: string; newTransactions: number; newIncoming?: number; newOutgoing?: number }, Error, void>({
    mutationFn: () => syncTransactions(userId),
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      if (data.newTransactions > 0) {
        toast.success(`Synced ${data.newTransactions} new transaction${data.newTransactions !== 1 ? 's' : ''} from blockchain`);
      } else {
        toast.info('No new transactions found. All transactions are already synced.');
      }
    },
    onError: (error) => {
      // Handle rate limit errors specifically
      if (error.message.includes('Rate limit') || error.message.includes('rate limit') || error.message.includes('too many requests')) {
        toast.error('Rate limit exceeded', { 
          description: 'Please wait a moment and try again.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to sync transactions', { description: error.message });
      }
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
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
    },
    onError: (error) => {
      toast.error('Failed to send transaction', { description: error.message });
    },
  });
};
