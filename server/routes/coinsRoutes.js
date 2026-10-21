import express from 'express';
import axios from 'axios';
import { db } from '../db/database.js';
import { getActiveCandle } from '../socket.js';

// Mapping of CryptoPulse coin IDs / symbols to Binance spot USDT pairs
const BINANCE_PAIR_MAP = {
  bitcoin: 'BTCUSDT',
  btc: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  eth: 'ETHUSDT',
  solana: 'SOLUSDT',
  sol: 'SOLUSDT',
  bnb: 'BNBUSDT',
  xrp: 'XRPUSDT',
  dogecoin: 'DOGEUSDT',
  doge: 'DOGEUSDT',
  toncoin: 'TONUSDT',
  ton: 'TONUSDT',
  cardano: 'ADAUSDT',
  ada: 'ADAUSDT',
  avalanche: 'AVAXUSDT',
  avax: 'AVAXUSDT',
  chainlink: 'LINKUSDT',
  link: 'LINKUSDT',
  polkadot: 'DOTUSDT',
  dot: 'DOTUSDT',
  uniswap: 'UNIUSDT',
  uni: 'UNIUSDT',
  near: 'NEARUSDT',
  pepe: 'PEPEUSDT',
  tether: 'USDCUSDT',
  'usd-coin': 'USDCUSDT',
  usdc: 'USDCUSDT',
};

const router = express.Router();

// GET /api/coins - Paginated and searchable cryptocurrency listings with sorting filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      search,
      q,
      category = 'All assets',
      sortBy,
      sort,
      order,
      direction = 'asc',
      all,
    } = req.query;

    const searchTerm = (search || q || '').trim();
    const sortField = sortBy || sort || 'rank';
    const sortOrder = (order || direction || 'asc').toLowerCase();
    const isAll = all === 'true' || all === '1';

    const where = {};
    if (category && category !== 'All assets') {
      where.category = category;
    }
    if (searchTerm) {
      where.search = searchTerm;
    }

    const total = await db.coin.count({ where });
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = isAll ? total : Math.max(1, parseInt(limit, 10) || 8);
    const totalPages = Math.max(1, Math.ceil(total / (limitNum || 1)));
    const safePage = Math.min(pageNum, totalPages);
    const skip = isAll ? 0 : (safePage - 1) * limitNum;

    const coinsRaw = await db.coin.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    });

    const coins = coinsRaw.map((c) => {
      let sparkline = [];
      try {
        sparkline = JSON.parse(c.sparkline || '[]');
      } catch {
        sparkline = [];
      }
      return {
        ...c,
        volume: c.volume24h,
        change: c.change24h,
        sparkline,
      };
    });

    res.json({
      coins,
      pagination: {
        total,
        page: safePage,
        limit: limitNum,
        totalPages,
      },
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('[API] Error fetching coins list:', error);
    res.status(500).json({ error: 'Failed to retrieve cryptocurrency listings' });
  }
});

// GET /api/coins/:id - Detailed metadata, ATH, circulating supply, and stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const coin = await db.coin.findUnique({ where: { id: id.toLowerCase() } });

    if (!coin) {
      return res.status(404).json({
        error: `Cryptocurrency with ID "${id}" was not found.`,
      });
    }

    let sparkline = [];
    try {
      sparkline = JSON.parse(coin.sparkline || '[]');
    } catch {
      sparkline = [];
    }

    res.json({
      ...coin,
      volume: coin.volume24h,
      change: coin.change24h,
      sparkline,
    });
  } catch (error) {
    console.error(`[API] Error fetching coin ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve coin details' });
  }
});

// GET /api/coins/:id/history?days=1|7|30|365 - Historical time-series data points for Recharts
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { days, interval = '7d', points = 84 } = req.query;

    const coin = await db.coin.findUnique({ where: { id: id.toLowerCase() } });
    if (!coin) {
      return res.status(404).json({
        error: `Cryptocurrency with ID "${id}" was not found.`,
      });
    }

    // Determine number of days
    let dayCount = 7;
    if (days) {
      dayCount = parseFloat(days) || 7;
    } else {
      const intervalMap = {
        '24H': 1,
        '24h': 1,
        '1D': 1,
        '1d': 1,
        '7D': 7,
        '7d': 7,
        '30D': 30,
        '30d': 30,
        '1M': 30,
        '1m': 30,
        '90D': 90,
        '90d': 90,
        '3M': 90,
        '3m': 90,
        '365D': 365,
        '365d': 365,
        '1Y': 365,
        '1y': 365,
        ALL: 1095,
        all: 1095,
      };
      dayCount = intervalMap[interval] || 7;
    }

    // Growth simulation aligned with coin's 24h change & period
    const defaultGrowth =
      dayCount <= 1
        ? coin.change24h / 100
        : dayCount <= 7
          ? (coin.change24h / 100) * 1.8
          : dayCount <= 30
            ? 0.142
            : dayCount <= 90
              ? 0.265
              : 0.61;

    const startPrice = coin.price / (1 + defaultGrowth);
    const endTime = Date.now();
    const pointCount = parseInt(points, 10) || 84;
    let seed = (coin.rank || 1) * 199 + dayCount;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    let noise = 0;
    const history = Array.from({ length: pointCount }, (_, i) => {
      const t = i / (pointCount - 1);
      noise = noise * 0.65 + (random() - 0.48) * coin.price * 0.014;
      const wave =
        Math.sin(t * Math.PI * 8) * coin.price * 0.008 +
        Math.sin(t * Math.PI * 19) * coin.price * 0.004;

      const p =
        i === pointCount - 1
          ? coin.price
          : startPrice + (coin.price - startPrice) * t + (noise + wave) * Math.sin(Math.PI * t);

      return {
        timestamp: Math.round(endTime - dayCount * 86400000 * (1 - t)),
        price: Number(p.toPrecision(8)),
      };
    });

    res.json(history);
  } catch (error) {
    console.error(`[API] Error generating history for coin ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve historical price chart data' });
  }
});

