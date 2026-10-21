// =============================================================
//  CRYPTOPULSE  –  CoinGecko Live Data Sync  (lib/syncPrices.js)
//  Called by: Vercel Cron Job every 60 seconds
//  Fetches top 100 coins and writes price_snapshots + market_overview
// =============================================================

import { sql } from '@vercel/postgres';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/** Fetch live market data from CoinGecko */
async function fetchCoinGeckoMarkets(page = 1) {
  const url = new URL(`${COINGECKO_BASE}/coins/markets`);
  url.searchParams.set('vs_currency',      'usd');
  url.searchParams.set('order',            'market_cap_desc');
  url.searchParams.set('per_page',         '100');
  url.searchParams.set('page',             String(page));
  url.searchParams.set('sparkline',        'false');
  url.searchParams.set('price_change_percentage', '24h,7d');

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 }         // Next.js ISR cache
  });

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  return res.json();
}

/** Fetch global market stats from CoinGecko */
async function fetchGlobalStats() {
  const res = await fetch(`${COINGECKO_BASE}/global`, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 }
  });
  if (!res.ok) throw new Error(`CoinGecko global error: ${res.status}`);
  const { data } = await res.json();
  return data;
}

/** Main sync function — called by Vercel Cron */
export async function syncPrices() {
  const start = Date.now();
  let assetsUpdated = 0;

  try {
    // 1. Fetch global stats → market_overview table
    const global = await fetchGlobalStats();
    await sql`
      INSERT INTO market_overview
        (total_market_cap, total_volume_24h, btc_dominance,
         market_cap_change, volume_change, dominance_change, active_assets)
      VALUES (
        ${global.total_market_cap.usd},
        ${global.total_volume_24h.usd},
        ${global.market_cap_percentage.btc},
        ${global.market_cap_change_percentage_24h_usd},
        0,
        0,
        ${global.active_cryptocurrencies}
      )
    `;

    // 2. Fetch top-100 coins → upsert assets + price_snapshots
    const coins = await fetchCoinGeckoMarkets(1);

    for (const coin of coins) {
      // Upsert asset metadata
      await sql`
        INSERT INTO assets (coingecko_id, symbol, name, logo_url, rank)
        VALUES (
          ${coin.id},
          ${coin.symbol.toUpperCase()},
          ${coin.name},
          ${coin.image},
          ${coin.market_cap_rank}
        )
        ON CONFLICT (coingecko_id) DO UPDATE SET
          symbol   = EXCLUDED.symbol,
          name     = EXCLUDED.name,
          logo_url = EXCLUDED.logo_url,
          rank     = EXCLUDED.rank,
          updated_at = NOW()
      `;

      // Insert price snapshot
      await sql`
        INSERT INTO price_snapshots
          (asset_id, price_usd, market_cap_usd, volume_24h_usd, change_24h_pct, change_7d_pct)
        SELECT
          id,
          ${coin.current_price},
          ${coin.market_cap},
          ${coin.total_volume},
          ${coin.price_change_percentage_24h},
          ${coin.price_change_percentage_7d_in_currency ?? 0}
        FROM assets WHERE coingecko_id = ${coin.id}
      `;

      assetsUpdated++;
    }

    // 3. Refresh market movers
    await sql`SELECT refresh_market_movers()`;

    // 4. Log success
    await sql`
      INSERT INTO api_sync_log (source, endpoint, status, assets_updated, duration_ms)
      VALUES ('coingecko', '/coins/markets', 'success', ${assetsUpdated}, ${Date.now() - start})
    `;

    return { ok: true, assetsUpdated };

  } catch (err) {
    await sql`
      INSERT INTO api_sync_log (source, endpoint, status, error_message, duration_ms)
      VALUES ('coingecko', '/coins/markets', 'error', ${err.message}, ${Date.now() - start})
    `;
    throw err;
  }
}
