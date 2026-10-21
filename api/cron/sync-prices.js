// api/cron/sync-prices.js
// ─────────────────────────────────────────────────────────────
//  GET /api/cron/sync-prices
//  Vercel Cron endpoint to fetch live prices from CoinGecko
//  Strictly protected by CRON_SECRET header
// ─────────────────────────────────────────────────────────────

import { syncPrices } from '../../lib/syncPrices.js';

export default async function handler(req, res) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  // Problem 4 fix: Always require authorization with configured CRON_SECRET
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({
      error: 'Unauthorized: valid CRON_SECRET Bearer token is required to invoke synchronization.',
    });
  }

  try {
    const result = await syncPrices();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/cron/sync-prices]', err);
    return res.status(500).json({ error: err.message });
  }
}
