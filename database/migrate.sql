-- =============================================================
--  CRYPTOPULSE  –  Migration Runner  v2.0
--  Run:  psql "$DATABASE_URL" -f database/migrate.sql
--  Or add to package.json: "db:migrate": "psql $DATABASE_URL -f database/migrate.sql"
-- =============================================================

\echo '╔══════════════════════════════════════╗'
\echo '║   CryptoPulse DB Migration  v2.0     ║'
\echo '╚══════════════════════════════════════╝'

\echo '--- [1/3] schema.sql  (tables, indexes, triggers) ---'
\i database/schema.sql

\echo '--- [2/3] queries.sql  (views, functions, mat-view) ---'
\i database/queries.sql

\echo '--- [3/3] seed.sql  (16 assets, demo data) ---'
\i database/seed.sql

\echo '=== ✅ Migration complete ==='
