import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

function getUserId(req) {
  return (
    req.headers['x-user-id'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    req.body?.userId ||
    req.query?.userId ||
    'default-user'
  );
}

// GET /api/watchlist
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const records = await db.watchlist.findMany({ where: { userId } });
    const ids = records.map((r) => r.coinId);

    // If populate=true, return full coin objects
    if (req.query.populate === 'true') {
      const coins = await db.coin.findMany({ where: { id: { in: ids } } });
      return res.json({ userId, watchlist: ids, coins });
    }

    res.json({
      userId,
      watchlist: ids,
    });
  } catch (error) {
    console.error('[API] Error retrieving watchlist:', error);
    res.status(500).json({ error: 'Failed to retrieve watchlist' });
  }
});

// POST /api/watchlist - Add or remove coin
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { coinId, action, saved } = req.body;

    if (!coinId) {
      return res.status(400).json({ error: 'coinId is required' });
    }

    const coin = await db.coin.findUnique({ where: { id: coinId } });
    if (!coin) {
      return res.status(404).json({ error: `Cryptocurrency with ID "${coinId}" does not exist` });
    }

    const existing = await db.watchlist.findFirst({ where: { userId, coinId } });
    let isWatched = false;

    if (typeof saved === 'boolean') {
      if (saved && !existing) {
        await db.watchlist.create({ data: { userId, coinId } });
        isWatched = true;
      } else if (!saved && existing) {
        await db.watchlist.deleteMany({ where: { userId, coinId } });
        isWatched = false;
      } else {
        isWatched = saved;
      }
    } else if (action === 'add') {
      if (!existing) {
        await db.watchlist.create({ data: { userId, coinId } });
      }
      isWatched = true;
    } else if (action === 'remove') {
      await db.watchlist.deleteMany({ where: { userId, coinId } });
      isWatched = false;
    } else {
      // Toggle
      if (existing) {
        await db.watchlist.deleteMany({ where: { userId, coinId } });
        isWatched = false;
      } else {
        await db.watchlist.create({ data: { userId, coinId } });
        isWatched = true;
      }
    }

    const updatedRecords = await db.watchlist.findMany({ where: { userId } });
    const updatedIds = updatedRecords.map((r) => r.coinId);

    res.json({
      success: true,
      userId,
      coinId,
      isWatched,
      watchlist: updatedIds,
      coin,
    });
  } catch (error) {
    console.error('[API] Error updating watchlist:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// DELETE /api/watchlist/:coinId
router.delete('/:coinId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { coinId } = req.params;

    await db.watchlist.deleteMany({ where: { userId, coinId } });
    const updatedRecords = await db.watchlist.findMany({ where: { userId } });
    const updatedIds = updatedRecords.map((r) => r.coinId);

    res.json({
      success: true,
      userId,
      coinId,
      isWatched: false,
      watchlist: updatedIds,
    });
  } catch (error) {
    console.error(`[API] Error removing ${req.params.coinId} from watchlist:`, error);
    res.status(500).json({ error: 'Failed to remove coin from watchlist' });
  }
});

export default router;
