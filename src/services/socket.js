import { io } from 'socket.io-client';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.hostname}:5000`
    : 'http://localhost:5000');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[WebSocket Client] Connected to CryptoPulse live feed:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket Client] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[WebSocket Client] Connection error:', error.message);
    });
  }

  return socket;
}

export function subscribeToTicks(callback) {
  const s = getSocket();
  s.on('crypto:tick', callback);
  return () => {
    s.off('crypto:tick', callback);
  };
}

export function subscribeToCandles(callback) {
  const s = getSocket();
  s.on('crypto:candle-update', callback);
  return () => {
    s.off('crypto:candle-update', callback);
  };
}

export function subscribeToPriceUpdates(callback) {
  const s = getSocket();
  s.on('price-update', callback);
  return () => {
    s.off('price-update', callback);
  };
}

export default getSocket;
