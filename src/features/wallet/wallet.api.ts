import { Wallet, Transaction } from './wallet.types';

// Use environment variable with fallback
const WALLET_API_BASE = process.env.NEXT_PUBLIC_WALLET_API_URL || 'http://localhost:5006/api';

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
  
  const response = await fetch(`${WALLET_API_BASE}/wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userIdToUse,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create wallet');
  }

  return response.json();
};

/**
 * Get user's wallet with current balance
 */
export const getWallet = async (userId?: string): Promise<Wallet | null> => {
  try {
    const userIdToUse = userId || getUserId();
    console.log('[getWallet] Using user ID:', userIdToUse);
    
    const response = await fetch(`${WALLET_API_BASE}/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userIdToUse,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
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

/**
 * Get wallet transactions
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const userId = getUserId();
    console.log('[getTransactions] Fetching for user:', userId);
    
    const response = await fetch(`${WALLET_API_BASE}/wallet/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    console.log('[getTransactions] Response status:', response.status);

    if (!response.ok) {
      console.error('[getTransactions] Response not OK:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[getTransactions] Received transactions:', data.length);

    // Map backend transactions to frontend Transaction type
    const mapped = data.map((tx: any) => ({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      currency: 'ETH',
      address: tx.type === 'send' ? tx.to : tx.from,
      timestamp: tx.createdAt,
      status: tx.status,
      usdValue: '0', // TODO: Calculate
      hash: tx.txHash,
      fee: tx.gasUsed || '0',
      gasPrice: tx.gasPrice || '0',
      blockNumber: tx.blockNumber?.toString() || '0',
      confirmations: tx.status === 'completed' ? 1 : 0,
      fullDate: new Date(tx.createdAt).toLocaleString(),
      nonce: tx.nonce?.toString() || '',
      labels: [],
      // Scheduled payment fields
      isScheduled: tx.isScheduled || false,
      scheduledFor: tx.scheduledFor,
      recipientName: tx.recipientName,
      note: tx.note,
    }));
    
    console.log('[getTransactions] Mapped transactions:', mapped.length);
    return mapped;
  } catch (error) {
    console.error('[getTransactions] Error fetching transactions:', error);
    return [];
  }
};

/**
 * Send crypto transaction
 */
export const sendCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  const response = await fetch(`${WALLET_API_BASE}/wallet/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send transaction');
  }

  return response.json();
};
