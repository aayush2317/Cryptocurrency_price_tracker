// api/auth/login.js
// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Handles login form from AuthPage.jsx:
//  - email
//  - password
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createSession } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Lookup user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password with stored bcrypt hash
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate session token (30 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await createSession(user.id, token, expiresAt);

    // Problem 5: Set secure HttpOnly session cookie
    res.setHeader(
      'Set-Cookie',
      `cryptopulse_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    );

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
}
