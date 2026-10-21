# CryptoPulse — Full-Stack Real-Time Cryptocurrency Platform

CryptoPulse is a production-ready, full-stack cryptocurrency market intelligence dashboard. Built with a clear monorepo architecture, it combines a high-throughput Node.js/Express/Prisma/Socket.io backend with a dynamic React 19 frontend featuring real-time WebSocket price tickers, Recharts historical analytics, and persistent user watchlists.

---

## Monorepo Architecture

```text
Cryptocurrency_price_tracker/
├── /server                           # Backend Node.js & Express Architecture
│   ├── /prisma                       # Prisma ORM Schema & Database Models
│   │   └── schema.prisma             # Coin & Watchlist data models
│   ├── /db                           # Database Layer (Prisma-compatible ORM)
│   │   └── database.js
│   ├── /cron                         # Scheduled Tasks (node-cron)
│   │   └── syncWorker.js             # 60s CoinGecko sync & micro-ticker
│   ├── /routes                       # Modular REST API endpoints
│   │   ├── marketRoutes.js           # GET /api/market/overview
│   │   ├── coinsRoutes.js            # GET /api/coins, /api/coins/:id, /api/coins/:id/history
│   │   └── watchlistRoutes.js        # GET, POST, DELETE /api/watchlist
│   ├── socket.js                     # Socket.io WebSocket Layer
│   ├── index.js                      # Server entry point (HTTP + Socket.io)
│   └── package.json
│
├── /client                           # Frontend Dynamic React Architecture
│   ├── /src
│   │   ├── /components               # UI & Market Components
│   │   │   ├── /charts               # Recharts PriceChart with timeframe selectors
│   │   │   ├── /market               # MarketTable, StatsGrid, MarketMovers
│   │   │   └── /ui                   # Skeletons, ErrorStates, Badges, Icons
│   │   ├── /context                  # Real-Time Context Providers
│   │   │   ├── MarketDataContext.jsx # WebSocket listener & price flash engine
│   │   │   └── WatchlistContext.jsx  # Database-persisted watchlist state
│   │   ├── /services
│   │   │   ├── api.js                # Axios service layer with error handling
│   │   │   └── socket.js             # Socket.io client connection
│   │   └── styles.css                # Polished Dark-Theme CSS & Flash Animations
│   ├── vite.config.js                # Vite config with /api proxy
│   └── package.json
│
├── package.json                      # Monorepo orchestration scripts
└── README.md
```

---

## Phase 1: Backend Architecture (`/server`)

1. **Database Schema & ORM (`/server/prisma/schema.prisma`):**
   - `Coin`: `id`, `name`, `symbol`, `price`, `marketCap`, `volume24h`, `change24h`, `sparkline`, `ath`, `circulatingSupply`, `maxSupply`, `high24h`, `low24h`, `lastUpdated`.
   - `Watchlist`: `id`, `userId`, `coinId`, `createdAt`.
   - Provided via an ORM interface (`db.coin`, `db.watchlist`) with persistent storage.

2. **REST Endpoints:**
   - `GET /api/market/overview`: Returns global market cap, 24h volume, and BTC dominance.
   - `GET /api/coins`: Paginated and searchable listings with category filters and multi-column sorting.
   - `GET /api/coins/:id`: Detailed coin metadata, ATH, circulating & max supply, and 24h statistics.
   - `GET /api/coins/:id/history?days=1|7|30|365`: Historical time-series points formatted for Recharts.
   - `POST /api/watchlist`: Add or remove coins from user watchlists in the database.

3. **Background Sync Worker (`node-cron`):**
   - Automatically polls the public **CoinGecko API** every 60 seconds to update database records.
   - Seamlessly handles rate limits (HTTP 429) via realistic micro-fluctuation fallback, guaranteeing zero downtime.
   - Emits real-time WebSocket events (`price-update`) to all connected clients.

4. **Real-Time WebSocket Layer (`Socket.io`):**
   - Broadcasts live price updates to all connected browser clients on port 5000.

---

## Phase 2: Frontend Dynamic Upgrades (`/client`)

1. **API Integration Layer (`api.js`):**
   - Axios client with request timeouts, error boundaries, and loading skeletons.
2. **Live Ticker & Visual Feedback:**
   - `socket.io-client` listens for `price-update` events.
   - Dynamic soft green (`flash-up`) and soft red (`flash-down`) highlight animations trigger whenever a coin's price changes.
   - Topbar displays a pulsing **WebSocket Live** indicator with one-click manual refresh.
3. **Interactive Recharts:**
   - Coin Details chart supports dynamic timeframes (`24H`, `7D`, `1M`, `1Y`, `ALL`) backed by `GET /api/coins/:id/history?days=...`.
   - Linear and Logarithmic scale toggles with live price synchronization.
4. **State & Search:**
   - Multi-field sorting by Rank, Price, 24h %, Market Cap, and Volume.
   - Full-text search and category filtering ('Layer 1', 'DeFi', 'Stablecoins', 'Meme coins').
   - Persistent user watchlist stored in the backend database.

---

## Getting Started

### 1. Installation
Install root and module dependencies:
```bash
npm install
```

### 2. Start Full-Stack Application
Start both the backend server and frontend client concurrently with a single command:
```bash
npm run dev
```

- **Frontend Client:** `http://localhost:4173`
- **Backend API & WebSocket Server:** `http://localhost:5000`

### 3. Individual Execution
```bash
# Run backend server only
npm run server

# Run frontend client only
npm run client

# Build frontend client for production
npm run build
```

---

## API Quick Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/market/overview` | Global market overview (market cap, volume, dominance) |
| `GET` | `/api/coins` | Paginated & searchable coin listings |
| `GET` | `/api/coins/:id` | Detailed coin metadata & statistics |
| `GET` | `/api/coins/:id/history` | Historical time-series points (`?days=1\|7\|30\|365`) |
| `GET` | `/api/watchlist` | Retrieve user watchlist from database |
| `POST` | `/api/watchlist` | Add or toggle coin in user watchlist |
| `GET` | `/api/health` | Health check (WebSocket and cron status) |
