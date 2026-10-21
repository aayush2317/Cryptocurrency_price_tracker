import { INITIAL_COINS } from '../data/coinsData.js';

class PriceSimulator {
  constructor() {
    this.coins = INITIAL_COINS.map((c) => ({
      ...c,
      previousPrice: c.price,
      priceDirection: 'unchanged',
      lastPriceChange: 0,
      sparkline: this.generateSparkline(c.price, c.change),
    }));

    this.timer = null;
    this.lastUpdated = Date.now();
    this.listeners = new Set();
    this.volumeFlux = 0;
  }

  generateSparkline(basePrice, change, points = 20) {
    const start = basePrice / (1 + (change / 100));
    const result = [];
    let cur = start;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const trend = start + (basePrice - start) * t;
      const noise = (Math.random() - 0.5) * (basePrice * 0.015);
      cur = i === points - 1 ? basePrice : trend + noise;
      result.push(Number(cur.toFixed(cur < 1 ? 6 : 2)));
    }
    return result;
  }

  start(intervalMs = 3500) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);
    // Initial tick to synchronize timestamps
    this.lastUpdated = Date.now();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    this.lastUpdated = Date.now();

    this.coins.forEach((coin) => {
      // Fluctuation between -0.05% and +0.05% (0.0005)
      const maxDelta = 0.0005;
      const randomFactor = (Math.random() * 2 - 1) * maxDelta;
      
      const oldPrice = coin.price;
      let newPrice = oldPrice * (1 + randomFactor);

      // Keep precision consistent
      if (newPrice > 1000) {
        newPrice = Math.round(newPrice * 100) / 100;
      } else if (newPrice > 1) {
        newPrice = Math.round(newPrice * 1000) / 1000;
      } else if (newPrice > 0.01) {
        newPrice = Math.round(newPrice * 10000) / 10000;
      } else {
        newPrice = Number(newPrice.toPrecision(5));
      }

      const diff = newPrice - oldPrice;
      let direction = 'unchanged';
      if (diff > 0.00000001) direction = 'up';
      else if (diff < -0.00000001) direction = 'down';

      coin.previousPrice = oldPrice;
      coin.price = newPrice;
      coin.priceDirection = direction;
      coin.lastPriceChange = diff;

      // Update 24h change slightly
      const changeDelta = (randomFactor * 100);
      coin.change = Number((coin.change + changeDelta).toFixed(2));

      // Recalculate market cap
      coin.marketCap = Math.round(coin.circulatingSupply * newPrice);

      // Track 24h high/low
      if (newPrice > coin.high24h) coin.high24h = newPrice;
      if (newPrice < coin.low24h) coin.low24h = newPrice;

      // Update sparkline tail
      if (coin.sparkline && coin.sparkline.length > 0) {
        coin.sparkline.shift();
        coin.sparkline.push(newPrice);
      }
    });

    // Notify any active listeners (e.g. SSE or websockets)
    this.listeners.forEach((callback) => {
      try {
        callback(this.coins);
      } catch (e) {
        console.error('Error notifying price listener:', e);
      }
    });
  }

  onPriceUpdate(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getCoins({
    page = 1,
    limit = 8,
    search = '',
    category = 'All assets',
    sortBy = 'rank',
    order = 'asc',
  } = {}) {
    let result = [...this.coins];

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category && category !== 'All assets') {
      result = result.filter((c) => c.category === category);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === undefined) valA = a.rank;
      if (valB === undefined) valB = b.rank;

      let cmp = 0;
      if (typeof valA === 'string') {
        cmp = valA.localeCompare(valB);
      } else {
        cmp = valA - valB;
      }
      return order === 'desc' ? -cmp : cmp;
    });

    const total = result.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = parseInt(limit, 10);

    // If limit is 0 or NaN or all=true, return all
    if (!limitNum || limitNum <= 0) {
      return {
        coins: result,
        pagination: {
          total,
          page: 1,
          limit: total,
          totalPages: 1,
        },
        lastUpdated: this.lastUpdated,
      };
    }

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const safePage = Math.min(pageNum, totalPages);
    const startIndex = (safePage - 1) * limitNum;
    const paginatedCoins = result.slice(startIndex, startIndex + limitNum);

    return {
      coins: paginatedCoins,
      pagination: {
        total,
        page: safePage,
        limit: limitNum,
        totalPages,
      },
      lastUpdated: this.lastUpdated,
    };
  }

  getCoinById(id) {
    const coin = this.coins.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (!coin) return null;
    return {
      ...coin,
      lastUpdated: this.lastUpdated,
    };
  }

  getCoinHistory(id, interval = '7d', points = 84) {
    const coin = this.getCoinById(id);
    if (!coin) return null;

    const normalizedInterval = interval.toUpperCase();
    const intervalMap = {
      '24H': { days: 1, defaultGrowth: coin.change / 100 },
      '7D': { days: 7, defaultGrowth: (coin.change / 100) * 1.8 },
      '30D': { days: 30, defaultGrowth: 0.142 },
      '1M': { days: 30, defaultGrowth: 0.142 },
      '3M': { days: 90, defaultGrowth: 0.265 },
      '1Y': { days: 365, defaultGrowth: 0.61 },
      'ALL': { days: 1095, defaultGrowth: 1.24 },
    };

    const config = intervalMap[normalizedInterval] || intervalMap['7D'];
    const days = config.days;
    const growth = config.defaultGrowth;

    const startPrice = coin.price / (1 + growth);
    const endTime = Date.now();
    let seed = coin.rank * 199 + days;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    let noise = 0;
    const history = Array.from({ length: points }, (_, i) => {
      const t = i / (points - 1);
      noise = noise * 0.65 + (random() - 0.48) * coin.price * 0.014;
      const wave =
        Math.sin(t * Math.PI * 8) * coin.price * 0.008 +
        Math.sin(t * Math.PI * 19) * coin.price * 0.004;

      const price =
        i === points - 1
          ? coin.price
          : startPrice + (coin.price - startPrice) * t + (noise + wave) * Math.sin(Math.PI * t);

      return {
        timestamp: Math.round(endTime - days * 86400000 * (1 - t)),
        price: Number(price.toPrecision(8)),
      };
    });

    return history;
  }

  getMarketStats() {
    // Calculate aggregate metrics dynamically from coin states
    const btc = this.coins.find((c) => c.id === 'bitcoin');
    const eth = this.coins.find((c) => c.id === 'ethereum');

    // Aggregate market cap scaled around $2.48 Trillion
    const totalCoinMarketCap = this.coins.reduce((sum, c) => sum + c.marketCap, 0);
    // Baseline scale factor to represent global market cap ($2.48T)
    const baseGlobalMarketCap = 2.48e12;
    const avgChange = this.coins.reduce((sum, c) => sum + c.change, 0) / this.coins.length;
    
    // Weighted change based on top coins
    const weightedChange = btc ? btc.change * 0.55 + (eth ? eth.change * 0.2 : 0) + avgChange * 0.25 : 2.34;
    const currentGlobalMarketCap = baseGlobalMarketCap * (1 + (weightedChange / 100) * 0.5);

    // 24h Volume scaled around $84.62 Billion
    const baseVolume = 84.62e9;
    const volumeChange = 8.12 + (weightedChange - 2.34) * 0.4;
    const currentVolume = baseVolume * (1 + (volumeChange / 100) * 0.2);

    // Bitcoin dominance (approx 54.2% fluctuating with btc market cap share)
    const btcDominance = btc && totalCoinMarketCap > 0
      ? Number(((btc.marketCap / totalCoinMarketCap) * 75).toFixed(1))
      : 54.2;

    const formatCurrency = (val) => {
      if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
      return `$${val.toLocaleString()}`;
    };

    return {
      totalMarketCap: currentGlobalMarketCap,
      totalMarketCapFormatted: formatCurrency(currentGlobalMarketCap),
      marketCapChange24h: Number(weightedChange.toFixed(2)),
      total24hVolume: currentVolume,
      total24hVolumeFormatted: formatCurrency(currentVolume),
      volumeChange24h: Number(volumeChange.toFixed(2)),
      btcDominance,
      btcDominanceChange24h: 0.42,
      lastUpdated: this.lastUpdated,
      stats: [
        {
          label: 'Total market cap',
          value: formatCurrency(currentGlobalMarketCap),
          change: Number(weightedChange.toFixed(2)),
          note: 'Global cryptocurrency market',
          kind: 'market',
          raw: currentGlobalMarketCap,
        },
        {
          label: '24h trading volume',
          value: formatCurrency(currentVolume),
          change: Number(volumeChange.toFixed(2)),
          note: 'Across all exchanges',
          kind: 'volume',
          raw: currentVolume,
        },
        {
          label: 'Bitcoin dominance',
          value: `${btcDominance}%`,
          change: 0.42,
          note: 'Share of total market cap',
          kind: 'dominance',
          raw: btcDominance,
        },
      ],
    };
  }
}

export const priceSimulator = new PriceSimulator();
