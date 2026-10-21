// =============================================================
//  CRYPTOPULSE  –  Database Client  v2.0  (lib/db.js)
//  Uses: @vercel/postgres
// =============================================================

import { sql } from '@vercel/postgres';

// ─────────────────────────────────────────────────────────────
//  MARKETS
// ─────────────────────────────────────────────────────────────

/** Paginated asset list from the fast materialized view */
export async function getMarketAssets({ page = 1, limit = 8, sort = 'rank' } = {}) {
  const offset = (page - 1) * limit;
  const { rows } = await sql`
    SELECT
      asset_id, coingecko_id, symbol, name, logo_url, rank,
      category_label, category_color,
      price_usd, price_btc, market_cap_usd, volume_24h_usd,
      change_1h_pct, change_24h_pct, change_7d_pct, change_30d_pct,
      circulating_supply, max_supply,
      ath_usd, snapshot_at
    FROM mv_latest_prices
    ORDER BY rank ASC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows;
}

/** Total count for "Showing 1-8 of 16" */
export async function getAssetCount() {
  const { rows } = await sql`
    SELECT COUNT(*) AS count FROM assets WHERE is_active = TRUE
  `;
  return parseInt(rows[0].count, 10);
}

/** Single asset detail */
export async function getAssetBySymbol(symbol) {
  const { rows } = await sql`
    SELECT * FROM mv_latest_prices
    WHERE symbol = UPPER(${symbol})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD OVERVIEW
// ─────────────────────────────────────────────────────────────

/** Dashboard cards: total market cap, volume, BTC dominance */
export async function getMarketOverview() {
  const { rows } = await sql`SELECT * FROM v_market_overview`;
  return rows[0] ?? null;
}

/** Market movers tabs */
export async function getMarketMovers(category = 'trending', limit = 5) {
  const { rows } = await sql`
    SELECT category, rank_position, asset_id, symbol, name,
           logo_url, price_usd, change_24h_pct, volume_24h_usd
    FROM v_market_movers
    WHERE category = ${category}
    ORDER BY rank_position
    LIMIT ${limit}
  `;
  return rows;
}

/** All 3 mover categories in one round-trip */
export async function getAllMovers() {
  const [trending, gainers, losers] = await Promise.all([
    getMarketMovers('trending',   5),
    getMarketMovers('top_gainer', 5),
    getMarketMovers('top_loser',  5),
  ]);
  return { trending, gainers, losers };
}

// ─────────────────────────────────────────────────────────────
//  CHARTS
// ─────────────────────────────────────────────────────────────

/**
 * OHLCV candles for chart tabs
 * @param {string} assetId   UUID
 * @param {string} interval  '1m'|'5m'|'15m'|'1h'|'4h'|'1d'|'1w'
 * @param {number} days      lookback window (7 = 7D tab, 30 = 1M tab …)
 */
export async function getCandles(assetId, interval = '1h', days = 7) {
  const { rows } = await sql`
    SELECT open_at, open_price, high_price, low_price, close_price, volume, trades_count
    FROM ohlcv_candles
    WHERE asset_id = ${assetId}
      AND interval  = ${interval}::candle_interval
      AND open_at  >= NOW() - (${days}::TEXT || ' days')::INTERVAL
    ORDER BY open_at ASC
  `;
  return rows;
}

// ─────────────────────────────────────────────────────────────
//  WATCHLIST
// ─────────────────────────────────────────────────────────────

/** Watchlist items with live prices */
export async function getUserWatchlist(watchlistId) {
  const { rows } = await sql`
    SELECT
      wa.sort_order, wa.notes,
      a.symbol, a.name, a.logo_url,
      lp.price_usd, lp.change_24h_pct,
      lp.market_cap_usd, lp.volume_24h_usd
    FROM watchlist_assets wa
    JOIN assets           a  ON a.id  = wa.asset_id
    JOIN mv_latest_prices lp ON lp.asset_id = wa.asset_id
    WHERE wa.watchlist_id = ${watchlistId}
    ORDER BY wa.sort_order
  `;
  return rows;
}

/** Add an asset to a watchlist */
export async function addToWatchlist(watchlistId, assetId, sortOrder = 99) {
  await sql`
    INSERT INTO watchlist_assets (watchlist_id, asset_id, sort_order)
    VALUES (${watchlistId}, ${assetId}, ${sortOrder})
    ON CONFLICT DO NOTHING
  `;
}

/** Remove an asset from a watchlist */
export async function removeFromWatchlist(watchlistId, assetId) {
  await sql`
    DELETE FROM watchlist_assets
    WHERE watchlist_id = ${watchlistId} AND asset_id = ${assetId}
  `;
}

// ─────────────────────────────────────────────────────────────
//  STARRED ASSETS (☆ column)
// ─────────────────────────────────────────────────────────────

export async function getStarredAssets(userId) {
  const { rows } = await sql`
    SELECT a.symbol, a.name, a.logo_url,
           lp.price_usd, lp.change_24h_pct
    FROM user_starred_assets us
    JOIN assets           a  ON a.id       = us.asset_id
    JOIN mv_latest_prices lp ON lp.asset_id = us.asset_id
    WHERE us.user_id = ${userId}
    ORDER BY a.rank
  `;
  return rows;
}

export async function toggleStarAsset(userId, assetId) {
  const { rows } = await sql`
    SELECT id FROM user_starred_assets
    WHERE user_id = ${userId} AND asset_id = ${assetId}
  `;
  if (rows.length > 0) {
    await sql`
      DELETE FROM user_starred_assets
      WHERE user_id = ${userId} AND asset_id = ${assetId}
    `;
    return { starred: false };
  }
  await sql`
    INSERT INTO user_starred_assets (user_id, asset_id)
    VALUES (${userId}, ${assetId})
    ON CONFLICT DO NOTHING
  `;
  return { starred: true };
}

// ─────────────────────────────────────────────────────────────
//  PORTFOLIO  ← NEW
// ─────────────────────────────────────────────────────────────

/** All holdings for a user with live P&L */
export async function getPortfolio(userId) {
  const { rows } = await sql`
    SELECT * FROM v_portfolio_value
    WHERE user_id = ${userId}
    ORDER BY current_value_usd DESC
  `;
  return rows;
}

/** Summary card: total value, P&L */
export async function getPortfolioSummary(userId) {
  const { rows } = await sql`SELECT * FROM get_portfolio_summary(${userId})`;
  return rows[0] ?? null;
}

/** Add a new holding */
export async function addHolding(userId, assetId, quantity, avgBuyPrice, notes = null) {
  const { rows } = await sql`
    INSERT INTO portfolio (user_id, asset_id, quantity, avg_buy_price, notes)
    VALUES (${userId}, ${assetId}, ${quantity}, ${avgBuyPrice}, ${notes})
    RETURNING id
  `;
  return rows[0];
}

// ─────────────────────────────────────────────────────────────
//  PRICE ALERTS  ← NEW
// ─────────────────────────────────────────────────────────────

/** Active alerts for a user, sorted by how close to trigger */
export async function getUserAlerts(userId) {
  const { rows } = await sql`
    SELECT * FROM v_active_alerts
    WHERE user_id = ${userId}
    ORDER BY distance_pct ASC
  `;
  return rows;
}

/** Create a new price alert */
export async function createAlert(userId, assetId, condition, targetPrice) {
  const { rows } = await sql`
    INSERT INTO price_alerts (user_id, asset_id, condition, target_price)
    VALUES (${userId}, ${assetId}, ${condition}::alert_cond, ${targetPrice})
    RETURNING id, condition, target_price
  `;
  return rows[0];
}

/** Dismiss an alert */
export async function dismissAlert(alertId, userId) {
  await sql`
    UPDATE price_alerts SET status = 'dismissed'
    WHERE id = ${alertId} AND user_id = ${userId}
  `;
}

// ─────────────────────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────────────────────

/** Fuzzy search using the materialized view (instant) */
export async function searchAssets(query, limit = 10) {
  const like = `%${query}%`;
  const { rows } = await sql`
    SELECT asset_id, symbol, name, logo_url, rank,
           price_usd, change_24h_pct, category_label
    FROM mv_latest_prices
    WHERE name   ILIKE ${like}
       OR symbol ILIKE ${like}
    ORDER BY rank ASC NULLS LAST
    LIMIT ${limit}
  `;
  return rows;
}
