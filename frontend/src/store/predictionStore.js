import { create } from 'zustand';
import { predictionService } from '../api/services/prediction.js';

const CACHE_TTL = 60 * 1000; // 1 minute

export const usePredictionStore = create((set, get) => ({
  aiInsights: null,
  advancedPrediction: null,
  isLoadingInsights: false,
  isLoadingAdvanced: false,
  error: null,
  lastFetchedInsights: null,
  lastFetchedAdvanced: null,

  fetchAiInsights: async (force = false) => {
    const { aiInsights, lastFetchedInsights } = get();
    if (!force && aiInsights && lastFetchedInsights && (Date.now() - lastFetchedInsights < CACHE_TTL)) {
      return;
    }

    set({ isLoadingInsights: true, error: null });
    try {
      const data = await predictionService.getAiInsights();
      set({ aiInsights: data, lastFetchedInsights: Date.now(), isLoadingInsights: false });
    } catch (error) {
      set({ error: error.message, isLoadingInsights: false });
    }
  },

  fetchAdvancedPrediction: async (force = false) => {
    const { advancedPrediction, lastFetchedAdvanced } = get();
    if (!force && advancedPrediction && lastFetchedAdvanced && (Date.now() - lastFetchedAdvanced < CACHE_TTL)) {
      return;
    }

    set({ isLoadingAdvanced: true, error: null });
    try {
      const data = await predictionService.getAdvancedPrediction();
      set({ advancedPrediction: data, lastFetchedAdvanced: Date.now(), isLoadingAdvanced: false });
    } catch (error) {
      set({ error: error.message, isLoadingAdvanced: false });
    }
  }
}));
