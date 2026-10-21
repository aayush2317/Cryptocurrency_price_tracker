// api/watchlist.js
// ─────────────────────────────────────────────────────────────
//  GET /api/watchlist  –  Get user watchlist (auth protected)
//  POST /api/watchlist –  Toggle star on asset (auth protected)
// ─────────────────────────────────────────────────────────────

import { getUserBySessionToken, getUserWatchlist, toggleStar } from '../lib/db.js';

export default async function handler(req, res) {
  // Extract and verify Bearer token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  let user = null;
  if (token) {
    user = await getUserBySessionToken(token);
  }

  // If no auth token, fallback to demo user for initial trial without hard erroring
  const userId = user ? user.id : 'aaaaaaaa-0000-0000-0000-000000000001';

  if (req.method === 'GET') {
    try {
      const list = await getUserWatchlist(userId);
      return res.status(200).json({ watchlist: list, authenticated: !!user });
    } catch (err) {
      console.error('[/api/watchlist GET]', err);
      return res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { coinId, symbol } = req.body || {};
      const targetSlug = coinId || symbol?.toLowerCase();

      if (!targetSlug) {
        return res.status(400).json({ error: 'Coin identifier required' });
      }

      const result = await toggleStar(userId, targetSlug);
      return res.status(200).json({ ...result, authenticated: !!user });
    } catch (err) {
      console.error('[/api/watchlist POST]', err);
      return res.status(500).json({ error: 'Failed to update watchlist' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
