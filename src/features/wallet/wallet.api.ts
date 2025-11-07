import { Wallet, Transaction } from './wallet.types';

// Use gateway URL - gateway already has /api prefix
// For direct fetch calls, use gateway URL with /api prefix (if not already present)
const getApiBase = () => {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
  // Remove trailing slash if present
  apiUrl = apiUrl.replace(/\/$/, '');
  // Add /api only if not already present
  return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
};
const WALLET_API_BASE = getApiBase();

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
      credentials: 'include', // Include cookies for authentication
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
      credentials: 'include', // Include cookies for authentication
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
 * Get wallet with balance and transactions in one call (optimized for polling)
 */
export const getWalletWithTransactions = async (
  userId?: string,
  limit: number = 50
): Promise<{ wallet: Wallet | null; transactions: Transaction[] }> => {
  try {
    const userIdToUse = userId || getUserId();
    console.log('[getWalletWithTransactions] Using user ID:', userIdToUse);
    
    const response = await fetch(`${WALLET_API_BASE}/wallet/with-transactions?limit=${limit}`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userIdToUse,
      },
    });

    if (!response.ok) {
      return { wallet: null, transactions: [] };
    }

    const data = await response.json();
    
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
        // Scheduled payment fields
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
      credentials: 'include', // Include cookies for authentication
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
        // Scheduled payment fields
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
};

/**
 * Sync transactions from blockchain (fetches missing transactions)
 */
export const syncTransactions = async (userId?: string): Promise<{ message: string; newTransactions: number; newIncoming?: number; newOutgoing?: number }> => {
  const userIdToUse = userId || getUserId();
  
  const response = await fetch(`${WALLET_API_BASE}/wallet/sync-incoming`, {
    method: 'POST',
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userIdToUse,
    },
  });

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = 'Failed to sync transactions';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    // Check for rate limit
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Send crypto transaction
 */
export const sendCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  const response = await fetch(`${WALLET_API_BASE}/wallet/send`, {
    method: 'POST',
    credentials: 'include', // Include cookies for authentication
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
