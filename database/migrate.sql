-- =============================================================
--  CRYPTOPULSE  –  Migration Runner  v3.0
--  Run: psql "$DATABASE_URL" -f database/migrate.sql
-- =============================================================

\echo '--- [1/3] Running schema.sql ---'
\i database/schema.sql

\echo '--- [2/3] Running queries.sql ---'
\i database/queries.sql

\echo '--- [3/3] Running seed.sql ---'
\i database/seed.sql

\echo '--- Refreshing materialized views ---'
REFRESH MATERIALIZED VIEW mv_latest_prices;
SELECT refresh_market_movers();

\echo '=== CryptoPulse Database Migration Complete ==='
