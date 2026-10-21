import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToTicks, getSocket } from '../services/socket';

/**
 * Custom React hook that subscribes to 'crypto:tick' from the backend gateway.
 * Maintains real-time ticks, price deltas, and 600ms green/red flash state.
 */
export function useCryptoSocket(targetCoinId = null) {
  const [ticks, setTicks] = useState({});
  const [latestTick, setLatestTick] = useState(null);
  const [priceFlashes, setPriceFlashes] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const prevPricesRef = useRef(new Map());
  const timersRef = useRef(new Map());

  const handleTick = useCallback((tick) => {
    if (!tick || !tick.coinId) return;

    const coinId = tick.coinId;
    const prevPrice = prevPricesRef.current.get(coinId);
    let direction = null;

    if (prevPrice !== undefined && prevPrice !== null) {
      if (tick.price > prevPrice) {
        direction = 'up';
      } else if (tick.price < prevPrice) {
        direction = 'down';
      }
    }
    prevPricesRef.current.set(coinId, tick.price);

    // Apply pulse flash if price moved
    if (direction) {
      setPriceFlashes((prev) => ({ ...prev, [coinId]: direction }));

      // Automatically fade back to neutral after 600ms
      if (timersRef.current.has(coinId)) {
        clearTimeout(timersRef.current.get(coinId));
      }
      const timer = setTimeout(() => {
        setPriceFlashes((prev) => {
          const next = { ...prev };
          delete next[coinId];
          return next;
        });
        timersRef.current.delete(coinId);
      }, 600);
      timersRef.current.set(coinId, timer);
    }

    setLatestTick(tick);
    setTicks((prev) => ({
      ...prev,
      [coinId]: tick,
    }));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const unsubscribe = subscribeToTicks((tick) => {
      if (
        !targetCoinId ||
        tick.coinId === targetCoinId ||
        tick.symbol?.toLowerCase() === targetCoinId?.toLowerCase()
      ) {
        handleTick(tick);
      }
    });

    return () => {
      unsubscribe();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, [handleTick, targetCoinId]);

  return {
    latestTick,
    ticks,
    priceFlashes,
    isConnected,
  };
}

export default useCryptoSocket;
