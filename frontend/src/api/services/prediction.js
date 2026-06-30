import { apiClient } from '../client.js';

export const predictionService = {
  getAiInsights: () => {
    return apiClient.get('/api/ai-insights');
  },

  /**
   * Note: This endpoint is mapped to /ai/advanced-prediction on the backend
   * rather than /api/. The vite proxy handles /ai requests.
   */
  getAdvancedPrediction: () => {
    return apiClient.get('/ai/advanced-prediction');
  }
};
