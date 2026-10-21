import axios from 'axios';
import { coins as fallbackCoins, marketStats as fallbackStats } from '../data/coins';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Backend proxy connection pending';
    // Gentle warning instead of error to keep console clean during startup/offline
    console.warn('[API Notice]:', message);
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // GET /api/market/overview with safe fallback
  getMarketOverview: async () => {
    try {
      return await apiClient.get('/market/overview');
    } catch {
      try {
        return await apiClient.get('/market-stats');
      } catch {
        return {
          totalMarketCapFormatted: '$2.48T',
          marketCapChange24h: 2.34,
          total24hVolumeFormatted: '$84.62B',
          volumeChange24h: 8.12,
          btcDominance: 54.2,
          btcDominanceChange24h: 0.42,
          stats: fallbackStats || [],
          lastUpdated: Date.now(),
        };
      }
    }
  },

  getMarketStats: async () => {
    return api.getMarketOverview();
  },

  // GET /api/coins (Paginated list with search, sorting, and safe fallback)
  getCoins: async (params = {}) => {
    const cleanParams = {};
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.limit !== undefined) cleanParams.limit = params.limit;
    if (params.search) cleanParams.search = params.search;
    if (params.q) cleanParams.q = params.q;
    if (params.category && params.category !== 'All assets') cleanParams.category = params.category;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sort) cleanParams.sort = params.sort;
    if (params.order) cleanParams.order = params.order;
    if (params.direction) cleanParams.direction = params.direction;
    if (params.all) cleanParams.all = true;

    try {
      const data = await apiClient.get('/coins', { params: cleanParams });
      return {
        coins: Array.isArray(data?.coins) ? data.coins : [],
        pagination: data?.pagination || { total: 0, page: 1, limit: 8, totalPages: 1 },
        lastUpdated: data?.lastUpdated || Date.now(),
      };
    } catch {
      // Safe fallback from local coins data
      let list = Array.isArray(fallbackCoins) ? [...fallbackCoins] : [];
      if (cleanParams.category && cleanParams.category !== 'All assets') {
        list = list.filter((c) => c.category === cleanParams.category);
      }
      if (cleanParams.search || cleanParams.q) {
        const query = (cleanParams.search || cleanParams.q).toLowerCase();
        list = list.filter(
          (c) => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query)
        );
      }
      return {
        coins: list,
        pagination: { total: list.length, page: 1, limit: list.length, totalPages: 1 },
        lastUpdated: Date.now(),
      };
    }
  },

  // GET /api/coins/:id with safe fallback
  getCoin: async (id) => {
    try {
      return await apiClient.get(`/coins/${id}`);
    } catch {
      const match = fallbackCoins?.find((c) => c.id.toLowerCase() === id?.toLowerCase());
      return match || null;
    }
  },

  // GET /api/coins/:id/history with safe fallback
  getCoinHistory: async (id, options = {}) => {
    const params = {};
    if (typeof options === 'object') {
      if (options.days !== undefined) params.days = options.days;
      if (options.interval) params.interval = options.interval;
      if (options.points) params.points = options.points;
    } else {
      params.interval = options;
    }

    try {
      const res = await apiClient.get(`/coins/${id}/history`, { params });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // GET /api/coins/:id/candles with safe fallback
  getCoinCandles: async (id, options = {}) => {
    const params = {
      interval: options.interval || '1m',
      limit: options.limit || 100,
    };
    try {
      const res = await apiClient.get(`/coins/${id}/candles`, { params });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  // GET /api/watchlist with safe fallback
  getWatchlist: async (userId) => {
    const headers = userId ? { 'x-user-id': userId } : {};
    try {
      const data = await apiClient.get('/watchlist', { headers });
      return {
        userId: data?.userId || 'default-user',
        watchlist: Array.isArray(data?.watchlist) ? data.watchlist : ['bitcoin', 'ethereum', 'solana'],
      };
    } catch {
      return {
        userId: userId || 'default-user',
        watchlist: ['bitcoin', 'ethereum', 'solana'],
      };
    }
  },

  // POST /api/watchlist
  toggleWatchlist: async (coinId, options = {}) => {
    const { userId, saved, action } = options;
    const headers = userId ? { 'x-user-id': userId } : {};
    try {
      return await apiClient.post(
        '/watchlist',
        { coinId, saved, action },
        { headers }
      );
    } catch {
      return { success: false, coinId, isWatched: !!saved };
    }
  },

  // DELETE /api/watchlist/:id
  removeFromWatchlist: async (coinId, userId) => {
    const headers = userId ? { 'x-user-id': userId } : {};
    try {
      return await apiClient.delete(`/watchlist/${coinId}`, { headers });
    } catch {
      return { success: false, coinId, isWatched: false };
    }
  },
};

export default api;
