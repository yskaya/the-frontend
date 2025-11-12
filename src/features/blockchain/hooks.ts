import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import {
  getWalletWithTransactions,
  sendCrypto,
  createWallet,
  type SendTransactionRequest,
  type SendTransactionResponse,
  type CreateWalletResponse,
  getTransactions,
  syncTransactions,
} from './api';
import type { Wallet, Transaction } from './types';

type UseWalletQueryOptions = {
  enabled?: boolean;
};

/**
 * Wallet Hooks
 */

export const useWalletQuery = (userId?: string, options: UseWalletQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const isVisible = useWindowVisibility();

  return useQuery<Wallet | null>({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      const result = await getWalletWithTransactions(userId);

      if (result.transactions.length > 0) {
        queryClient.setQueryData<Transaction[]>(['transactions'], result.transactions);
      }

      return result.wallet;
    },
    staleTime: 1000 * 60,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: () => {
      if (!isVisible) return false;
      return 1000 * 60;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    enabled: options.enabled ?? true,
  });
};

export const useRefreshWallet = (userId?: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
    toast.success('Wallet refreshed');
  };
};

export const useCreateWallet = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<CreateWalletResponse, Error, void>({
    mutationFn: () => createWallet(userId),
    onSuccess: (response) => {
      toast.success('Wallet created successfully!', {
        description: `Address: ${response.address.slice(0, 10)}...`,
      });

      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
    },
    onError: (error) => {
      toast.error('Failed to create wallet', { description: error.message });
    },
  });
};

export const useSendCrypto = () => {
  const queryClient = useQueryClient();

  return useMutation<SendTransactionResponse, Error, SendTransactionRequest>({
    mutationFn: sendCrypto,
    onSuccess: (response) => {
      toast.success('Transaction sent!', {
        description: `Sent ${response.amount} ETH to ${response.to.slice(0, 10)}...`,
      });

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
    },
    onError: (error) => {
      toast.error('Failed to send transaction', { description: error.message });
    },
  });
};

/**
 * Transaction Hooks
 */

type UseTransactionsQueryOptions = {
  enabled?: boolean;
};

export const useTransactionsQuery = (options: UseTransactionsQueryOptions = {}) => {
  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    staleTime: 1000 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    enabled: options.enabled ?? true,
  });
};

export const useRefreshTransactions = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    toast.success('Transactions refreshed');
  };
};

export const useSyncTransactions = () => {
  const queryClient = useQueryClient();
  const userId =
    typeof document !== 'undefined'
      ? (() => {
          const cookies = document.cookie;
          const userIdMatch = cookies.match(/user_id=([^;]+)/);
          return userIdMatch ? userIdMatch[1] : undefined;
        })()
      : undefined;

  return useMutation<
    { message: string; newTransactions: number; newIncoming?: number; newOutgoing?: number },
    Error,
    void
  >({
    mutationFn: () => syncTransactions(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' });
      if (data.newTransactions > 0) {
        toast.success(
          `Synced ${data.newTransactions} new transaction${data.newTransactions !== 1 ? 's' : ''} from blockchain`,
        );
      } else {
        toast.info('No new transactions found. All transactions are already synced.');
      }
    },
    onError: (error) => {
      if (
        error.message.includes('Rate limit') ||
        error.message.includes('rate limit') ||
        error.message.includes('too many requests')
      ) {
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

