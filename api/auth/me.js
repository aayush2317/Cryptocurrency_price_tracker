// api/auth/me.js
// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Returns authenticated user profile from Bearer token or Cookie
// ─────────────────────────────────────────────────────────────

import { getUserBySessionToken } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let token = null;

  // 1. Check Bearer Authorization header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  // 2. Check HttpOnly cookie
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/cryptopulse_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const user = await getUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[/api/auth/me]', err);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}
