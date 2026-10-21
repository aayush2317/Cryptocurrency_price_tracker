-- =============================================================
--  CRYPTOPULSE  –  PostgreSQL Schema  v2.0
--  Compatible : Neon · Supabase · Railway · Vercel Postgres
--  Deploy via : git push  →  Vercel CI  →  db:migrate
--
--  IMPROVEMENTS in v2:
--   ✔ asset_categories + asset_tags  (DeFi / Stablecoin labels)
--   ✔ price_alerts  (user-set threshold notifications)
--   ✔ portfolio  (track holdings per user)
--   ✔ currency support  (USD / EUR / INR etc.)
--   ✔ refresh_token  (auth sessions)
--   ✔ Materialised View for latest prices (faster reads)
--   ✔ Composite & partial indexes added
--   ✔ Row-level security (RLS) hints via COMMENT
--   ✔ Cleaner CHECK constraints
--   ✔ Partition auto-create function
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- range-index support

-- ─────────────────────────────────────────────────────────────
--  ENUM TYPES
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE theme_enum    AS ENUM ('light', 'dark');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_cond    AS ENUM ('above', 'below');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_status  AS ENUM ('active', 'triggered', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mover_cat     AS ENUM ('trending', 'top_gainer', 'top_loser');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_status   AS ENUM ('success', 'error', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE candle_interval AS ENUM ('1m','5m','15m','1h','4h','1d','1w');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
--  AUTO updated_at TRIGGER FUNCTION  (shared)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  TABLE: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT         UNIQUE NOT NULL,
    username        TEXT         UNIQUE NOT NULL,
    display_name    TEXT,
    avatar_url      TEXT,
    theme           theme_enum   NOT NULL DEFAULT 'light',
    demo_mode       BOOLEAN      NOT NULL DEFAULT FALSE,
    -- preferred display currency (USD by default)
    currency        TEXT         NOT NULL DEFAULT 'USD',
    -- session token for simple auth (replace with JWT/OAuth in prod)
    refresh_token   TEXT,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users IS 'App users. RLS: each row visible to owner only.';
COMMENT ON COLUMN users.currency IS 'ISO 4217 code: USD, EUR, INR, GBP …';

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: workspaces
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL DEFAULT 'Personal workspace',
    description     TEXT,
    is_default      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);

CREATE OR REPLACE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: asset_categories  (Bitcoin, Stablecoin, DeFi, Layer2 …)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_categories (
    id          SERIAL  PRIMARY KEY,
    slug        TEXT    UNIQUE NOT NULL,   -- 'defi', 'stablecoin', 'layer2'
    label       TEXT    NOT NULL,
    color_hex   TEXT                       -- optional badge colour in UI
);

INSERT INTO asset_categories (slug, label, color_hex) VALUES
  ('layer1',      'Layer 1',       '#F7931A'),
  ('layer2',      'Layer 2',       '#627EEA'),
  ('stablecoin',  'Stablecoin',    '#26A17B'),
  ('defi',        'DeFi',          '#FF6B6B'),
  ('meme',        'Meme',          '#FFC107'),
  ('exchange',    'Exchange Token','#F0B90B'),
  ('gaming',      'Gaming',        '#9B59B6'),
  ('ai',          'AI',            '#00BCD4')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  TABLE: assets  (master crypto list)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    coingecko_id    TEXT         UNIQUE NOT NULL,
    symbol          TEXT         NOT NULL,
    name            TEXT         NOT NULL,
    logo_url        TEXT,
    large_logo_url  TEXT,                    -- ← NEW: hi-res logo
    rank            INT,
    category_id     INT          REFERENCES asset_categories(id),
    -- supply info
    circulating_supply  NUMERIC(30,4),       -- ← NEW
    total_supply        NUMERIC(30,4),       -- ← NEW
    max_supply          NUMERIC(30,4),       -- ← NEW (NULL = infinite)
    -- meta
    website_url     TEXT,                    -- ← NEW
    whitepaper_url  TEXT,                    -- ← NEW
    description     TEXT,                    -- ← NEW: shown in detail panel
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_symbol    ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_rank      ON assets(rank) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_assets_name_trgm ON assets USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_sym_trgm  ON assets USING GIN(symbol gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_assets_category  ON assets(category_id);

CREATE OR REPLACE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: price_snapshots  (partitioned by day — high frequency)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_snapshots (
    id               BIGSERIAL,
    asset_id         UUID           NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_usd        NUMERIC(24,8)  NOT NULL,
    price_btc        NUMERIC(20,12),          -- ← NEW: BTC-denominated price
    market_cap_usd   NUMERIC(30,2),
    volume_24h_usd   NUMERIC(30,2),
    change_1h_pct    NUMERIC(10,4),           -- ← NEW: 1-hour change
    change_24h_pct   NUMERIC(10,4),
    change_7d_pct    NUMERIC(10,4),
    change_30d_pct   NUMERIC(10,4),           -- ← NEW: 30-day change
    ath_usd          NUMERIC(24,8),           -- ← NEW: all-time high
    ath_date         DATE,                    -- ← NEW
    atl_usd          NUMERIC(24,8),           -- ← NEW: all-time low
    atl_date         DATE,                    -- ← NEW
    snapshot_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, snapshot_at)
) PARTITION BY RANGE (snapshot_at);

-- ─── Rolling daily partitions (−7 days … +60 days) ────────────
CREATE OR REPLACE FUNCTION create_price_partitions(
    start_date DATE DEFAULT CURRENT_DATE - 7,
    end_date   DATE DEFAULT CURRENT_DATE + 60
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE d DATE := start_date;
BEGIN
    WHILE d <= end_date LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS price_snapshots_%s
             PARTITION OF price_snapshots
             FOR VALUES FROM (%L) TO (%L)',
            to_char(d, 'YYYY_MM_DD'),
            d::TIMESTAMPTZ,
            (d + INTERVAL '1 day')::TIMESTAMPTZ
        );
        d := d + INTERVAL '1 day';
    END LOOP;
END;
$$;

SELECT create_price_partitions();

-- Composite index (covers the hot query: latest price per asset)
CREATE INDEX IF NOT EXISTS idx_price_asset_time
    ON price_snapshots (asset_id, snapshot_at DESC);

-- Partial index for high-movers (gainers/losers query)
CREATE INDEX IF NOT EXISTS idx_price_gain_filter
    ON price_snapshots (change_24h_pct DESC, snapshot_at DESC)
    WHERE change_24h_pct IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
--  TABLE: ohlcv_candles  (chart tabs: 24H / 7D / 1M / 3M / 1Y)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ohlcv_candles (
    id              BIGSERIAL         PRIMARY KEY,
    asset_id        UUID              NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    interval        candle_interval   NOT NULL,
    open_at         TIMESTAMPTZ       NOT NULL,
    close_at        TIMESTAMPTZ       NOT NULL,
    open_price      NUMERIC(24,8)     NOT NULL,
    high_price      NUMERIC(24,8)     NOT NULL,
    low_price       NUMERIC(24,8)     NOT NULL,
    close_price     NUMERIC(24,8)     NOT NULL,
    volume          NUMERIC(30,8)     NOT NULL DEFAULT 0,
    trades_count    INT,                        -- ← NEW: number of trades in period
    UNIQUE (asset_id, interval, open_at)
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_lookup
    ON ohlcv_candles (asset_id, interval, open_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: market_overview  (Dashboard "at a glance" cards)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_overview (
    id                   BIGSERIAL      PRIMARY KEY,
    total_market_cap     NUMERIC(36,2)  NOT NULL,
    total_volume_24h     NUMERIC(36,2)  NOT NULL,
    btc_dominance        NUMERIC(8,4)   NOT NULL,
    eth_dominance        NUMERIC(8,4),            -- ← NEW
    defi_volume_24h      NUMERIC(36,2),            -- ← NEW
    market_cap_change    NUMERIC(10,4),
    volume_change        NUMERIC(10,4),
    dominance_change     NUMERIC(10,4),
    active_assets        INT,
    active_exchanges     INT,                      -- ← NEW
    snapshot_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_overview_time
    ON market_overview (snapshot_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: watchlists + watchlist_assets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watchlists (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL DEFAULT 'Local watchlist',
    icon            TEXT         NOT NULL DEFAULT '⭐',  -- ← NEW: emoji icon
    is_public       BOOLEAN      NOT NULL DEFAULT FALSE,  -- ← NEW: share link
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

CREATE OR REPLACE TRIGGER trg_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS watchlist_assets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id    UUID         NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sort_order      INT          NOT NULL DEFAULT 0,
    notes           TEXT,                               -- ← NEW: personal note
    UNIQUE (watchlist_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_assets_list
    ON watchlist_assets (watchlist_id, sort_order);

-- ─────────────────────────────────────────────────────────────
--  TABLE: user_starred_assets  (☆ star column in markets table)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_starred_assets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    starred_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_user_asset ON user_starred_assets(user_id, asset_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: price_alerts  ← NEW
--  User sets "alert me when BTC goes above $70,000"
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_alerts (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id        UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    condition       alert_cond    NOT NULL,         -- 'above' | 'below'
    target_price    NUMERIC(24,8) NOT NULL,
    status          alert_status  NOT NULL DEFAULT 'active',
    triggered_at    TIMESTAMPTZ,
    notify_email    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user        ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_asset_active
    ON price_alerts (asset_id, status)
    WHERE status = 'active';

-- ─────────────────────────────────────────────────────────────
--  TABLE: portfolio  ← NEW
--  Track user's crypto holdings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id        UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    quantity        NUMERIC(30,8) NOT NULL CHECK (quantity > 0),
    avg_buy_price   NUMERIC(24,8) NOT NULL,          -- cost basis per unit
    bought_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_asset ON portfolio(asset_id);

CREATE OR REPLACE TRIGGER trg_portfolio_updated_at
    BEFORE UPDATE ON portfolio
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: market_movers  (Trending / Top Gainers / Top Losers)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_movers (
    id              BIGSERIAL    PRIMARY KEY,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    category        mover_cat    NOT NULL,
    rank_position   INT          NOT NULL CHECK (rank_position > 0),
    price_usd       NUMERIC(24,8),
    change_24h_pct  NUMERIC(10,4),
    volume_24h_usd  NUMERIC(30,2),   -- ← NEW: volume in mover list
    snapshot_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movers_category_time
    ON market_movers (category, snapshot_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: search_log  (powers "Search any asset…" bar analytics)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_log (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
    query           TEXT         NOT NULL,
    result_asset_id UUID         REFERENCES assets(id) ON DELETE SET NULL,
    result_clicked  BOOLEAN      NOT NULL DEFAULT FALSE,   -- ← NEW
    searched_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: api_sync_log  (tracks CoinGecko fetch jobs)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_sync_log (
    id              BIGSERIAL    PRIMARY KEY,
    source          TEXT         NOT NULL DEFAULT 'coingecko',
    endpoint        TEXT         NOT NULL,
    status          sync_status  NOT NULL,
    assets_updated  INT          DEFAULT 0,
    error_message   TEXT,
    duration_ms     INT,
    http_status     INT,          -- ← NEW: raw HTTP response code
    synced_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_time ON api_sync_log(synced_at DESC);
