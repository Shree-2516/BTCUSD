import { create } from 'zustand';
import { dashboardService } from '../api/services/dashboard.js';

// Cache TTLs
const HISTORY_CACHE_TTL = 60 * 1000; // 1 minute
const INSIGHTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useDashboardStore = create((set, get) => ({
  historyData: null,
  insightsData: null,
  isLoadingHistory: false,
  isLoadingInsights: false,
  historyError: null,
  insightsError: null,
  lastFetchedHistory: null,
  lastFetchedInsights: null,
  currentResolution: null,

  fetchHistory: async (symbol = 'BTCUSD', resolution = '1h', force = false) => {
    const { historyData, lastFetchedHistory, currentResolution } = get();
    
    // Force fetch if resolution changed
    const needsRefetch = force || (resolution !== currentResolution) || !historyData || !lastFetchedHistory || (Date.now() - lastFetchedHistory > HISTORY_CACHE_TTL);
    
    if (!needsRefetch) {
      return; // Return cached
    }

    set({ isLoadingHistory: true, historyError: null, currentResolution: resolution });
    try {
      const data = await dashboardService.getHistory(symbol, resolution);
      set({ historyData: data, lastFetchedHistory: Date.now(), isLoadingHistory: false });
    } catch (error) {
      set({ historyError: error.message, isLoadingHistory: false });
    }
  },

  fetchInsights: async (force = false) => {
    const { insightsData, lastFetchedInsights } = get();

    if (!force && insightsData && lastFetchedInsights && (Date.now() - lastFetchedInsights < INSIGHTS_CACHE_TTL)) {
      return; // Return cached
    }

    set({ isLoadingInsights: true, insightsError: null });
    try {
      const data = await dashboardService.getInsights();
      set({ insightsData: data, lastFetchedInsights: Date.now(), isLoadingInsights: false });
    } catch (error) {
      set({ insightsError: error.message, isLoadingInsights: false });
    }
  }
}));
