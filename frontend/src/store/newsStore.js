import { create } from 'zustand';
import { newsService } from '../api/services/news.js';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const useNewsStore = create((set, get) => ({
  latestNews: [],
  sentiment: null,
  signals: null,
  isLoadingNews: false,
  isLoadingSentiment: false,
  error: null,
  lastFetchedNews: null,
  lastFetchedSentiment: null,

  fetchLatestNews: async (limit = 20, force = false) => {
    const { latestNews, lastFetchedNews } = get();
    if (!force && latestNews.length > 0 && lastFetchedNews && (Date.now() - lastFetchedNews < CACHE_TTL)) {
      return;
    }

    set({ isLoadingNews: true, error: null });
    try {
      const data = await newsService.getLatestNews(limit);
      set({ latestNews: data, lastFetchedNews: Date.now(), isLoadingNews: false });
    } catch (error) {
      set({ error: error.message, isLoadingNews: false });
    }
  },

  fetchSentiment: async (force = false) => {
    const { sentiment, lastFetchedSentiment } = get();
    if (!force && sentiment && lastFetchedSentiment && (Date.now() - lastFetchedSentiment < CACHE_TTL)) {
      return;
    }

    set({ isLoadingSentiment: true, error: null });
    try {
      const data = await newsService.getSentiment();
      set({ sentiment: data, lastFetchedSentiment: Date.now(), isLoadingSentiment: false });
    } catch (error) {
      set({ error: error.message, isLoadingSentiment: false });
    }
  },

  fetchSignals: async (force = false) => {
    // Shared loading state with sentiment for simplicity
    set({ isLoadingSentiment: true, error: null });
    try {
      const data = await newsService.getSignal();
      set({ signals: data, isLoadingSentiment: false });
    } catch (error) {
      set({ error: error.message, isLoadingSentiment: false });
    }
  }
}));
