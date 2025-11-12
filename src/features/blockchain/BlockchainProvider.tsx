import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Wallet, Transaction } from './types';
import { useWalletQuery, useTransactionsQuery } from './hooks';

interface QueryState<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
}

interface BlockchainContextValue {
  userId?: string;
  wallet: QueryState<Wallet | null | undefined>;
  transactions: QueryState<Transaction[] | undefined>;
}

interface BlockchainProviderProps {
  children: ReactNode;
  userId?: string;
}

const BlockchainContext = createContext<BlockchainContextValue | undefined>(undefined);

const normalizeError = (error: unknown): Error | null => {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Unknown error');
};

export const BlockchainProvider = ({ children, userId }: BlockchainProviderProps) => {
  const walletQuery = useWalletQuery(userId);
  const transactionsQuery = useTransactionsQuery();

  const value = useMemo<BlockchainContextValue>(
    () => ({
      userId,
      wallet: {
        data: walletQuery.data,
        isLoading: walletQuery.isLoading,
        error: normalizeError(walletQuery.error),
      },
      transactions: {
        data: transactionsQuery.data,
        isLoading: transactionsQuery.isLoading,
        error: normalizeError(transactionsQuery.error),
      },
    }),
    [
      userId,
      walletQuery.data,
      walletQuery.isLoading,
      walletQuery.error,
      transactionsQuery.data,
      transactionsQuery.isLoading,
      transactionsQuery.error,
    ],
  );

  return <BlockchainContext.Provider value={value}>{children}</BlockchainContext.Provider>;
};

export const useBlockchainContext = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchainContext must be used within a BlockchainProvider');
  }

  return context;
};

export const useWallet = (userId?: string) => {
  const context = useContext(BlockchainContext);
  const query = useWalletQuery(userId);

  if (!context || (typeof userId !== 'undefined' && context.userId !== userId)) {
    return {
      data: query.data,
      isLoading: query.isLoading,
      error: normalizeError(query.error),
    };
  }

  return context.wallet;
};

export const useTransactions = () => {
  const context = useContext(BlockchainContext);
  const query = useTransactionsQuery();

  if (!context) {
    return {
      data: query.data,
      isLoading: query.isLoading,
      error: normalizeError(query.error),
    };
  }

  return context.transactions;
};

