// api/history.js
// ─────────────────────────────────────────────────────────────
//  GET /api/history?coin=bitcoin&period=7D
//  Returns historical price points for Recharts PriceChart
// ─────────────────────────────────────────────────────────────

import { getHistory, getCoinById } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { coin = 'bitcoin', period = '7D' } = req.query || {};

  try {
    let history = await getHistory(coin, period);

    // If no explicit candles stored for this coin yet, generate realistic points based on current coin price
    if (!history || history.length === 0) {
      const coinData = await getCoinById(coin);
      if (coinData) {
        const days = { '24H': 1, '7D': 7, '1M': 30, '3M': 90, '1Y': 365, ALL: 1095 }[period] || 7;
        const growth = (coinData.change / 100) * (period === '24H' ? 1 : 2.4);
        const start = coinData.price / (1 + growth);
        const endTime = Date.now();
        const points = 84;

        let seed = coinData.rank * 199 + days;
        const random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        let noise = 0;
        history = Array.from({ length: points }, (_, i) => {
          const t = i / (points - 1);
          noise = noise * 0.65 + (random() - 0.48) * coinData.price * 0.014;
          const wave =
            Math.sin(t * Math.PI * 8) * coinData.price * 0.008 +
            Math.sin(t * Math.PI * 19) * coinData.price * 0.004;
          const price =
            i === points - 1
              ? coinData.price
              : start + (coinData.price - start) * t + (noise + wave) * Math.sin(Math.PI * t);
          return {
            timestamp: endTime - days * 86400000 * (1 - t),
            price: Number(price.toPrecision(8)),
          };
        });
      }
    }

    return res.status(200).json({ history });
  } catch (err) {
    console.error('[/api/history]', err);
    return res.status(500).json({ error: 'Failed to fetch historical chart data' });
  }
}
