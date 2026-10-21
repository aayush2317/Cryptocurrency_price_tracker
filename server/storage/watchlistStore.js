import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/watchlists.json');

const DEFAULT_WATCHLIST = ['bitcoin', 'ethereum', 'solana'];

class WatchlistStore {
  constructor() {
    this.watchlists = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [userId, list] of Object.entries(parsed)) {
          this.watchlists.set(userId, Array.isArray(list) ? list : []);
        }
      }
    } catch (err) {
      console.warn('Could not read watchlists.json, initializing empty storage:', err.message);
    }

    if (!this.watchlists.has('default-user')) {
      this.watchlists.set('default-user', [...DEFAULT_WATCHLIST]);
      this.save();
    }
  }

  save() {
    try {
      const obj = {};
      for (const [userId, list] of this.watchlists.entries()) {
        obj[userId] = list;
      }
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save watchlist to disk:', err.message);
    }
  }

  getWatchlist(userId = 'default-user') {
    if (!this.watchlists.has(userId)) {
      this.watchlists.set(userId, [...DEFAULT_WATCHLIST]);
      this.save();
    }
    return this.watchlists.get(userId);
  }

  toggleCoin(userId = 'default-user', coinId) {
    if (!coinId) throw new Error('coinId is required');
    const current = this.getWatchlist(userId);
    let updated;
    let isWatched;

    if (current.includes(coinId)) {
      updated = current.filter((id) => id !== coinId);
      isWatched = false;
    } else {
      updated = [...current, coinId];
      isWatched = true;
    }

    this.watchlists.set(userId, updated);
    this.save();

    return {
      userId,
      coinId,
      isWatched,
      watchlist: updated,
    };
  }

  setCoin(userId = 'default-user', coinId, shouldWatch) {
    if (!coinId) throw new Error('coinId is required');
    const current = this.getWatchlist(userId);
    let updated;

    if (shouldWatch) {
      if (!current.includes(coinId)) {
        updated = [...current, coinId];
      } else {
        updated = current;
      }
    } else {
      updated = current.filter((id) => id !== coinId);
    }

    this.watchlists.set(userId, updated);
    this.save();

    return {
      userId,
      coinId,
      isWatched: shouldWatch,
      watchlist: updated,
    };
  }
}

export const watchlistStore = new WatchlistStore();
