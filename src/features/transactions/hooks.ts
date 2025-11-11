import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';
import { getTransactions, syncTransactions } from '@/features/wallet/wallet.api';
import type { Transaction } from '@/features/wallet';

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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      if (data.newTransactions > 0) {
        toast.success(
          `Synced ${data.newTransactions} new transaction${data.newTransactions !== 1 ? 's' : ''} from blockchain`,
        );
      } else {
        toast.info('No new transactions found. All transactions are already synced.');
      }
    },
    onError: (error) => {
      // Handle rate limit errors specifically
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


