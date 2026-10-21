// api/auth/logout.js
// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
//  Terminates session in PostgreSQL and clears HttpOnly cookie
// ─────────────────────────────────────────────────────────────

import { deleteSession } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let token = null;

  // Check Bearer token
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  // Check cookie fallback
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/cryptopulse_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    try {
      await deleteSession(token);
    } catch (err) {
      console.error('[logout error]', err);
    }
  }

  // Clear HttpOnly cookie
  res.setHeader(
    'Set-Cookie',
    'cryptopulse_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );

  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
}
