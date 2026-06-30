import { apiClient } from '../client.js';

export const dashboardService = {
  /**
   * Get price history data for charts
   */
  getHistory: (symbol = 'BTCUSD', resolution = '1h') => {
    return apiClient.get(`/api/history?symbol=${symbol}&resolution=${resolution}`);
  },

  /**
   * Get high-level market insights (fear/greed, ROI, etc.)
   */
  getInsights: () => {
    return apiClient.get('/api/insights');
  }
};
