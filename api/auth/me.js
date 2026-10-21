// api/auth/me.js
// ─────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Returns authenticated user profile from Bearer token
// ─────────────────────────────────────────────────────────────

import { getUserBySessionToken } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await getUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[/api/auth/me]', err);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}
