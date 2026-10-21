// api/watchlist.js
// ─────────────────────────────────────────────────────────────
//  GET /api/watchlist  –  Get user watchlist
//  POST /api/watchlist –  Toggle star on asset (Auth REQUIRED)
// ─────────────────────────────────────────────────────────────

import { getUserBySessionToken, getUserWatchlist, toggleStar } from '../lib/db.js';

function getToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace(/^Bearer\s+/i, '').trim();
  }
  // Also support cookie if set
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/cryptopulse_session=([^;]+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  const token = getToken(req);
  const user = token ? await getUserBySessionToken(token) : null;

  if (req.method === 'GET') {
    try {
      if (user) {
        // Return authenticated user's private watchlist
        const list = await getUserWatchlist(user.id);
        return res.status(200).json({ watchlist: list, authenticated: true, userId: user.id });
      } else {
        // Unauthenticated visitor: return default demo watchlist read-only
        const demoUserId = 'aaaaaaaa-0000-0000-0000-000000000001';
        const list = await getUserWatchlist(demoUserId);
        return res.status(200).json({ watchlist: list, authenticated: false, readOnly: true });
      }
    } catch (err) {
      console.error('[/api/watchlist GET]', err);
      return res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }

  if (req.method === 'POST') {
    // Problem 4 fix: Real watchlist modifications REQUIRE an authenticated session
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in to save assets to your personal watchlist.',
      });
    }

    try {
      const { coinId, symbol } = req.body || {};
      const targetSlug = coinId || symbol?.toLowerCase();

      if (!targetSlug) {
        return res.status(400).json({ error: 'Coin identifier required' });
      }

      const result = await toggleStar(user.id, targetSlug);
      return res.status(200).json({ ...result, authenticated: true });
    } catch (err) {
      console.error('[/api/watchlist POST]', err);
      return res.status(500).json({ error: 'Failed to update watchlist' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
