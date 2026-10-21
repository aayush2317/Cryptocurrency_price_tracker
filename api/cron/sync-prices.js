// api/cron/sync-prices.js
// ─────────────────────────────────────────────────────────────
//  GET /api/cron/sync-prices
//  Vercel Cron endpoint to fetch live prices from CoinGecko
//  Protected by CRON_SECRET header
// ─────────────────────────────────────────────────────────────

import { syncPrices } from '../../lib/syncPrices.js';

export default async function handler(req, res) {
  // Verify authorization if CRON_SECRET is configured
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  try {
    const result = await syncPrices();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/cron/sync-prices]', err);
    return res.status(500).json({ error: err.message });
  }
}
