import { apiClient } from '../client.js';

export const newsService = {
  getLatestNews: (limit = 20) => {
    return apiClient.get(`/api/news/latest?limit=${limit}`);
  },

  getSentiment: () => {
    return apiClient.get('/api/news/sentiment');
  },

  getSignal: () => {
    return apiClient.get('/api/news/signal');
  },

  getHistory: (limit = 50) => {
    return apiClient.get(`/api/news/history?limit=${limit}`);
  }
};
