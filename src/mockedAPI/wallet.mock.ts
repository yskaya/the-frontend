import { Wallet, Transaction } from '@/features/wallet/wallet.types';
import type { SendTransactionRequest, SendTransactionResponse } from '@/features/wallet/wallet.api';

/**
 * Mock wallet data
 * Simulates backend database
 */
const MOCK_WALLET: Wallet = {
  id: 'wallet-1',
  userId: 'user-1',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  balance: '3.847',
  balanceUSD: '12458.32',
  currency: 'ETH',
  network: 'ethereum-mainnet',
  createdAt: new Date().toISOString(),
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    walletId: 'wallet-1',
    type: 'receive',
    amount: '0.5',
    currency: 'ETH',
    address: '0x8f3d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d9a2b',
    timestamp: '2 hours ago',
    status: 'completed',
    usdValue: '1621.50',
    hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
    fee: '0.0021',
    gasPrice: '23.5',
    blockNumber: '18542891',
    confirmations: 142,
    fullDate: 'Oct 18, 2025 at 2:34 PM',
    nonce: '127',
    labels: ['Exchange', 'Deposit'],
  },
  {
    id: '2',
    walletId: 'wallet-1',
    type: 'send',
    amount: '1.2',
    currency: 'ETH',
    address: '0x7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f4d1e',
    timestamp: '5 hours ago',
    status: 'completed',
    usdValue: '3891.60',
    hash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g',
    fee: '0.0018',
    gasPrice: '21.2',
    blockNumber: '18542765',
    confirmations: 268,
    fullDate: 'Oct 18, 2025 at 11:15 AM',
    nonce: '126',
    labels: ['Payment'],
  },
  {
    id: '3',
    walletId: 'wallet-1',
    type: 'receive',
    amount: '2.1',
    currency: 'ETH',
    address: '0x9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c7c3a',
    timestamp: '1 day ago',
    status: 'completed',
    usdValue: '6811.35',
    hash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h',
    fee: '0.0024',
    gasPrice: '26.8',
    blockNumber: '18541234',
    confirmations: 1799,
    fullDate: 'Oct 17, 2025 at 3:22 PM',
    nonce: '125',
  },
];

/**
 * Get user's wallet
 */
export const getMockWallet = async (): Promise<Wallet | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...MOCK_WALLET };
};

/**
 * Get wallet transactions
 */
export const getMockTransactions = async (): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...MOCK_TRANSACTIONS];
};

/**
 * Send crypto transaction
 */
export const sendMockCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain delay
  
  const newTransaction: Transaction = {
    id: Date.now().toString(),
    walletId: MOCK_WALLET.id,
    type: 'send',
    amount: request.amount,
    currency: 'ETH',
    address: request.to,
    timestamp: 'Just now',
    status: 'pending',
    usdValue: (parseFloat(request.amount) * 3243.0).toFixed(2),
    hash: `0x${Date.now().toString(16)}${'a'.repeat(56)}`,
    fee: '0.0015',
    gasPrice: '19.5',
    blockNumber: '18543000',
    confirmations: 0,
    fullDate: new Date().toLocaleString(),
    nonce: '128',
  };
  
  MOCK_TRANSACTIONS.unshift(newTransaction);
  
  // Update wallet balance
  MOCK_WALLET.balance = (parseFloat(MOCK_WALLET.balance) - parseFloat(request.amount) - 0.0015).toFixed(4);
  MOCK_WALLET.balanceUSD = (parseFloat(MOCK_WALLET.balance) * 3243.0).toFixed(2);
  
  return {
    transactionId: newTransaction.id,
    txHash: newTransaction.hash,
    from: MOCK_WALLET.address,
    to: request.to,
    amount: request.amount,
    status: 'pending',
    nonce: parseInt(newTransaction.nonce),
  };
};

