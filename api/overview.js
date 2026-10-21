// api/overview.js
// ─────────────────────────────────────────────────────────────
//  GET /api/overview
//  Returns { marketStats, movers } for the dashboard
// ─────────────────────────────────────────────────────────────

import { getMarketOverview, getAllMovers } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [overview, movers] = await Promise.all([
      getMarketOverview(),
      getAllMovers(),
    ]);

    const marketStats = overview
      ? [
          {
            label: 'Total market cap',
            value: `$${(overview.total_market_cap / 1e12).toFixed(2)}T`,
            change: Number(overview.market_cap_change),
            note: 'Global cryptocurrency market',
            kind: 'market',
          },
          {
            label: '24h trading volume',
            value: `$${(overview.total_volume_24h / 1e9).toFixed(2)}B`,
            change: Number(overview.volume_change),
            note: 'Across all exchanges',
            kind: 'volume',
          },
          {
            label: 'Bitcoin dominance',
            value: `${overview.btc_dominance}%`,
            change: Number(overview.dominance_change),
            note: 'Share of total market cap',
            kind: 'dominance',
          },
        ]
      : [];

    return res.status(200).json({
      snapshotDate: overview?.snapshot_date || 'October 2, 2026',
      marketStats,
      movers,
    });
  } catch (err) {
    console.error('[/api/overview]', err);
    return res.status(500).json({ error: 'Failed to fetch overview' });
  }
}
