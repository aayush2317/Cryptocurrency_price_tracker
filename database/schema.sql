-- =============================================================
--  CRYPTOPULSE  –  PostgreSQL Schema  v3.0
--  Compatible : Neon · Supabase · Railway · Vercel Postgres
--  Updated for:
--   ✔ User authentication with name, email, secure password_hash
--   ✔ User sessions table for persistent authentication
--   ✔ Exact 16 coins alignment with frontend (src/data/coins.js)
--   ✔ Daily partitioned price snapshots
--   ✔ Historical OHLCV candles for Recharts price charts
--   ✔ Auto-refreshing triggers & performance indexes
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

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
--  TRIGGER: updated_at helper
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  TABLE: users (Supports AuthPage.jsx signup/login)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,          -- Full name from signup form
    email           VARCHAR(255) UNIQUE NOT NULL,   -- Email address
    password_hash   VARCHAR(255) NOT NULL,          -- Bcrypt hashed password
    avatar_url      TEXT,
    theme           theme_enum   NOT NULL DEFAULT 'light',
    demo_mode       BOOLEAN      NOT NULL DEFAULT FALSE,
    currency        VARCHAR(10)  NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: user_sessions (Authentication tokens)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT         UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON user_sessions(user_id);

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
--  TABLE: asset_categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_categories (
    id          SERIAL       PRIMARY KEY,
    slug        VARCHAR(50)  UNIQUE NOT NULL,
    label       VARCHAR(100) NOT NULL,
    color_hex   VARCHAR(20)
);

INSERT INTO asset_categories (slug, label, color_hex) VALUES
  ('layer-1',      'Layer 1',     '#f7931a'),
  ('stablecoins',  'Stablecoins', '#26a17b'),
  ('defi',         'DeFi',        '#2a5ada'),
  ('meme-coins',   'Meme coins',  '#c5a456')
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  color_hex = EXCLUDED.color_hex;

-- ─────────────────────────────────────────────────────────────
--  TABLE: assets (Matching 16 coins in src/data/coins.js)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                VARCHAR(100) UNIQUE NOT NULL,  -- e.g. 'bitcoin'
    symbol              VARCHAR(20)  NOT NULL,         -- e.g. 'BTC'
    name                VARCHAR(100) NOT NULL,         -- e.g. 'Bitcoin'
    rank                INT          NOT NULL,
    category            VARCHAR(100) NOT NULL DEFAULT 'Layer 1',
    color_hex           VARCHAR(20)  NOT NULL DEFAULT '#f7931a',
    logo_url            TEXT,
    circulating_supply  NUMERIC(30,4),
    max_supply          NUMERIC(30,4),                 -- NULL if unbounded
    ath                 NUMERIC(24,8),                 -- All-time high
    description         TEXT,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_slug      ON assets(slug);
CREATE INDEX IF NOT EXISTS idx_assets_symbol    ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_rank      ON assets(rank);
CREATE INDEX IF NOT EXISTS idx_assets_name_trgm ON assets USING GIN(name gin_trgm_ops);

CREATE OR REPLACE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: price_snapshots (Partitioned by day)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_snapshots (
    id               BIGSERIAL,
    asset_id         UUID           NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_usd        NUMERIC(24,8)  NOT NULL,
    market_cap_usd   NUMERIC(30,2),
    volume_24h_usd   NUMERIC(30,2),
    change_24h_pct   NUMERIC(10,4),
    change_7d_pct    NUMERIC(10,4),
    snapshot_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, snapshot_at)
) PARTITION BY RANGE (snapshot_at);

-- Rolling partition generator
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

CREATE INDEX IF NOT EXISTS idx_price_asset_time
    ON price_snapshots (asset_id, snapshot_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: ohlcv_candles (Powers Recharts 24H/7D/1M charts)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ohlcv_candles (
    id              BIGSERIAL         PRIMARY KEY,
    asset_id        UUID              NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    period          VARCHAR(10)       NOT NULL DEFAULT '7D', -- '24H','7D','1M','3M','1Y','ALL'
    timestamp_ms    BIGINT            NOT NULL,              -- Milliseconds for chart X-axis
    price           NUMERIC(24,8)     NOT NULL,
    recorded_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (asset_id, period, timestamp_ms)
);

CREATE INDEX IF NOT EXISTS idx_candles_lookup
    ON ohlcv_candles (asset_id, period, timestamp_ms ASC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: market_overview (Dashboard Stats Cards)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_overview (
    id                   BIGSERIAL      PRIMARY KEY,
    total_market_cap     NUMERIC(36,2)  NOT NULL,
    total_volume_24h     NUMERIC(36,2)  NOT NULL,
    btc_dominance        NUMERIC(8,4)   NOT NULL,
    market_cap_change    NUMERIC(10,4)  NOT NULL DEFAULT 0,
    volume_change        NUMERIC(10,4)  NOT NULL DEFAULT 0,
    dominance_change     NUMERIC(10,4)  NOT NULL DEFAULT 0,
    snapshot_date        VARCHAR(50)    NOT NULL DEFAULT 'October 2, 2026',
    snapshot_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_overview_time
    ON market_overview (snapshot_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: watchlists & watchlist_assets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watchlists (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL DEFAULT 'Local watchlist',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_assets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id    UUID         NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sort_order      INT          NOT NULL DEFAULT 0,
    UNIQUE (watchlist_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_assets_list
    ON watchlist_assets (watchlist_id, sort_order);

-- ─────────────────────────────────────────────────────────────
--  TABLE: user_starred_assets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_starred_assets (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    starred_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_user_asset
    ON user_starred_assets(user_id, asset_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: market_movers (Trending / Top Gainers / Top Losers)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_movers (
    id              BIGSERIAL    PRIMARY KEY,
    asset_id        UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    category        mover_cat    NOT NULL,
    rank_position   INT          NOT NULL CHECK (rank_position > 0),
    price_usd       NUMERIC(24,8) NOT NULL,
    change_24h_pct  NUMERIC(10,4) NOT NULL,
    snapshot_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movers_category_time
    ON market_movers (category, snapshot_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: api_sync_log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_sync_log (
    id              BIGSERIAL    PRIMARY KEY,
    source          TEXT         NOT NULL DEFAULT 'coingecko',
    endpoint        TEXT         NOT NULL,
    status          sync_status  NOT NULL,
    assets_updated  INT          DEFAULT 0,
    error_message   TEXT,
    duration_ms     INT,
    synced_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
