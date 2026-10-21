import express from 'express';
import { syncWorker } from '../cron/syncWorker.js';

const router = express.Router();

// GET /api/market/overview & GET /api/market-stats
const handleMarketOverview = async (req, res) => {
  try {
    const coins = await syncWorker.getEnrichedCoins();
    const stats = syncWorker.calculateOverviewStats(coins);
    res.json(stats);
  } catch (error) {
    console.error('[API] Error fetching market overview:', error);
    res.status(500).json({ error: 'Failed to retrieve market statistics overview' });
  }
};

router.get('/overview', handleMarketOverview);
router.get('/market-stats', handleMarketOverview);

export default router;
