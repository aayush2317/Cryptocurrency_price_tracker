import { Server } from 'socket.io';
import WebSocket from 'ws';
import { priceSimulator } from './services/priceSimulator.js';
import { db } from './db/database.js';

let ioInstance = null;
let binanceWs = null;
let binanceActive = false;
let fallbackActive = false;
let lastBinanceMsgTime = 0;
let watchdogInterval = null;

const SYMBOL_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'bnb',
  SOL: 'solana',
  USDC: 'usd-coin',
  XRP: 'xrp',
  DOGE: 'dogecoin',
  TON: 'toncoin',
  ADA: 'cardano',
  AVAX: 'avalanche',
  LINK: 'chainlink',
  DOT: 'polkadot',
  UNI: 'uniswap',
  NEAR: 'near',
  PEPE: 'pepe',
};

// Map of coinId -> active 1-minute candle
const activeCandles = new Map();

export function getActiveCandle(coinId) {
  return activeCandles.get(coinId) || null;
}

/**
 * Updates or creates the active 1-minute candle bucket for a given coin.
 * Emits 'crypto:candle-update' to all connected clients.
 */
export function updateActiveCandle(coinId, symbol, price, volume = 1.0) {
  const nowSec = Math.floor(Date.now() / 1000);
  const minuteBucket = Math.floor(nowSec / 60) * 60;
  let active = activeCandles.get(coinId);

  if (!active || active.time !== minuteBucket) {
    active = {
      time: minuteBucket,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: Number(volume.toFixed(2)),
    };
    activeCandles.set(coinId, active);
  } else {
    active.high = Math.max(active.high, price);
    active.low = Math.min(active.low, price);
    active.close = price;
    active.volume = Number((active.volume + volume).toFixed(2));
  }

  const payload = {
    symbol,
    coinId,
    candle: { ...active },
  };

  if (ioInstance) {
    ioInstance.emit('crypto:candle-update', payload);
  }

  return active;
}

/**
 * Starts the high-frequency price simulator (1.5s interval) as a robust fallback.
 */
function startSimulatorFallback() {
  if (fallbackActive) return;
  fallbackActive = true;
  console.log('[Socket] External feed offline/unreachable. Activating 1.5s price simulator fallback...');

  priceSimulator.start(1500);

  priceSimulator.onPriceUpdate((coins) => {
    if (!fallbackActive) return;

    coins.forEach((coin) => {
      const tickPayload = {
        symbol: coin.symbol,
        coinId: coin.id,
        price: coin.price,
        change24h: coin.change,
        high: coin.high24h || coin.price * 1.02,
        low: coin.low24h || coin.price * 0.98,
        timestamp: Date.now(),
      };

      if (ioInstance) {
        ioInstance.emit('crypto:tick', tickPayload);
      }

      updateActiveCandle(coin.id, coin.symbol, coin.price, 0.75);
    });

    // Also broadcast full enriched state for table views
    if (ioInstance) {
      const overviewStats = typeof priceSimulator.getMarketStats === 'function' ? priceSimulator.getMarketStats() : null;
      ioInstance.emit('price-update', {
        coins,
        marketStats: overviewStats,
        source: 'simulator-fallback',
        timestamp: Date.now(),
      });
    }
  });
}

function stopSimulatorFallback() {
  if (!fallbackActive) return;
  console.log('[Socket] Binance live WebSocket stream active. Pausing simulator fallback.');
  fallbackActive = false;
  priceSimulator.stop();
}

/**
 * Establishes a persistent connection to Binance's free public multi-stream WebSocket.
 */
function connectBinanceStream() {
  const streamUrl = 'wss://stream.binance.com:9443/stream?streams=!miniTicker@arr/btcusdt@kline_1m';

  try {
    binanceWs = new WebSocket(streamUrl);

    binanceWs.on('open', () => {
      console.log('[Binance WS] Connected to public live stream (!miniTicker@arr + btcusdt@kline_1m)');
      binanceActive = true;
      lastBinanceMsgTime = Date.now();
    });

    binanceWs.on('message', async (data) => {
      try {
        lastBinanceMsgTime = Date.now();
        if (fallbackActive) {
          stopSimulatorFallback();
        }

        const msg = JSON.parse(data.toString());

        // 1. Process 24hr miniTicker array
        if (msg.stream === '!miniTicker@arr' && Array.isArray(msg.data)) {
          for (const item of msg.data) {
            if (!item.s || !item.s.endsWith('USDT')) continue;
            const sym = item.s.replace('USDT', '');
            const coinId = SYMBOL_TO_ID[sym];
            if (!coinId) continue;

            const currentPrice = parseFloat(item.c);
            const openPrice = parseFloat(item.o);
            const highPrice = parseFloat(item.h);
            const lowPrice = parseFloat(item.l);
            const change24h = openPrice > 0
              ? Number((((currentPrice - openPrice) / openPrice) * 100).toFixed(2))
              : 0;

            const tickPayload = {
              symbol: sym,
              coinId,
              price: currentPrice,
              change24h,
              high: highPrice,
              low: lowPrice,
              timestamp: Date.now(),
            };

            if (ioInstance) {
              ioInstance.emit('crypto:tick', tickPayload);
            }

            // Update in-memory active candle
            updateActiveCandle(coinId, sym, currentPrice, 0.5);

            // Update database cache asynchronously
            db.coin.findUnique({ where: { id: coinId } }).then((existing) => {
              if (existing) {
                db.coin.update({
                  where: { id: coinId },
                  data: {
                    price: currentPrice,
                    change24h,
                    high24h: highPrice,
                    low24h: lowPrice,
                  },
                }).catch(() => {});
              }
            }).catch(() => {});
          }
        }

        // 2. Process BTC 1m kline updates
        if (msg.stream === 'btcusdt@kline_1m' && msg.data?.k) {
          const k = msg.data.k;
          const candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };

          activeCandles.set('bitcoin', candle);

          if (ioInstance) {
            ioInstance.emit('crypto:candle-update', {
              symbol: 'BTC',
              coinId: 'bitcoin',
              candle,
            });
          }
        }
      } catch (err) {
        console.warn('[Binance WS] Error parsing message:', err.message);
      }
    });

    binanceWs.on('error', (err) => {
      console.warn('[Binance WS] Connection error:', err.message);
      binanceActive = false;
      startSimulatorFallback();
    });

    binanceWs.on('close', () => {
      console.warn('[Binance WS] Connection closed. Triggering fallback and scheduling reconnect...');
      binanceActive = false;
      startSimulatorFallback();
      setTimeout(connectBinanceStream, 8000);
    });
  } catch (err) {
    console.error('[Binance WS] Setup error:', err);
    binanceActive = false;
    startSimulatorFallback();
  }
}

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Immediately send any active candles on connect
    activeCandles.forEach((candle, coinId) => {
      socket.emit('crypto:candle-update', {
        coinId,
        candle,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  // Connect to Binance live stream
  connectBinanceStream();

  // Watchdog timer: If no Binance message within 5s, activate simulator fallback
  watchdogInterval = setInterval(() => {
    const elapsed = Date.now() - lastBinanceMsgTime;
    if (elapsed > 5000) {
      if (!fallbackActive) {
        console.warn(`[Socket] Binance feed silent for ${elapsed}ms. Ensuring fallback simulator is active.`);
        startSimulatorFallback();
      }
    }
  }, 4000);

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function broadcastPriceUpdate(payload) {
  if (!ioInstance) return;
  ioInstance.emit('price-update', {
    ...payload,
    timestamp: Date.now(),
  });
}
