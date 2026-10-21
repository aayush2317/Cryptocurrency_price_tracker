import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { subscribeToPriceUpdates, subscribeToTicks } from '../services/socket';
import { MarketDataContext } from './marketData';
export { useMarketData } from '../hooks/useMarketData';

export function MarketDataProvider({ children, fallbackPollInterval = 10000 }) {
  const [coins, setCoins] = useState([]);
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceFlashes, setPriceFlashes] = useState({});
  const [wsConnected, setWsConnected] = useState(false);

  const previousPricesRef = useRef(new Map());
  const flashTimersRef = useRef(new Map());

  // Trigger visual green/red flash animations on price delta, clearing after 600ms
  const triggerFlash = useCallback((coinId, direction) => {
    if (!coinId || !direction) return;

    setPriceFlashes((prev) => ({ ...prev, [coinId]: direction }));

    if (flashTimersRef.current.has(coinId)) {
      clearTimeout(flashTimersRef.current.get(coinId));
    }

    const timer = setTimeout(() => {
      setPriceFlashes((prev) => {
        const copy = { ...prev };
        delete copy[coinId];
        return copy;
      });
      flashTimersRef.current.delete(coinId);
    }, 600);

    flashTimersRef.current.set(coinId, timer);
  }, []);

  const applyFlashes = useCallback((newCoins) => {
    (newCoins || []).forEach((coin) => {
      const prevPrice = previousPricesRef.current.get(coin.id);
      if (prevPrice !== undefined && prevPrice !== null) {
        if (coin.price > prevPrice) {
          triggerFlash(coin.id, 'up');
        } else if (coin.price < prevPrice) {
          triggerFlash(coin.id, 'down');
        }
      }
      previousPricesRef.current.set(coin.id, coin.price);
    });
  }, [triggerFlash]);

  // Fetch initial REST data
  const fetchMarketData = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      const [coinsRes, statsRes] = await Promise.all([
        api.getCoins({ all: true, sortBy: 'rank', order: 'asc' }),
        api.getMarketOverview(),
      ]);

      const newCoins = coinsRes.coins || [];
      applyFlashes(newCoins);

      setCoins(newCoins);
      setMarketStats(statsRes);
      setLastUpdated(Date.now());
    } catch (err) {
      console.warn('[MarketData] Initial fetch notice:', err.message);
      if (!isBackground) {
        setError(err.message || 'Could not connect to CryptoPulse backend');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [applyFlashes]);

  // Initial load
  useEffect(() => {
    fetchMarketData(false);
  }, [fetchMarketData]);

  // Connect Socket.io WebSocket Layer for real-time live price updates and sub-second ticks
  useEffect(() => {
    // 1. Full batch updates from server sync worker
    const unsubscribePriceUpdates = subscribeToPriceUpdates((payload) => {
      setWsConnected(true);
      if (payload?.coins && Array.isArray(payload.coins)) {
        applyFlashes(payload.coins);
        setCoins(payload.coins);
      }
      if (payload?.marketStats) {
        setMarketStats(payload.marketStats);
      }
      setLastUpdated(payload?.timestamp || Date.now());
    });

    // 2. High-frequency Binance / simulator ticks
    const unsubscribeTicks = subscribeToTicks((tick) => {
      if (!tick || !tick.coinId) return;
      setWsConnected(true);

      const coinId = tick.coinId;
      const prevPrice = previousPricesRef.current.get(coinId);

      if (prevPrice !== undefined && prevPrice !== null) {
        if (tick.price > prevPrice) {
          triggerFlash(coinId, 'up');
        } else if (tick.price < prevPrice) {
          triggerFlash(coinId, 'down');
        }
      }
      previousPricesRef.current.set(coinId, tick.price);

      // Instant state update for the specific coin without re-fetching
      setCoins((prevCoins) => {
        const idx = (prevCoins || []).findIndex(
          (c) => c?.id === coinId || c?.symbol?.toLowerCase() === tick.symbol?.toLowerCase()
        );
        if (idx === -1) return prevCoins;

        const updated = [...prevCoins];
        const old = updated[idx];
        updated[idx] = {
          ...old,
          price: tick.price,
          change: tick.change24h !== undefined ? tick.change24h : old.change,
          change24h: tick.change24h !== undefined ? tick.change24h : old.change24h,
          high24h: tick.high || old.high24h,
          low24h: tick.low || old.low24h,
        };
        return updated;
      });

      setLastUpdated(tick.timestamp || Date.now());
    });

    return () => {
      unsubscribePriceUpdates();
      unsubscribeTicks();
    };
  }, [applyFlashes, triggerFlash]);

  // Fallback Polling (keeps active if WebSocket is connecting or offline)
  useEffect(() => {
    if (fallbackPollInterval <= 0) return;
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, fallbackPollInterval);

    return () => clearInterval(interval);
  }, [fetchMarketData, fallbackPollInterval]);

  // Cleanup flash timers
  useEffect(() => {
    return () => {
      flashTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const value = {
    coins,
    marketStats,
    loading,
    error,
    isRefreshing,
    lastUpdated,
    priceFlashes,
    wsConnected,
    refresh: () => fetchMarketData(true),
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}
