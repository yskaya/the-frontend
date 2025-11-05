/**
 * Shared Wallet & Transaction Types
 * Used across components, hooks, and API
 */

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  balance: string;
  balanceUSD: string;
  currency: string;
  network: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'send' | 'receive';
  amount: string;
  currency: string;
  address: string; // from/to address
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  usdValue: string;
  hash: string;
  fee: string;
  gasPrice: string;
  blockNumber: string;
  confirmations: number;
  fullDate: string;
  nonce: string;
  labels?: string[];
  // Scheduled payment fields
  isScheduled?: boolean;
  scheduledFor?: string;
  recipientName?: string;
  note?: string;
}
