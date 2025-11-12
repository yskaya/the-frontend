import { Wallet, Transaction } from './types';
import { api } from '@/lib';

// Helper to get user ID from cookie
const getUserId = (): string => {
  if (typeof document === 'undefined') return 'test-user-1'; // Server-side fallback
  const cookies = document.cookie;
  console.log('[getUserId] Available cookies:', cookies);
  const userIdMatch = cookies.match(/user_id=([^;]+)/);
  const userId = userIdMatch ? userIdMatch[1] : 'test-user-1'; // Fallback for testing
  console.log('[getUserId] Extracted user ID:', userId);
  return userId;
};

/**
 * Request/Response types (API-specific)
 */
export interface SendTransactionRequest {
  to: string;
  amount: string;
}

export interface SendTransactionResponse {
  transactionId: string;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: string;
  nonce: number;
}

export interface CreateWalletResponse {
  id: string;
  userId: string;
  address: string;
  balance: string;
  network: string;
  createdAt: string;
}

/**
 * Create a new wallet for the user
 */
export const createWallet = async (userId?: string): Promise<CreateWalletResponse> => {
  const userIdToUse = userId || getUserId();
  console.log('[createWallet] Using user ID:', userIdToUse);
  
  const response = await api.post<CreateWalletResponse>('/wallet');

  if (response.error || !response.data) {
    const errorMessage = response.error || 'Failed to create wallet';
    throw new Error(errorMessage);
  }

  return response.data;
};

/**
 * Get user's wallet with current balance
 */
export const getWallet = async (userId?: string): Promise<Wallet | null> => {
  try {
    const userIdToUse = userId || getUserId();
    console.log('[getWallet] Using user ID:', userIdToUse);
    
    const response = await api.get<any>('/wallet');

    if (response.error || !response.data) {
      return null;
    }

    const data = response.data;
    
    // If wallet doesn't exist, return null
    if (data.wallet === null || !data.address) {
      return null;
    }

    // Map backend response to frontend Wallet type
    return {
      id: data.id,
      userId: data.userId,
      address: data.address,
      balance: data.balance,
      balanceUSD: '0', // TODO: Calculate from balance
      currency: 'ETH',
      network: data.network || 'sepolia',
      createdAt: data.createdAt,
    };
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
};

const IN_FLIGHT_DEDUP_TTL_MS = 2000;

const walletWithTransactionsRequests = new Map<
  string,
  Promise<{ wallet: Wallet | null; transactions: Transaction[] }>
>();

const transactionsRequests = new Map<string, Promise<Transaction[]>>();

/**
 * Get wallet with balance and transactions in one call (optimized for polling)
 */
export const getWalletWithTransactions = async (
  userId?: string,
  limit: number = 50
): Promise<{ wallet: Wallet | null; transactions: Transaction[] }> => {
  const userIdToUse = userId || getUserId();
  const requestKey = `${userIdToUse}:${limit}`;

  const inFlight = walletWithTransactionsRequests.get(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      console.log('[getWalletWithTransactions] Using user ID:', userIdToUse);
      
      const response = await api.get<any>(`/wallet/with-transactions?limit=${limit}`);

      if (response.error || !response.data) {
        return { wallet: null, transactions: [] };
      }

      const data = response.data;
      
      // If wallet doesn't exist, return null
      if (!data.wallet || data.wallet === null) {
        return { wallet: null, transactions: [] };
      }

      // Map backend wallet response to frontend Wallet type
      const wallet: Wallet = {
        id: data.wallet.id,
        userId: data.wallet.userId,
        address: data.wallet.address,
        balance: data.wallet.balance,
        balanceUSD: '0', // TODO: Calculate from balance
        currency: 'ETH',
        network: data.wallet.network || 'sepolia',
        createdAt: data.wallet.createdAt,
      };

      // Map backend transactions to frontend Transaction type
      const ETH_PRICE = 3243.0; // ETH to USD conversion rate
      const transactions: Transaction[] = (data.transactions || []).map((tx: any) => {
        const amount = parseFloat(tx.amount || '0');
        const usdValue = (amount * ETH_PRICE).toFixed(2);
        
        return {
          id: tx.id,
          walletId: tx.walletId,
          type: tx.type,
          amount: tx.amount,
          currency: 'ETH',
          address: tx.type === 'send' ? tx.to : tx.from,
          timestamp: tx.createdAt,
          status: tx.status,
          usdValue: usdValue,
          hash: tx.txHash,
          fee: tx.gasUsed || '0',
          gasPrice: tx.gasPrice || '0',
          blockNumber: tx.blockNumber?.toString() || '0',
          confirmations: tx.status === 'completed' ? 1 : 0,
          fullDate: new Date(tx.createdAt).toLocaleString(),
          nonce: tx.nonce?.toString() || '',
          labels: [],
          // Payroll payment fields
          isScheduled: tx.isScheduled || false,
          scheduledFor: tx.scheduledFor,
          recipientName: tx.recipientName,
          note: tx.note,
        };
      });

      return { wallet, transactions };
    } catch (error) {
      console.error('Error fetching wallet with transactions:', error);
      return { wallet: null, transactions: [] };
    }
  })().finally(() => {
    setTimeout(() => {
      walletWithTransactionsRequests.delete(requestKey);
    }, IN_FLIGHT_DEDUP_TTL_MS);
  });

  walletWithTransactionsRequests.set(requestKey, request);
  return request;
};

