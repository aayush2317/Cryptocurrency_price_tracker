-- =============================================================
--  CRYPTOPULSE  –  Seed Data  v2.0
--  16 assets (2 pages × 8)  +  categories  +  portfolio sample
-- =============================================================

-- ─── Demo User ────────────────────────────────────────────────
INSERT INTO users (id, email, username, display_name, theme, demo_mode, currency)
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'demo@cryptopulse.app',
    'AY',
    'Demo User',
    'light',
    TRUE,
    'USD'
) ON CONFLICT (email) DO NOTHING;

-- ─── Default Workspace ────────────────────────────────────────
INSERT INTO workspaces (id, user_id, name, is_default)
VALUES (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Personal workspace',
    TRUE
) ON CONFLICT DO NOTHING;

-- ─── 16 Crypto Assets with categories ────────────────────────
--  category_id: 1=layer1, 2=layer2, 3=stablecoin, 4=defi,
--               5=meme, 6=exchange, 7=gaming, 8=ai
INSERT INTO assets
    (id, coingecko_id, symbol, name, logo_url, large_logo_url, rank, category_id,
     circulating_supply, max_supply, website_url, description)
VALUES
  ('a0000001-0000-0000-0000-000000000001',
   'bitcoin',       'BTC',  'Bitcoin',
   'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',
   'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
   1, 1, 19500000, 21000000, 'https://bitcoin.org',
   'The first and largest cryptocurrency by market capitalisation.'),

  ('a0000002-0000-0000-0000-000000000002',
   'ethereum',      'ETH',  'Ethereum',
   'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png',
   'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
   2, 1, 120250000, NULL, 'https://ethereum.org',
   'Programmable blockchain powering DeFi and NFTs.'),

  ('a0000003-0000-0000-0000-000000000003',
   'tether',        'USDT', 'Tether',
   'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
   'https://assets.coingecko.com/coins/images/325/large/Tether.png',
   3, 3, 112480000000, NULL, 'https://tether.to', 'USD-pegged stablecoin.'),

  ('a0000004-0000-0000-0000-000000000004',
   'binancecoin',   'BNB',  'BNB',
   'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png',
   'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
   4, 6, 153856000, 200000000, 'https://www.bnbchain.org', 'Binance exchange token.'),

  ('a0000005-0000-0000-0000-000000000005',
   'solana',        'SOL',  'Solana',
   'https://assets.coingecko.com/coins/images/4128/thumb/solana.png',
   'https://assets.coingecko.com/coins/images/4128/large/solana.png',
   5, 1, 435000000, NULL, 'https://solana.com', 'High-speed Layer 1 blockchain.'),

  ('a0000006-0000-0000-0000-000000000006',
   'usd-coin',      'USDC', 'USDC',
   'https://assets.coingecko.com/coins/images/6319/thumb/usdc.png',
   'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
   6, 3, 32620000000, NULL, 'https://www.circle.com', 'Circle USD stablecoin.'),

  ('a0000007-0000-0000-0000-000000000007',
   'ripple',        'XRP',  'XRP',
   'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white.png',
   'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white.png',
   7, 1, 55000000000, 100000000000, 'https://ripple.com', 'Enterprise payments network.'),

  ('a0000008-0000-0000-0000-000000000008',
   'dogecoin',      'DOGE', 'Dogecoin',
   'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png',
   'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
   8, 5, 145000000000, NULL, 'https://dogecoin.com', 'The original meme coin.'),

  ('a0000009-0000-0000-0000-000000000009',
   'cardano',       'ADA',  'Cardano',
   'https://assets.coingecko.com/coins/images/975/thumb/cardano.png',
   'https://assets.coingecko.com/coins/images/975/large/cardano.png',
   9, 1, 35200000000, 45000000000, 'https://cardano.org', 'Proof-of-stake Layer 1.'),

  ('a0000010-0000-0000-0000-000000000010',
   'avalanche-2',   'AVAX', 'Avalanche',
   'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png',
   'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
   10, 1, 410000000, 720000000, 'https://avax.network', 'Fast finality EVM chain.'),

  ('a0000011-0000-0000-0000-000000000011',
   'shiba-inu',     'SHIB', 'Shiba Inu',
   'https://assets.coingecko.com/coins/images/11939/thumb/shiba.png',
   'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
   11, 5, 589000000000000, NULL, 'https://shibatoken.com', 'Ethereum-based meme coin.'),

  ('a0000012-0000-0000-0000-000000000012',
   'polkadot',      'DOT',  'Polkadot',
   'https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png',
   'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
   12, 1, 1400000000, NULL, 'https://polkadot.network', 'Multi-chain interoperability.'),

  ('a0000013-0000-0000-0000-000000000013',
   'chainlink',     'LINK', 'Chainlink',
   'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png',
   'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
   13, 4, 587000000, 1000000000, 'https://chain.link', 'Decentralised oracle network.'),

  ('a0000014-0000-0000-0000-000000000014',
   'tron',          'TRX',  'TRON',
   'https://assets.coingecko.com/coins/images/1094/thumb/tron-logo.png',
   'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
   14, 1, 87000000000, NULL, 'https://tron.network', 'Decentralised entertainment chain.'),

  ('a0000015-0000-0000-0000-000000000015',
   'litecoin',      'LTC',  'Litecoin',
   'https://assets.coingecko.com/coins/images/2/thumb/litecoin.png',
   'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
   15, 1, 73700000, 84000000, 'https://litecoin.org', 'Silver to Bitcoin''s gold.'),

  ('a0000016-0000-0000-0000-000000000016',
   'uniswap',       'UNI',  'Uniswap',
   'https://assets.coingecko.com/coins/images/12504/thumb/uniswap-uni-logo.png',
   'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni-logo.png',
   16, 4, 600000000, 1000000000, 'https://uniswap.org', 'Leading Ethereum DEX protocol.')
