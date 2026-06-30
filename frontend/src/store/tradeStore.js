import { create } from 'zustand';
import { tradeService } from '../api/services/trade.js';

export const useTradeStore = create((set, get) => ({
  activeTrades: [],
  tradeHistory: [],
  isLoadingActive: false,
  isLoadingHistory: false,
  isMutating: false,
  error: null,
  lastFetchedActive: null,
  lastFetchedHistory: null,

  fetchActiveTrades: async (force = false) => {
    const { activeTrades, lastFetchedActive } = get();
    // Cache for 30 seconds
    if (!force && activeTrades.length > 0 && lastFetchedActive && (Date.now() - lastFetchedActive < 30000)) {
      return;
    }

    set({ isLoadingActive: true, error: null });
    try {
      const data = await tradeService.getActiveTrades();
      set({ activeTrades: data, lastFetchedActive: Date.now(), isLoadingActive: false });
    } catch (error) {
      set({ error: error.message, isLoadingActive: false });
    }
  },

  fetchTradeHistory: async (force = false) => {
    const { tradeHistory, lastFetchedHistory } = get();
    // Cache for 2 minutes
    if (!force && tradeHistory.length > 0 && lastFetchedHistory && (Date.now() - lastFetchedHistory < 120000)) {
      return;
    }

    set({ isLoadingHistory: true, error: null });
    try {
      const data = await tradeService.getTradeHistory();
      set({ tradeHistory: data, lastFetchedHistory: Date.now(), isLoadingHistory: false });
    } catch (error) {
      set({ error: error.message, isLoadingHistory: false });
    }
  },

  closeTrade: async (tradeId) => {
    set({ isMutating: true, error: null });
    try {
      await tradeService.closeTrade(tradeId);
      set({ isMutating: false });
      // Force refresh data
      get().fetchActiveTrades(true);
      get().fetchTradeHistory(true);
    } catch (error) {
      set({ error: error.message, isMutating: false });
    }
  }
}));
