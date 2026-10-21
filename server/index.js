import http from 'http';
import express from 'express';
import cors from 'cors';
import { initSocket } from './socket.js';
import { syncWorker } from './cron/syncWorker.js';
import marketRoutes from './routes/marketRoutes.js';
import coinsRoutes from './routes/coinsRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for frontend and WebSocket access
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);

app.use(express.json());

// API Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test' && !req.path.includes('/health')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'CryptoPulse Full-Stack API',
    version: '2.0.0',
    websocketActive: true,
    cronWorkerActive: true,
  });
});

// REST API Endpoints
// GET /api/market/overview and GET /api/market-stats
app.use('/api/market', marketRoutes);
app.use('/api', marketRoutes); // for /api/market-stats alias
// GET /api/coins, /api/coins/:id, /api/coins/:id/history
app.use('/api/coins', coinsRoutes);
// GET & POST /api/watchlist
app.use('/api/watchlist', watchlistRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Create HTTP Server & initialize Socket.io WebSocket Layer
const httpServer = http.createServer(app);
const io = initSocket(httpServer);

// Start background CoinGecko node-cron sync worker
syncWorker.start();

let activePort = PORT;

const startServer = (portToTry, fallbackPort = 5001) => {
  const server = httpServer.listen(portToTry, () => {
    activePort = portToTry;
    console.log(`[CryptoPulse] Backend server running on http://localhost:${portToTry}`);
    console.log(`[CryptoPulse] Socket.io WebSocket server initialized on port ${portToTry}`);
    console.log(`[CryptoPulse] node-cron sync worker scheduled (CoinGecko sync + micro-ticker)`);
  });

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToTry !== fallbackPort) {
      console.warn(`[CryptoPulse] Port ${portToTry} is occupied. Falling back to port ${fallbackPort}...`);
      server.close(() => {
        startServer(fallbackPort, fallbackPort + 1);
      });
    } else {
      console.error('[CryptoPulse] Server startup error:', err);
    }
  });
};

startServer(PORT);

// Graceful shutdown
const shutdown = () => {
  console.log('\n[CryptoPulse] Shutting down server gracefully...');
  syncWorker.stop();
  httpServer.close(() => {
    console.log('[CryptoPulse] HTTP & WebSocket servers closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