ON CONFLICT (coingecko_id) DO NOTHING;

-- ─── Price Snapshots (matching UI screenshots exactly) ────────
INSERT INTO price_snapshots
    (asset_id, price_usd, price_btc, market_cap_usd, volume_24h_usd,
     change_1h_pct, change_24h_pct, change_7d_pct, change_30d_pct,
     ath_usd, ath_date, snapshot_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 67432.80, 1.000000,    1340000000000, 84620000000,  0.31,  2.34,  5.62, 12.40, 73750.00, '2024-03-14', NOW()),
  ('a0000002-0000-0000-0000-000000000002',  3521.64, 0.052228,     423180000000, 18000000000,  0.18,  1.87,  3.20,  8.10,  4878.26, '2021-11-10', NOW()),
  ('a0000003-0000-0000-0000-000000000003',     1.00, 0.000015,     112480000000, 51270000000,  0.00,  0.01,  0.00,  0.02,     1.32, '2018-07-24', NOW()),
  ('a0000004-0000-0000-0000-000000000004',   598.42, 0.008877,      88340000000,  1480000000, -0.12, -0.84, -1.10, -3.20,   690.93, '2021-05-10', NOW()),
  ('a0000005-0000-0000-0000-000000000005',   172.86, 0.002564,      79700000000,  3640000000,  0.75,  5.42,  8.90, 18.30,   259.96, '2021-11-06', NOW()),
  ('a0000006-0000-0000-0000-000000000006',     0.9999, 0.000015,    32620000000,  6870000000,  0.00, -0.01,  0.00, -0.01,     1.17, '2019-05-08', NOW()),
  ('a0000007-0000-0000-0000-000000000007',     0.5284, 0.000008,    29260000000,  1120000000, -0.22, -1.26, -2.40, -5.10,     3.84, '2018-01-07', NOW()),
  ('a0000008-0000-0000-0000-000000000008',     0.1423, 0.000002,    20680000000,   897000000,  0.41,  3.62,  6.10, 14.20,     0.74, '2021-05-08', NOW()),
  ('a0000009-0000-0000-0000-000000000009',     0.4512, 0.000007,    15900000000,   450000000,  0.09,  1.10,  2.30,  5.40,     3.10, '2021-09-02', NOW()),
  ('a0000010-0000-0000-0000-000000000010',    35.42, 0.000526,      14500000000,   620000000,  0.35,  2.80,  4.50,  9.80,   144.96, '2021-11-21', NOW()),
  ('a0000011-0000-0000-0000-000000000011',  0.000024, 0.000000,     14200000000,   580000000,  0.55,  4.20,  7.80, 16.50,  0.000088,'2021-10-28', NOW()),
  ('a0000012-0000-0000-0000-000000000012',     8.92, 0.000132,      12800000000,   310000000, -0.08, -0.60,  1.20,  2.80,    54.98, '2021-11-04', NOW()),
  ('a0000013-0000-0000-0000-000000000013',    14.73, 0.000219,       8600000000,   420000000,  0.29,  3.10,  5.60, 12.10,    52.70, '2021-05-10', NOW()),
  ('a0000014-0000-0000-0000-000000000014',     0.1321, 0.000002,    11500000000,   890000000, -0.05, -0.30,  0.80,  1.90,     0.23, '2018-01-05', NOW()),
  ('a0000015-0000-0000-0000-000000000015',    87.34, 0.001296,       6400000000,   340000000,  0.18,  1.60,  3.20,  7.40,   410.26, '2021-05-10', NOW()),
  ('a0000016-0000-0000-0000-000000000016',    10.21, 0.000152,       7800000000,   290000000,  0.33,  2.90,  4.70, 10.20,    44.97, '2021-05-03', NOW());

