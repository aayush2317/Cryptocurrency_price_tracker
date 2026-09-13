# Cryptocurrency_price_tracker
# Real-Time Cryptocurrency Price Tracker & Market Dashboard

A full-stack, real-time cryptocurrency market dashboard that streams live market prices, interactive candlestick charts, custom price alerts, and mock portfolio tracking without relying on repetitive client-side REST polling[cite: 1].

---

## Architecture Overview

Instead of overwhelming upstream exchange APIs by connecting every browser directly, the system utilizes a centralized backend pipeline to consume Binance's public data feeds and broadcast updates efficiently to clients over WebSockets[cite: 1]:

```text
Binance Public WebSocket
         │
         ▼
FastAPI Backend (Asyncio & Uvicorn)
         │
         ├──► Redis (Pub/Sub & In-Memory Price Cache)
         └──► PostgreSQL / Supabase (Users, Watchlists, Alerts, Portfolios)
         │
         ▼
WebSocket Broadcast (/ws/crypto)
         │
         ▼
Next.js Frontend (Zustand + TradingView Lightweight Charts)
```[cite: 1]

---

## Features

- **Live Ticker Updates:** Real-time prices, 24-hour percentage change, 24-hour high/low, and trading volume with visual green/red flash indicators on price movements[cite: 1].
- **Interactive Candlestick Charts:** Built using canvas-based TradingView Lightweight Charts supporting 1m, 5m, 15m, 1h, and 1D intervals, initialized with 100 historical candles and updated via live streams[cite: 1].
- **Watchlists:** Save and track favorite pairs (e.g., BTC, ETH, SOL, XRP) across sessions[cite: 1].
- **Mock Portfolio Tracker:** Calculate unrealized profit/loss based on token quantities and entry prices without risking actual funds[cite: 1].
- **Custom Price Alerts:** Trigger in-app alerts (and optional external notifications) when target thresholds are crossed[cite: 1].
- **Resilient Connectivity:** Client-side WebSocket reconnect logic using exponential backoff (1s, 2s, 4s, 8s, up to 10s max)[cite: 1].
- **Fully Responsive UI:** Optimized layouts for mobile viewports (down to 375px) up to high-resolution desktop screens[cite: 1].

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui[cite: 1] |
| **State & Data** | Zustand (high-frequency WebSocket updates), TanStack Query (REST caching)[cite: 1] |
| **Charting** | TradingView Lightweight Charts (Canvas-based)[cite: 1] |
| **Backend** | Python, FastAPI, Uvicorn, Asyncio[cite: 1] |
| **Caching & Pub/Sub**| Redis[cite: 1] |
| **Database** | PostgreSQL / Supabase (optional TimescaleDB extension)[cite: 1] |
| **Authentication**| Clerk or NextAuth.js[cite: 1] |
| **Data Provider** | Binance Public WebSocket API[cite: 1] |
| **Deployment** | Docker, Vercel (Frontend), Render / Railway (Backend)[cite: 1] |

---

## API & WebSocket Endpoints

### REST Endpoints
- `GET /api/v1/coins` — Retrieve supported cryptocurrency pairs and 24h market metrics[cite: 1].
- `GET /api/v1/history/{symbol}?interval=1m&limit=100` — Retrieve initial historical candlestick data[cite: 1].
- `GET /api/v1/user/watchlist` — Retrieve the authenticated user's watchlist[cite: 1].
- `POST /api/v1/user/watchlist` — Add a trading pair to the user's watchlist[cite: 1].
- `POST /api/v1/alerts` — Create a custom price alert rule[cite: 1].

### WebSocket Connection
- **Endpoint:** `/ws/crypto`[cite: 1]
- **Subscribe Payload:**
  ```json
  {
    "action": "subscribe",
    "pair": "ETHUSDT"
  }
  ```[cite: 1]
- **Broadcast Events:** Emits ticker updates (symbol, price, 24h delta) and candlestick updates (time, open, high, low, close)[cite: 1].

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Redis](https://redis.io/)
- [PostgreSQL](https://www.postgresql.org/) (or Supabase account)[cite: 1]

### 1. Environment Setup

Clone the repository:
```bash
git clone [https://github.com/aayush2317/Cryptocurrency_price_tracker.git](https://github.com/aayush2317/Cryptocurrency_price_tracker.git)
cd Cryptocurrency_price_tracker
