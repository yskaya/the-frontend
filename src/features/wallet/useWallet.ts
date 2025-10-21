import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getWallet,
  getTransactions,
  sendCrypto,
  createWallet,
  type SendTransactionRequest,
  type SendTransactionResponse,
  type CreateWalletResponse,
} from './wallet.api';
import { Wallet, Transaction } from './wallet.types';

/**
 * Get user's wallet with React Query caching + auto-refresh
 * Polls every 30 seconds to catch balance updates from incoming transactions
 */
export const useWallet = () => {
  return useQuery<Wallet | null>({
    queryKey: ['wallet'],
    queryFn: getWallet,
    staleTime: 1000 * 30, // Fresh for 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is hidden
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
};

/**
 * Create wallet mutation
 */
export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateWalletResponse, Error, void>({
    mutationFn: createWallet,
    onSuccess: (response) => {
      toast.success('Wallet created successfully!', {
        description: `Address: ${response.address.slice(0, 10)}...`,
      });
      
      // Invalidate wallet query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error) => {
      toast.error('Failed to create wallet', { description: error.message });
    },
  });
};

/**
 * Get wallet transactions with auto-refresh
 * Polls every 10 seconds to update pending → confirmed status
 */
export const useTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    staleTime: 1000 * 10, // Fresh for 10 seconds
    refetchInterval: 1000 * 10, // Auto-refresh every 10 seconds (faster for tx status updates)
    refetchIntervalInBackground: false, // Stop polling when tab is hidden
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
};

/**
 * Send crypto mutation
 */
export const useSendCrypto = () => {
  const queryClient = useQueryClient();
  
  return useMutation<SendTransactionResponse, Error, SendTransactionRequest>({
    mutationFn: sendCrypto,
    onSuccess: (response) => {
      toast.success('Transaction sent!', {
        description: `Sent ${response.amount} ETH to ${response.to.slice(0, 10)}...`,
      });
      
      // Invalidate wallet and transactions to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      toast.error('Failed to send transaction', { description: error.message });
    },
  });
};