-- ─── Market Overview ──────────────────────────────────────────
INSERT INTO market_overview
    (total_market_cap, total_volume_24h, btc_dominance, eth_dominance,
     defi_volume_24h, market_cap_change, volume_change, dominance_change,
     active_assets, active_exchanges)
VALUES
    (2480000000000, 84620000000, 54.2, 17.1,
     12400000000,   2.34, 8.12, 0.42,
     16, 420);

-- ─── Watchlist ────────────────────────────────────────────────
INSERT INTO watchlists (id, workspace_id, user_id, name, icon)
VALUES (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Local watchlist',
    '⭐'
) ON CONFLICT DO NOTHING;

INSERT INTO watchlist_assets (watchlist_id, asset_id, sort_order, notes)
VALUES
  ('cccccccc-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001', 1, 'Core holding'),
  ('cccccccc-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002', 2, NULL),
  ('cccccccc-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005', 3, 'High momentum')
ON CONFLICT DO NOTHING;

-- ─── Starred Assets ───────────────────────────────────────────
INSERT INTO user_starred_assets (user_id, asset_id)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ─── Sample Portfolio ─────────────────────────────────────────
INSERT INTO portfolio (user_id, asset_id, quantity, avg_buy_price, bought_at, notes)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001',
   0.25, 58000.00, NOW() - INTERVAL '90 days', 'Long-term hold'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002',
   2.50, 3000.00,  NOW() - INTERVAL '60 days', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005',
   50.0, 140.00,   NOW() - INTERVAL '30 days', 'Momentum trade');

-- ─── Sample Price Alerts ──────────────────────────────────────
INSERT INTO price_alerts (user_id, asset_id, condition, target_price, notify_email)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001',
   'above', 70000.00, TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002',
   'below', 3000.00,  TRUE);

-- ─── Market Movers snapshot ───────────────────────────────────
INSERT INTO market_movers (asset_id, category, rank_position, price_usd, change_24h_pct, volume_24h_usd)
VALUES
  -- Trending (by volume)
  ('a0000001-0000-0000-0000-000000000001','trending',   1, 67432.80,  2.34, 84620000000),
  ('a0000003-0000-0000-0000-000000000003','trending',   2,     1.00,  0.01, 51270000000),
  ('a0000006-0000-0000-0000-000000000006','trending',   3,     0.9999,-0.01, 6870000000),
  ('a0000002-0000-0000-0000-000000000002','trending',   4,  3521.64,  1.87, 18000000000),
  ('a0000005-0000-0000-0000-000000000005','trending',   5,   172.86,  5.42,  3640000000),
  -- Top Gainers
  ('a0000005-0000-0000-0000-000000000005','top_gainer', 1,   172.86,  5.42,  3640000000),
  ('a0000011-0000-0000-0000-000000000011','top_gainer', 2,  0.000024, 4.20,   580000000),
  ('a0000008-0000-0000-0000-000000000008','top_gainer', 3,     0.1423, 3.62,  897000000),
  ('a0000013-0000-0000-0000-000000000013','top_gainer', 4,    14.73,  3.10,   420000000),
  ('a0000016-0000-0000-0000-000000000016','top_gainer', 5,    10.21,  2.90,   290000000),
  -- Top Losers
  ('a0000007-0000-0000-0000-000000000007','top_loser',  1,     0.5284,-1.26,  1120000000),
  ('a0000004-0000-0000-0000-000000000004','top_loser',  2,   598.42, -0.84,  1480000000),
  ('a0000012-0000-0000-0000-000000000012','top_loser',  3,     8.92, -0.60,   310000000),
  ('a0000014-0000-0000-0000-000000000014','top_loser',  4,     0.1321,-0.30,  890000000),
  ('a0000006-0000-0000-0000-000000000006','top_loser',  5,     0.9999,-0.01, 6870000000);
