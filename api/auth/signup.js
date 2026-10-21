// api/auth/signup.js
// ─────────────────────────────────────────────────────────────
//  POST /api/auth/signup
//  Handles signup form from AuthPage.jsx:
//  - name (Full name)
//  - email
//  - password (hashed with bcryptjs, confirmPassword checked on frontend)
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, createSession } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash the password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL database
    const user = await createUser({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
    });

    // Generate secure session token (30 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await createSession(user.id, token, expiresAt);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error('[/api/auth/signup]', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
}
