-- =============================================================
--  CRYPTOPULSE  –  Views, Materialised View & Functions  v2.0
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  MATERIALISED VIEW: mv_latest_prices
--  Refreshed every 60s by cron → fastest possible dashboard read
-- ─────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_latest_prices AS
SELECT DISTINCT ON (ps.asset_id)
    a.id              AS asset_id,
    a.coingecko_id,
    a.symbol,
    a.name,
    a.logo_url,
    a.large_logo_url,
    a.rank,
    a.category_id,
    ac.label          AS category_label,
    ac.color_hex      AS category_color,
    a.circulating_supply,
    a.max_supply,
    ps.price_usd,
    ps.price_btc,
    ps.market_cap_usd,
    ps.volume_24h_usd,
    ps.change_1h_pct,
    ps.change_24h_pct,
    ps.change_7d_pct,
    ps.change_30d_pct,
    ps.ath_usd,
    ps.ath_date,
    ps.snapshot_at
FROM assets a
LEFT JOIN price_snapshots ps ON ps.asset_id = a.id
LEFT JOIN asset_categories ac ON ac.id = a.category_id
WHERE a.is_active = TRUE
ORDER BY ps.asset_id, ps.snapshot_at DESC
WITH NO DATA;

-- Populate on first run
REFRESH MATERIALIZED VIEW mv_latest_prices;

-- Unique index so we can use CONCURRENTLY refresh later
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_latest_prices_asset
    ON mv_latest_prices (asset_id);

-- ─────────────────────────────────────────────────────────────
--  REGULAR VIEW: v_market_overview  (latest row only)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_market_overview AS
SELECT *
FROM market_overview
ORDER BY snapshot_at DESC
LIMIT 1;

-- ─────────────────────────────────────────────────────────────
--  REGULAR VIEW: v_market_movers  (latest snapshot per category)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_market_movers AS
SELECT DISTINCT ON (mm.category, mm.rank_position)
    mm.category,
    mm.rank_position,
    a.id              AS asset_id,
    a.symbol,
    a.name,
    a.logo_url,
    mm.price_usd,
    mm.change_24h_pct,
    mm.volume_24h_usd,
    mm.snapshot_at
FROM market_movers mm
JOIN assets a ON a.id = mm.asset_id
ORDER BY mm.category, mm.rank_position, mm.snapshot_at DESC;

-- ─────────────────────────────────────────────────────────────
--  REGULAR VIEW: v_portfolio_value  ← NEW
--  Joins user holdings with live prices → P&L per holding
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_portfolio_value AS
SELECT
    p.user_id,
    p.id            AS holding_id,
    a.symbol,
    a.name,
    a.logo_url,
    p.quantity,
    p.avg_buy_price,
    lp.price_usd    AS current_price,
    ROUND(p.quantity * lp.price_usd, 2)               AS current_value_usd,
    ROUND(p.quantity * p.avg_buy_price, 2)             AS cost_basis_usd,
    ROUND((lp.price_usd - p.avg_buy_price)
          / p.avg_buy_price * 100, 2)                 AS pnl_pct,
    ROUND(p.quantity * (lp.price_usd - p.avg_buy_price), 2) AS pnl_usd,
    p.bought_at,
    p.notes
FROM portfolio p
JOIN assets a         ON a.id = p.asset_id
JOIN mv_latest_prices lp ON lp.asset_id = p.asset_id;

-- ─────────────────────────────────────────────────────────────
--  REGULAR VIEW: v_active_alerts  ← NEW
--  Active alerts annotated with current price so UI can show
--  how far away from trigger the price is
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    pa.id,
    pa.user_id,
    a.symbol,
    a.name,
    a.logo_url,
    pa.condition,
    pa.target_price,
    lp.price_usd  AS current_price,
    ROUND(ABS(lp.price_usd - pa.target_price) / pa.target_price * 100, 2)
                  AS distance_pct,
    pa.status,
    pa.created_at
FROM price_alerts pa
JOIN assets a         ON a.id = pa.asset_id
JOIN mv_latest_prices lp ON lp.asset_id = pa.asset_id
WHERE pa.status = 'active';

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: upsert_price_snapshot (called by cron sync worker)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION upsert_price_snapshot(
    p_coingecko_id  TEXT,
    p_price_usd     NUMERIC,
    p_price_btc     NUMERIC    DEFAULT NULL,
    p_market_cap    NUMERIC    DEFAULT NULL,
    p_volume_24h    NUMERIC    DEFAULT NULL,
    p_change_1h     NUMERIC    DEFAULT NULL,
    p_change_24h    NUMERIC    DEFAULT NULL,
    p_change_7d     NUMERIC    DEFAULT NULL,
    p_change_30d    NUMERIC    DEFAULT NULL,
    p_ath           NUMERIC    DEFAULT NULL,
    p_ath_date      DATE       DEFAULT NULL,
    p_atl           NUMERIC    DEFAULT NULL,
    p_atl_date      DATE       DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v_asset_id UUID;
BEGIN
    SELECT id INTO v_asset_id FROM assets WHERE coingecko_id = p_coingecko_id;
    IF v_asset_id IS NULL THEN
        RAISE WARNING '[upsert_price_snapshot] unknown asset: %', p_coingecko_id;
        RETURN;
    END IF;

    INSERT INTO price_snapshots (
        asset_id, price_usd, price_btc, market_cap_usd, volume_24h_usd,
        change_1h_pct, change_24h_pct, change_7d_pct, change_30d_pct,
        ath_usd, ath_date, atl_usd, atl_date
    ) VALUES (
        v_asset_id, p_price_usd, p_price_btc, p_market_cap, p_volume_24h,
        p_change_1h, p_change_24h, p_change_7d, p_change_30d,
        p_ath, p_ath_date, p_atl, p_atl_date
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: refresh_market_movers (called after each price sync)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_market_movers() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    -- Trending: highest 24h volume relative to market cap
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct, volume_24h_usd)
    SELECT asset_id,
           'trending'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY volume_24h_usd DESC NULLS LAST),
           price_usd, change_24h_pct, volume_24h_usd
    FROM mv_latest_prices
    WHERE volume_24h_usd IS NOT NULL
    LIMIT 10;

    -- Top Gainers
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct, volume_24h_usd)
    SELECT asset_id,
           'top_gainer'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY change_24h_pct DESC NULLS LAST),
           price_usd, change_24h_pct, volume_24h_usd
    FROM mv_latest_prices
    WHERE change_24h_pct > 0
    LIMIT 10;

    -- Top Losers
    INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct, volume_24h_usd)
    SELECT asset_id,
           'top_loser'::mover_cat,
           ROW_NUMBER() OVER (ORDER BY change_24h_pct ASC NULLS LAST),
           price_usd, change_24h_pct, volume_24h_usd
    FROM mv_latest_prices
    WHERE change_24h_pct < 0
    LIMIT 10;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: check_price_alerts  ← NEW
