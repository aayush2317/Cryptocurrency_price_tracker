// =============================================================
//  CRYPTOPULSE  –  CoinGecko Live Data Sync  v3.0 (lib/syncPrices.js)
//  Synchronizes real-time prices & refreshes materialized views
// =============================================================

import { query } from './db.js';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Map CoinGecko IDs to our slug definitions
const SLUG_MAP = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  tether: 'tether',
  binancecoin: 'bnb',
  solana: 'solana',
  'usd-coin': 'usd-coin',
  ripple: 'xrp',
  dogecoin: 'dogecoin',
  'the-open-network': 'toncoin',
  toncoin: 'toncoin',
  cardano: 'cardano',
  'avalanche-2': 'avalanche',
  chainlink: 'chainlink',
  polkadot: 'polkadot',
  uniswap: 'uniswap',
  near: 'near',
  pepe: 'pepe',
};

export async function syncPrices() {
  const start = Date.now();
  let updatedCount = 0;

  try {
    // 1. Fetch live market prices from CoinGecko
    const ids = Object.keys(SLUG_MAP).join(',');
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(process.env.COINGECKO_API_KEY
          ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
          : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API returned status ${res.status}`);
    }

    const coinsData = await res.json();

    // 2. Insert new price snapshots
    for (const coin of coinsData) {
      const slug = SLUG_MAP[coin.id] || coin.id;

      // Find asset
      const assetRes = await query(`SELECT id FROM assets WHERE slug = $1`, [slug]);
      if (!assetRes.rows.length) continue;
      const assetId = assetRes.rows[0].id;

      // Insert snapshot
      await query(
        `
        INSERT INTO price_snapshots
          (asset_id, price_usd, market_cap_usd, volume_24h_usd, change_24h_pct, change_7d_pct)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          assetId,
          coin.current_price,
          coin.market_cap,
          coin.total_volume,
          coin.price_change_percentage_24h,
          coin.price_change_percentage_7d_in_currency || 0,
        ]
      );

      // Record latest candle point for charts
      await query(
        `
        INSERT INTO ohlcv_candles (asset_id, period, timestamp_ms, price)
        VALUES ($1, '24H', $2, $3)
        ON CONFLICT (asset_id, period, timestamp_ms) DO NOTHING
        `,
        [assetId, Date.now(), coin.current_price]
      );

      updatedCount++;
    }

    // 3. FIX for Problem 2:
    // Refresh materialized view FIRST, then refresh market movers!
    await query(`SELECT refresh_all()`);

    // 4. Log successful synchronization
    await query(
      `
      INSERT INTO api_sync_log (source, endpoint, status, assets_updated, duration_ms)
      VALUES ('coingecko', '/coins/markets', 'success', $1, $2)
      `,
      [updatedCount, Date.now() - start]
    );

    return { ok: true, assetsUpdated: updatedCount, durationMs: Date.now() - start };
  } catch (err) {
    console.error('[syncPrices] Error:', err);
    await query(
      `
      INSERT INTO api_sync_log (source, endpoint, status, error_message, duration_ms)
      VALUES ('coingecko', '/coins/markets', 'error', $1, $2)
      `,
      [err.message, Date.now() - start]
    );
    throw err;
  }
}