/**
 * Get wallet transactions
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const userId = getUserId();
  const requestKey = userId;

  const inFlight = transactionsRequests.get(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      console.log('[getTransactions] Fetching for user:', userId);
      
      const response = await api.get<any[]>('/wallet/transactions');

      if (response.error || !response.data) {
        console.error('[getTransactions] Error:', response.error);
        return [];
      }

      const data = response.data;
      console.log('[getTransactions] Received transactions:', data.length);

      // Map backend transactions to frontend Transaction type
      const ETH_PRICE = 3243.0; // ETH to USD conversion rate
      const mapped = data.map((tx: any) => {
        const amount = parseFloat(tx.amount || '0');
        const usdValue = (amount * ETH_PRICE).toFixed(2);
        
        return {
          id: tx.id,
          walletId: tx.walletId,
          type: tx.type,
          amount: tx.amount,
          currency: 'ETH',
          address: tx.type === 'send' ? tx.to : tx.from,
          timestamp: tx.createdAt,
          status: tx.status,
          usdValue: usdValue,
          hash: tx.txHash,
          fee: tx.gasUsed || '0',
          gasPrice: tx.gasPrice || '0',
          blockNumber: tx.blockNumber?.toString() || '0',
          confirmations: tx.status === 'completed' ? 1 : 0,
          fullDate: new Date(tx.createdAt).toLocaleString(),
          nonce: tx.nonce?.toString() || '',
          labels: [],
          // Payroll payment fields
          isScheduled: tx.isScheduled || false,
          scheduledFor: tx.scheduledFor,
          recipientName: tx.recipientName,
          note: tx.note,
        };
      });
      
      console.log('[getTransactions] Mapped transactions:', mapped.length);
      return mapped;
    } catch (error) {
      console.error('[getTransactions] Error fetching transactions:', error);
      return [];
    }
  })().finally(() => {
    setTimeout(() => {
      transactionsRequests.delete(requestKey);
    }, IN_FLIGHT_DEDUP_TTL_MS);
  });

  transactionsRequests.set(requestKey, request);
  return request;
};

/**
 * Sync transactions from blockchain (fetches missing transactions)
 */
export const syncTransactions = async (userId?: string): Promise<{ message: string; newTransactions: number; newIncoming?: number; newOutgoing?: number }> => {
  const userIdToUse = userId || getUserId();
  
  const response = await api.post<{ message: string; newTransactions: number; newIncoming?: number; newOutgoing?: number }>('/wallet/sync-incoming');

  if (response.error || !response.data) {
    const errorMessage = response.error || 'Failed to sync transactions';
    throw new Error(errorMessage);
  }

  return response.data;
};

/**
 * Send crypto transaction
 * Now uses the unified API client for proper authentication handling
 */
export const sendCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  const response = await api.post<SendTransactionResponse>('/wallet/send', request);
  
  if (response.error || !response.data) {
    const errorMessage = response.error || 'Failed to send transaction';
    console.error('❌ Send transaction error:', errorMessage);
    throw new Error(errorMessage);
  }

  return response.data;
};
