-- =============================================================
--  CRYPTOPULSE  –  Views, Materialized View & Functions  v3.0
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  MATERIALIZED VIEW: mv_latest_prices
--  Fast lookup table for coin data matching frontend coin schema
-- ─────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_latest_prices CASCADE;

CREATE MATERIALIZED VIEW mv_latest_prices AS
SELECT DISTINCT ON (a.id)
    a.id                  AS asset_id,
    a.slug                AS id,                 -- e.g. 'bitcoin' (matches frontend)
    a.name,
    a.symbol,
    COALESCE(ps.price_usd, 0)          AS price,
    COALESCE(ps.change_24h_pct, 0)     AS change,
    COALESCE(ps.market_cap_usd, 0)     AS "marketCap",
    COALESCE(ps.volume_24h_usd, 0)     AS volume,
    a.circulating_supply               AS "circulatingSupply",
    a.max_supply                       AS "maxSupply",
    a.ath,
    a.category,
    a.color_hex                        AS color,
    a.rank,
    a.logo_url,
    a.description,
    ps.snapshot_at
FROM assets a
LEFT JOIN price_snapshots ps ON ps.asset_id = a.id
WHERE a.is_active = TRUE
ORDER BY a.id, ps.snapshot_at DESC NULLS LAST;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_latest_prices_asset
    ON mv_latest_prices (asset_id);

CREATE INDEX IF NOT EXISTS idx_mv_latest_prices_slug
    ON mv_latest_prices (id);

CREATE INDEX IF NOT EXISTS idx_mv_latest_prices_rank
    ON mv_latest_prices (rank);

-- ─────────────────────────────────────────────────────────────
--  VIEW: v_market_overview
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_market_overview AS
SELECT *
FROM market_overview
ORDER BY snapshot_at DESC
LIMIT 1;

-- ─────────────────────────────────────────────────────────────
--  VIEW: v_market_movers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_market_movers AS
SELECT DISTINCT ON (mm.category, mm.rank_position)
    mm.category,
    mm.rank_position,
    a.slug AS id,
    a.symbol,
    a.name,
    a.color_hex AS color,
    mm.price_usd AS price,
    mm.change_24h_pct AS change,
    mm.snapshot_at
FROM market_movers mm
JOIN assets a ON a.id = mm.asset_id
ORDER BY mm.category, mm.rank_position, mm.snapshot_at DESC;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: refresh_market_movers
--  Must be called AFTER mv_latest_prices is refreshed
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_market_movers() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    -- Trending (highest 24h volume)
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct)
    SELECT asset_id, 'trending'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY volume DESC NULLS LAST),
           price, change
    FROM mv_latest_prices
    LIMIT 5;

    -- Top Gainers
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct)
    SELECT asset_id, 'top_gainer'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY change DESC NULLS LAST),
           price, change
    FROM mv_latest_prices
    WHERE change > 0
    LIMIT 5;

    -- Top Losers
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct)
    SELECT asset_id, 'top_loser'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY change ASC NULLS LAST),
           price, change
    FROM mv_latest_prices
    WHERE change < 0
    LIMIT 5;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: refresh_all
--  Fix for Problem 2: Refreshes Materialized View FIRST,
--  then immediately populates Market Movers!
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_all() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    -- 1. Refresh Materialized View first
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_prices;
    -- 2. Populate market movers with newest prices
    PERFORM refresh_market_movers();
END;
$$;
