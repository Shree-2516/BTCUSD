import { apiClient } from '../client.js';

export const tradeService = {
  getActiveTrades: () => {
    return apiClient.get('/api/trade/active');
  },

  getTradeHistory: () => {
    return apiClient.get('/api/trade/history');
  },

  deleteTrade: (tradeId) => {
    return apiClient.delete(`/api/trade/${tradeId}`);
  },

  closeTrade: (tradeId) => {
    return apiClient.post(`/api/trade/${tradeId}/close`);
  }
};
