-- =============================================================
--  CRYPTOPULSE  –  Seed Data  v3.0
--  16 coins matching src/data/coins.js exactly + Demo User + Candles
-- =============================================================

-- ─── 1. Demo User (password is 'password123') ────────────────
INSERT INTO users (id, name, email, password_hash, theme, demo_mode)
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Aayush',
    'demo@cryptopulse.app',
    '$2a$10$1Y8jIqCg2J1rFk8N2h8vqu8OaD1t3qJ7gQ1h3y4z5a6b7c8d9e0f1', -- bcrypt hash of password123
    'light',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ─── 2. Default Workspace ────────────────────────────────────
INSERT INTO workspaces (id, user_id, name, is_default)
VALUES (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Personal workspace',
    TRUE
) ON CONFLICT DO NOTHING;

-- ─── 3. The 16 Crypto Assets (src/data/coins.js alignment) ───
INSERT INTO assets
    (id, slug, symbol, name, rank, category, color_hex,
     circulating_supply, max_supply, ath, description)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'bitcoin',   'BTC',  'Bitcoin',         1,  'Layer 1',     '#f7931a', 19800000,        21000000,        73750.07,   'Bitcoin is a decentralized digital currency with a fixed maximum supply of 21 million coins.'),
  ('a0000002-0000-0000-0000-000000000002', 'ethereum',  'ETH',  'Ethereum',        2,  'Layer 1',     '#8494ed', 120163000,       NULL,            4878.26,    'Ethereum is a decentralized blockchain platform for smart contracts and applications.'),
  ('a0000003-0000-0000-0000-000000000003', 'tether',    'USDT', 'Tether',          3,  'Stablecoins', '#26a17b', 112457508498,   NULL,            1.32,       'USD-pegged stablecoin issued by Tether.'),
  ('a0000004-0000-0000-0000-000000000004', 'bnb',       'BNB',  'BNB',             4,  'Layer 1',     '#f3ba2f', 147622092,       200000000,       717.48,     'BNB powers the BNB Chain ecosystem and trading fee discounts.'),
  ('a0000005-0000-0000-0000-000000000005', 'solana',    'SOL',  'Solana',          5,  'Layer 1',     '#a88bf5', 461066759,       NULL,            259.96,     'Solana is a blockchain designed for fast transactions and decentralized applications.'),
  ('a0000006-0000-0000-0000-000000000006', 'usd-coin',  'USDC', 'USDC',            6,  'Stablecoins', '#2775ca', 32623262326,     NULL,            1.17,       'USDC is a fully-reserved digital dollar pegged to the US dollar.'),
  ('a0000007-0000-0000-0000-000000000007', 'xrp',       'XRP',  'XRP',             7,  'Layer 1',     '#dce0e5', 55374716124,     100000000000,    3.84,       'XRP is the native token of the XRP Ledger for fast, low-cost cross-border payments.'),
  ('a0000008-0000-0000-0000-000000000008', 'dogecoin',  'DOGE', 'Dogecoin',        8,  'Meme coins',  '#c5a456', 145326774420,    NULL,            0.7316,     'Dogecoin is the original open-source peer-to-peer cryptocurrency inspired by a meme.'),
  ('a0000009-0000-0000-0000-000000000009', 'toncoin',   'TON',  'Toncoin',         9,  'Layer 1',     '#0098ea', 2431754875,      NULL,            8.25,       'Toncoin is the native cryptocurrency of The Open Network (TON).'),
  ('a0000010-0000-0000-0000-000000000010', 'cardano',   'ADA',  'Cardano',         10, 'Layer 1',     '#3777e5', 35644876325,     45000000000,     3.10,       'Cardano is a proof-of-stake blockchain platform built on peer-reviewed research.'),
  ('a0000011-0000-0000-0000-000000000011', 'avalanche', 'AVAX', 'Avalanche',       11, 'Layer 1',     '#e84142', 392660044,       720000000,       144.96,     'Avalanche is an umbrella platform for launching decentralized finance applications.'),
  ('a0000012-0000-0000-0000-000000000012', 'chainlink', 'LINK', 'Chainlink',       12, 'DeFi',        '#2a5ada', 608305274,       1000000000,      52.88,      'Chainlink is a decentralized oracle network that provides real-world data to smart contracts.'),
  ('a0000013-0000-0000-0000-000000000013', 'polkadot',  'DOT',  'Polkadot',        13, 'Layer 1',     '#e6007a', 1436137071,      NULL,            54.98,      'Polkadot facilitates multi-chain transfers of any data or asset.'),
  ('a0000014-0000-0000-0000-000000000014', 'uniswap',   'UNI',  'Uniswap',         14, 'DeFi',        '#ff65bd', 599243856,       1000000000,      44.92,      'Uniswap is a popular decentralized trading protocol.'),
  ('a0000015-0000-0000-0000-000000000015', 'near',      'NEAR', 'NEAR Protocol',   15, 'Layer 1',     '#b8ebd1', 1090643275,      NULL,            20.44,      'NEAR Protocol is a layer-one blockchain designed as a community-run cloud.'),
  ('a0000016-0000-0000-0000-000000000016', 'pepe',      'PEPE', 'Pepe',            16, 'Meme coins',  '#70ad51', 420608108108108, 420690000000000, 0.00001717, 'Pepe is a deflationary memecoin launched on Ethereum.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  rank = EXCLUDED.rank,
  category = EXCLUDED.category,
  color_hex = EXCLUDED.color_hex,
  circulating_supply = EXCLUDED.circulating_supply,
  max_supply = EXCLUDED.max_supply,
  ath = EXCLUDED.ath;

-- ─── 4. Price Snapshots (Exactly matches definitions) ─────────
INSERT INTO price_snapshots
    (asset_id, price_usd, market_cap_usd, volume_24h_usd, change_24h_pct, change_7d_pct, snapshot_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 67432.8,    1335000000000, 28460000000,  2.34,  5.62, NOW()),
  ('a0000002-0000-0000-0000-000000000002',  3521.64,    423180000000, 15240000000,  1.87,  3.20, NOW()),
  ('a0000003-0000-0000-0000-000000000003',     1.0002,  112480000000, 51270000000,  0.01,  0.00, NOW()),
  ('a0000004-0000-0000-0000-000000000004',   598.42,     88340000000,  1480000000, -0.84, -1.10, NOW()),
  ('a0000005-0000-0000-0000-000000000005',   172.86,     79700000000,  3640000000,  5.42,  8.90, NOW()),
  ('a0000006-0000-0000-0000-000000000006',     0.9999,   32620000000,  6870000000, -0.01,  0.00, NOW()),
  ('a0000007-0000-0000-0000-000000000007',     0.5284,   29260000000,  1120000000, -1.26, -2.40, NOW()),
  ('a0000008-0000-0000-0000-000000000008',     0.1423,   20680000000,   897000000,  3.62,  6.10, NOW()),
  ('a0000009-0000-0000-0000-000000000009',     7.18,     17460000000,   426000000,  4.21,  6.50, NOW()),
  ('a0000010-0000-0000-0000-000000000010',     0.4528,   16140000000,   312000000, -2.16, -3.40, NOW()),
  ('a0000011-0000-0000-0000-000000000011',    36.24,     14230000000,   524000000,  6.78,  9.20, NOW()),
  ('a0000012-0000-0000-0000-000000000012',    17.82,     10840000000,   428000000,  4.93,  7.10, NOW()),
  ('a0000013-0000-0000-0000-000000000013',     6.42,      9220000000,   198000000, -3.48, -4.80, NOW()),
  ('a0000014-0000-0000-0000-000000000014',    10.58,      6340000000,   287000000,  8.26, 11.40, NOW()),
  ('a0000015-0000-0000-0000-000000000015',     6.84,      7460000000,   352000000,  7.12, 10.50, NOW()),
  ('a0000016-0000-0000-0000-000000000016', 0.00001184,    4980000000,   718000000, -4.72, -6.10, NOW());

-- ─── 5. Market Overview (Dashboard stats) ─────────────────────
INSERT INTO market_overview
    (total_market_cap, total_volume_24h, btc_dominance,
     market_cap_change, volume_change, dominance_change, snapshot_date)
VALUES
    (2480000000000, 84620000000, 54.2, 2.34, 8.12, 0.42, 'October 2, 2026');

-- ─── 6. Historical Chart Points for Bitcoin (7D) ──────────────
-- Generates sample historical candles so Recharts renders immediately
DO $$
DECLARE
    end_time BIGINT := 1790956800000; -- Date.UTC(2026, 9, 2, 16)
    step_ms  BIGINT := 7200000;       -- 2 hours apart
    i        INT;
    p        NUMERIC;
BEGIN
    FOR i IN 0..83 LOOP
        p := 64000.0 + (i * 41.3) + (sin(i * 0.4) * 350.0);
        INSERT INTO ohlcv_candles (asset_id, period, timestamp_ms, price)
        VALUES (
            'a0000001-0000-0000-0000-000000000001',
            '7D',
            end_time - ((84 - i) * step_ms),
            ROUND(p, 2)
        )
        ON CONFLICT (asset_id, period, timestamp_ms) DO NOTHING;
    END LOOP;
END $$;

-- ─── 7. Watchlist ─────────────────────────────────────────────
INSERT INTO watchlists (id, workspace_id, user_id, name)
VALUES (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Local watchlist'
) ON CONFLICT DO NOTHING;

INSERT INTO watchlist_assets (watchlist_id, asset_id, sort_order)
VALUES
  ('cccccccc-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001', 1),
  ('cccccccc-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002', 2),
  ('cccccccc-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005', 3)
ON CONFLICT DO NOTHING;

-- ─── 8. Populate Materialized View and Market Movers ──────────
REFRESH MATERIALIZED VIEW mv_latest_prices;
SELECT refresh_market_movers();