--  Run after each price sync to flip triggered alerts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_price_alerts() RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    triggered_count INT := 0;
BEGIN
    UPDATE price_alerts pa
    SET status       = 'triggered',
        triggered_at = NOW()
    FROM mv_latest_prices lp
    WHERE pa.asset_id = lp.asset_id
      AND pa.status   = 'active'
      AND (
          (pa.condition = 'above' AND lp.price_usd >= pa.target_price)
       OR (pa.condition = 'below' AND lp.price_usd <= pa.target_price)
      );

    GET DIAGNOSTICS triggered_count = ROW_COUNT;
    RETURN triggered_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: refresh_all  ← NEW  (single call from cron job)
--  1. Refresh materialised view
--  2. Refresh market movers
--  3. Check price alerts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_all() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_prices;
    PERFORM refresh_market_movers();
    PERFORM check_price_alerts();
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: get_portfolio_summary (user_id) → JSON  ← NEW
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_portfolio_summary(p_user_id UUID)
RETURNS TABLE (
    total_value_usd  NUMERIC,
    total_cost_usd   NUMERIC,
    total_pnl_usd    NUMERIC,
    total_pnl_pct    NUMERIC,
    holdings_count   BIGINT
) LANGUAGE sql STABLE AS $$
    SELECT
        ROUND(SUM(current_value_usd), 2)   AS total_value_usd,
        ROUND(SUM(cost_basis_usd),    2)   AS total_cost_usd,
        ROUND(SUM(pnl_usd),           2)   AS total_pnl_usd,
        CASE WHEN SUM(cost_basis_usd) = 0 THEN 0
             ELSE ROUND(SUM(pnl_usd) / SUM(cost_basis_usd) * 100, 2)
        END                                AS total_pnl_pct,
        COUNT(*)                           AS holdings_count
    FROM v_portfolio_value
    WHERE user_id = p_user_id;
$$;

-- ─────────────────────────────────────────────────────────────
--  READY-TO-RUN QUERIES  (uncomment and use in API layer)
-- ─────────────────────────────────────────────────────────────

-- ① Markets table — paginated, page $1 size $2
-- SELECT asset_id, symbol, name, logo_url, rank, category_label, category_color,
--        price_usd, market_cap_usd, volume_24h_usd,
--        change_1h_pct, change_24h_pct, change_7d_pct, snapshot_at
-- FROM mv_latest_prices
-- ORDER BY rank ASC NULLS LAST
-- LIMIT $2 OFFSET (($1 - 1) * $2);

-- ② Dashboard overview
-- SELECT * FROM v_market_overview;

-- ③ Market movers tabs
-- SELECT * FROM v_market_movers WHERE category = 'trending'   ORDER BY rank_position LIMIT 5;
-- SELECT * FROM v_market_movers WHERE category = 'top_gainer' ORDER BY rank_position LIMIT 5;
-- SELECT * FROM v_market_movers WHERE category = 'top_loser'  ORDER BY rank_position LIMIT 5;

-- ④ Watchlist with live prices
-- SELECT wa.sort_order, a.symbol, a.name, a.logo_url,
--        lp.price_usd, lp.change_24h_pct, lp.market_cap_usd
-- FROM watchlist_assets wa
-- JOIN assets a ON a.id = wa.asset_id
-- JOIN mv_latest_prices lp ON lp.asset_id = wa.asset_id
-- WHERE wa.watchlist_id = $1 ORDER BY wa.sort_order;

-- ⑤ Portfolio P&L for a user
-- SELECT * FROM v_portfolio_value WHERE user_id = $1 ORDER BY current_value_usd DESC;

-- ⑥ Portfolio summary card
-- SELECT * FROM get_portfolio_summary($1);

-- ⑦ Price alerts for a user
-- SELECT * FROM v_active_alerts WHERE user_id = $1 ORDER BY distance_pct ASC;

-- ⑧ Fuzzy asset search
-- SELECT symbol, name, logo_url, rank, category_label
-- FROM mv_latest_prices
-- WHERE name % $1 OR symbol ILIKE $1 || '%'
-- ORDER BY rank LIMIT 10;

-- ⑨ OHLCV chart (7D, 1h candles)
-- SELECT open_at, open_price, high_price, low_price, close_price, volume
-- FROM ohlcv_candles
-- WHERE asset_id = $1 AND interval = '1h'
--   AND open_at >= NOW() - INTERVAL '7 days'
-- ORDER BY open_at ASC;
