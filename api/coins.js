// api/coins.js
// ─────────────────────────────────────────────────────────────
//  GET /api/coins
//  Returns { coins: [...] } exactly formatted for the frontend
// ─────────────────────────────────────────────────────────────

import { getCoins } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const coins = await getCoins();
    return res.status(200).json({ coins });
  } catch (err) {
    console.error('[/api/coins]', err);
    return res.status(500).json({ error: 'Failed to fetch coins' });
  }
}
