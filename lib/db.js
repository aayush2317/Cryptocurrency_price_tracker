// =============================================================
//  CRYPTOPULSE  –  Database Client  v3.0  (lib/db.js)
//  Compatible with standard Node.js & Vercel Serverless Functions
// =============================================================

import pg from 'pg';

const { Pool } = pg;

// Singleton pool for serverless connection reuse
let pool;

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL;

    pool = new Pool({
      connectionString,
      ssl: connectionString && !connectionString.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

// ─────────────────────────────────────────────────────────────
//  COINS (Matching src/data/coins.js schema)
// ─────────────────────────────────────────────────────────────

/**
 * Returns all coins formatted exactly as src/data/coins.js expects
 */
export async function getCoins() {
  const res = await query(`
    SELECT
      id,
      name,
      symbol,
      price::FLOAT,
      change::FLOAT,
      "marketCap"::BIGINT,
      volume::BIGINT,
      "circulatingSupply"::BIGINT,
      "maxSupply"::BIGINT,
      ath::FLOAT,
      category,
      color,
      rank
    FROM mv_latest_prices
    ORDER BY rank ASC
  `);
  return res.rows;
}

/**
 * Single coin detail
 */
export async function getCoinById(id) {
  const res = await query(
    `SELECT * FROM mv_latest_prices WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD & MARKET MOVERS
// ─────────────────────────────────────────────────────────────

export async function getMarketOverview() {
  const res = await query(`SELECT * FROM v_market_overview`);
  return res.rows[0] || null;
}

export async function getMarketMovers(category = 'trending') {
  const res = await query(
    `SELECT * FROM v_market_movers WHERE category = $1 ORDER BY rank_position ASC LIMIT 5`,
    [category]
  );
  return res.rows;
}

export async function getAllMovers() {
  const [trending, gainers, losers] = await Promise.all([
    getMarketMovers('trending'),
    getMarketMovers('top_gainer'),
    getMarketMovers('top_loser'),
  ]);
  return { trending, gainers, losers };
}

// ─────────────────────────────────────────────────────────────
//  HISTORICAL CHART DATA (Recharts support)
// ─────────────────────────────────────────────────────────────

export async function getHistory(coinSlug, period = '7D') {
  const res = await query(
    `
    SELECT c.timestamp_ms AS timestamp, c.price::FLOAT
    FROM ohlcv_candles c
    JOIN assets a ON a.id = c.asset_id
    WHERE a.slug = $1 AND c.period = $2
    ORDER BY c.timestamp_ms ASC
    `,
    [coinSlug, period]
  );
  return res.rows;
}

// ─────────────────────────────────────────────────────────────
//  AUTHENTICATION (Supports AuthPage.jsx)
// ─────────────────────────────────────────────────────────────

/**
 * Create a new user with secure password hash
 */
export async function createUser({ name, email, passwordHash }) {
  const res = await query(
    `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, LOWER($2), $3)
    RETURNING id, name, email, created_at
    `,
    [name, email, passwordHash]
  );
  return res.rows[0];
}

/**
 * Find user by email
 */
export async function getUserByEmail(email) {
  const res = await query(
    `SELECT id, name, email, password_hash FROM users WHERE email = LOWER($1) LIMIT 1`,
    [email]
  );
  return res.rows[0] || null;
}

/**
 * Create session token
 */
export async function createSession(userId, token, expiresAt) {
  await query(
    `INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
}

/**
 * Verify session token and return user
 */
export async function getUserBySessionToken(token) {
  const res = await query(
    `
    SELECT u.id, u.name, u.email, u.theme, u.currency
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = $1 AND s.expires_at > NOW()
    LIMIT 1
    `,
    [token]
  );
  return res.rows[0] || null;
}

/**
 * Delete session (Logout)
 */
export async function deleteSession(token) {
  await query(`DELETE FROM user_sessions WHERE token = $1`, [token]);
}

// ─────────────────────────────────────────────────────────────
//  WATCHLIST & STARRED ASSETS
// ─────────────────────────────────────────────────────────────

export async function getUserWatchlist(userId) {
  const res = await query(
    `
    SELECT
      a.slug AS id, a.name, a.symbol, a.color_hex AS color, a.category,
      lp.price, lp.change, lp."marketCap", lp.volume
    FROM watchlist_assets wa
    JOIN watchlists w ON w.id = wa.watchlist_id
    JOIN assets a ON a.id = wa.asset_id
    JOIN mv_latest_prices lp ON lp.asset_id = wa.asset_id
    WHERE w.user_id = $1
    ORDER BY wa.sort_order ASC
    `,
    [userId]
  );
  return res.rows;
}

export async function toggleStar(userId, assetSlug) {
  const assetRes = await query(`SELECT id FROM assets WHERE slug = $1`, [assetSlug]);
  if (!assetRes.rows.length) return { error: 'Asset not found' };
  const assetId = assetRes.rows[0].id;

  const check = await query(
    `SELECT id FROM user_starred_assets WHERE user_id = $1 AND asset_id = $2`,
    [userId, assetId]
  );

  if (check.rows.length > 0) {
    await query(
      `DELETE FROM user_starred_assets WHERE user_id = $1 AND asset_id = $2`,
      [userId, assetId]
    );
    return { starred: false };
  } else {
    await query(
      `INSERT INTO user_starred_assets (user_id, asset_id) VALUES ($1, $2)`,
      [userId, assetId]
    );
    return { starred: true };
  }
}
