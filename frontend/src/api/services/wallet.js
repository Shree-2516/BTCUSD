import { apiClient } from '../client.js';

export const walletService = {
  getWalletStatus: () => {
    return apiClient.get('/api/wallet');
  },

  getWalletHistory: () => {
    return apiClient.get('/api/wallet/history');
  },

  deposit: (amount, reason = 'Manual Adjustment') => {
    return apiClient.post('/api/wallet/deposit', { amount, reason });
  },

  withdraw: (amount, reason = 'Manual Adjustment') => {
    return apiClient.post('/api/wallet/withdraw', { amount, reason });
  },

  resetWallet: () => {
    return apiClient.post('/api/wallet/reset');
  }
};
