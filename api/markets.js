// api/markets.js
// ─────────────────────────────────────────────────────────────
//  GET /api/markets
//  Alternative endpoint supporting query params and filters
// ─────────────────────────────────────────────────────────────

import { getCoins } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, search } = req.query || {};
    let coins = await getCoins();

    if (category && category !== 'All assets') {
      coins = coins.filter(
        (c) => c.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const q = search.toLowerCase();
      coins = coins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      coins,
      total: coins.length,
    });
  } catch (err) {
    console.error('[/api/markets]', err);
    return res.status(500).json({ error: 'Failed to fetch markets' });
  }
}
