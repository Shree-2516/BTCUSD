import { create } from 'zustand';
import { walletService } from '../api/services/wallet.js';

export const useWalletStore = create((set, get) => ({
  walletStatus: null,
  walletHistory: [],
  isLoadingStatus: false,
  isLoadingHistory: false,
  isMutating: false, // For deposit/withdraw/reset
  error: null,
  lastFetchedStatus: null,
  lastFetchedHistory: null,

  fetchWalletStatus: async (force = false) => {
    const { walletStatus, lastFetchedStatus } = get();
    // Cache for 2 minutes unless forced
    if (!force && walletStatus && lastFetchedStatus && (Date.now() - lastFetchedStatus < 120000)) {
      return;
    }

    set({ isLoadingStatus: true, error: null });
    try {
      const data = await walletService.getWalletStatus();
      set({ walletStatus: data, lastFetchedStatus: Date.now(), isLoadingStatus: false });
    } catch (error) {
      set({ error: error.message, isLoadingStatus: false });
    }
  },

  fetchWalletHistory: async (force = false) => {
    const { walletHistory, lastFetchedHistory } = get();
    if (!force && walletHistory.length > 0 && lastFetchedHistory && (Date.now() - lastFetchedHistory < 120000)) {
      return;
    }

    set({ isLoadingHistory: true, error: null });
    try {
      const data = await walletService.getWalletHistory();
      set({ walletHistory: data, lastFetchedHistory: Date.now(), isLoadingHistory: false });
    } catch (error) {
      set({ error: error.message, isLoadingHistory: false });
    }
  },

  deposit: async (amount, reason) => {
    set({ isMutating: true, error: null });
    try {
      await walletService.deposit(amount, reason);
      set({ isMutating: false });
      // Force refresh data
      get().fetchWalletStatus(true);
      get().fetchWalletHistory(true);
    } catch (error) {
      set({ error: error.message, isMutating: false });
    }
  },

  withdraw: async (amount, reason) => {
    set({ isMutating: true, error: null });
    try {
      await walletService.withdraw(amount, reason);
      set({ isMutating: false });
      get().fetchWalletStatus(true);
      get().fetchWalletHistory(true);
    } catch (error) {
      set({ error: error.message, isMutating: false });
    }
  },

  reset: async () => {
    set({ isMutating: true, error: null });
    try {
      await walletService.resetWallet();
      set({ isMutating: false });
      get().fetchWalletStatus(true);
      get().fetchWalletHistory(true);
    } catch (error) {
      set({ error: error.message, isMutating: false });
    }
  }
}));