// GET /api/coins/:id/candles?interval=1m&limit=45 - Candlestick OHLCV records from Binance
router.get('/:id/candles', async (req, res) => {
  try {
    const { id } = req.params;
    const { interval = '1m', limit = 45 } = req.query;
    const barCount = Math.min(Math.max(parseInt(limit, 10) || 45, 20), 100);

    const coin = await db.coin.findUnique({ where: { id: id.toLowerCase() } });
    if (!coin) {
      return res.status(404).json({ error: `Cryptocurrency with ID "${id}" was not found.` });
    }

    const intervalNormalized = interval.toLowerCase();
    const binanceIntervalMap = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '1d': '1d',
      '1D': '1d',
    };
    const bInterval = binanceIntervalMap[intervalNormalized] || '1m';

    const pair =
      BINANCE_PAIR_MAP[id.toLowerCase()] ||
      BINANCE_PAIR_MAP[coin.symbol?.toLowerCase()] ||
      (coin.symbol ? `${coin.symbol.toUpperCase()}USDT` : 'BTCUSDT');

    // 1. Fetch real public klines from Binance for persistent, identical graph data
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${bInterval}&limit=${barCount}`,
        { timeout: 5000 }
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        const candles = response.data.map((k) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }));

        // Attach or sync active live tick to the most recent candle close if in the same bucket
        const activeCandle = getActiveCandle(id.toLowerCase());
        if (activeCandle && candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          if (activeCandle.time === lastCandle.time) {
            lastCandle.close = activeCandle.close;
            lastCandle.high = Math.max(lastCandle.high, activeCandle.high);
            lastCandle.low = Math.min(lastCandle.low, activeCandle.low);
          }
        }

        return res.json(candles);
      }
    } catch (binanceErr) {
      console.warn(`[API] Binance klines fetch failed for ${pair}: ${binanceErr.message}. Serving deterministic historical sequence.`);
    }

    // 2. Deterministic Fallback: Fixed pseudo-random seed anchored to coin ID & time bucket
    // Guaranteed to produce the exact same graph shape across page refreshes and route switches
    const stepSecondsMap = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '1d': 86400,
      '1D': 86400,
    };
    const step = stepSecondsMap[intervalNormalized] || 60;
    const activeCandle = getActiveCandle(id.toLowerCase());
    const currentPrice = Number(activeCandle?.close || coin.price || 67000);
    const precision = currentPrice < 1 ? (currentPrice < 0.01 ? 6 : 4) : 2;

    const baseVolatility =
      intervalNormalized === '1d' || intervalNormalized === '1D'
        ? 0.005
        : intervalNormalized === '1h'
          ? 0.0025
          : intervalNormalized === '15m'
            ? 0.0016
            : intervalNormalized === '5m'
              ? 0.0012
              : 0.0009;

    let lastClose = currentPrice;
    const rawCandles = [];
    const now = Math.floor(Date.now() / 1000);
    const alignedNow = Math.floor(now / step) * step;

    // Linear Congruential Generator with fixed deterministic seed (NO Math.random)
    let seed = (coin.rank || 1) * 31415 + (id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 1000);
    const deterministicRandom = () => {
      seed = (seed * 16807 + 7) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < barCount; i++) {
      const time = alignedNow - i * step;
      const delta = (deterministicRandom() - 0.49) * (lastClose * baseVolatility);
      const close = lastClose;
      const open = Math.max(0.000001, close - delta);

      const bodyTop = Math.max(open, close);
      const bodyBottom = Math.min(open, close);
      const wickSpread = Math.max(Math.abs(delta) * (0.15 + deterministicRandom() * 0.25), lastClose * 0.00005);

      const high = bodyTop + wickSpread;
      const low = Math.max(0.000001, bodyBottom - wickSpread);

      rawCandles.push({
        time,
        open: Number(open.toFixed(precision)),
        high: Number(high.toFixed(precision)),
        low: Number(low.toFixed(precision)),
        close: Number(close.toFixed(precision)),
        volume: Math.floor(deterministicRandom() * 50 + 10),
      });

      lastClose = open;
    }

    const candles = rawCandles.reverse();
    if (candles.length > 0) {
      const finalCandle = candles[candles.length - 1];
      finalCandle.close = Number(currentPrice.toFixed(precision));
      finalCandle.high = Math.max(finalCandle.high, finalCandle.close, finalCandle.open);
      finalCandle.low = Math.min(finalCandle.low, finalCandle.close, finalCandle.open);
    }

    res.json(candles);
  } catch (error) {
    console.error(`[API] Error retrieving candles for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve candlestick data' });
  }
});

export default router;
