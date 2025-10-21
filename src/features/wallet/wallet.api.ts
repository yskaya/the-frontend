import { Wallet, Transaction } from './wallet.types';

const WALLET_API_BASE = 'http://localhost:5006/api';

// Helper to get user ID from cookie
const getUserId = (): string => {
  if (typeof document === 'undefined') return 'test-user-1'; // Server-side fallback
  const cookies = document.cookie;
  const userIdMatch = cookies.match(/user_id=([^;]+)/);
  return userIdMatch ? userIdMatch[1] : 'test-user-1'; // Fallback for testing
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
export const createWallet = async (): Promise<CreateWalletResponse> => {
  const response = await fetch(`${WALLET_API_BASE}/wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
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
export const getWallet = async (): Promise<Wallet | null> => {
  try {
    const response = await fetch(`${WALLET_API_BASE}/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
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
      nonce: tx.nonce.toString(),
      labels: [],
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
