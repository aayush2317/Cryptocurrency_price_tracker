import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_COINS } from '../data/coinsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseService {
  constructor() {
    this.coins = new Map();
    this.watchlists = [];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.coins) && parsed.coins.length > 0) {
          parsed.coins.forEach((c) => this.coins.set(c.id, c));
        }
        if (Array.isArray(parsed.watchlists)) {
          this.watchlists = parsed.watchlists;
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to load from database.json, seeding defaults:', err.message);
    }

    // Seed default coins if empty
    if (this.coins.size === 0) {
      INITIAL_COINS.forEach((c, idx) => {
        const sparkline = this.generateSparkline(c.price, c.change);
        this.coins.set(c.id, {
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          price: c.price,
          marketCap: c.marketCap,
          volume24h: c.volume,
          change24h: c.change,
          sparkline: JSON.stringify(sparkline),
          ath: c.ath || 0,
          circulatingSupply: c.circulatingSupply || 0,
          maxSupply: c.maxSupply || null,
          rank: c.rank || idx + 1,
          category: c.category || 'Layer 1',
          color: c.color || '#3b82f6',
          high24h: c.high24h || c.price * 1.03,
          low24h: c.low24h || c.price * 0.97,
          description: c.description || '',
          lastUpdated: new Date().toISOString(),
        });
      });
      this.save();
    }

    // Seed default watchlist
    if (this.watchlists.length === 0) {
      const defaultCoins = ['bitcoin', 'ethereum', 'solana'];
      defaultCoins.forEach((coinId) => {
        this.watchlists.push({
          id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: 'default-user',
          coinId,
          createdAt: new Date().toISOString(),
        });
      });
      this.save();
    }
  }

  generateSparkline(basePrice, change, points = 24) {
    const start = basePrice / (1 + (change / 100));
    const result = [];
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const trend = start + (basePrice - start) * t;
      const noise = (Math.random() - 0.5) * (basePrice * 0.015);
      const val = i === points - 1 ? basePrice : trend + noise;
      result.push(Number(val.toFixed(val < 1 ? 6 : 2)));
    }
    return result;
  }

  save() {
    try {
      const payload = {
        coins: Array.from(this.coins.values()),
        watchlists: this.watchlists,
        lastSaved: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist database:', err.message);
    }
  }

  // Prisma-compatible ORM interface
  get coin() {
    return {
      findMany: async ({ where = {}, orderBy = {}, skip = 0, take } = {}) => {
        let list = Array.from(this.coins.values());

        // Filter where
        if (where.category && where.category !== 'All assets') {
          list = list.filter((c) => c.category === where.category);
        }
        if (where.search) {
          const q = where.search.toLowerCase();
          list = list.filter(
            (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
          );
        }
        if (Array.isArray(where.id?.in)) {
          list = list.filter((c) => where.id.in.includes(c.id));
        }

        // Order By
        const orderKey = Object.keys(orderBy)[0] || 'rank';
        const direction = orderBy[orderKey] === 'desc' ? -1 : 1;
        list.sort((a, b) => {
          const valA = a[orderKey] ?? a.rank;
          const valB = b[orderKey] ?? b.rank;
          if (typeof valA === 'string') return valA.localeCompare(valB) * direction;
          return (valA - valB) * direction;
        });

        // Pagination
        if (skip > 0) list = list.slice(skip);
        if (take && take > 0) list = list.slice(0, take);

        return list;
      },

      findUnique: async ({ where }) => {
        if (!where?.id) return null;
        return this.coins.get(where.id.toLowerCase()) || null;
      },

      count: async ({ where = {} } = {}) => {
        let list = Array.from(this.coins.values());
        if (where.category && where.category !== 'All assets') {
          list = list.filter((c) => c.category === where.category);
        }
        if (where.search) {
          const q = where.search.toLowerCase();
          list = list.filter(
            (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
          );
        }
        return list.length;
      },

      upsert: async ({ where, update, create }) => {
        const id = where.id.toLowerCase();
        const existing = this.coins.get(id);
        const record = existing ? { ...existing, ...update } : { ...create, id };
        record.lastUpdated = new Date().toISOString();
        this.coins.set(id, record);
        this.save();
        return record;
      },

      update: async ({ where, data }) => {
        const id = where.id.toLowerCase();
        const existing = this.coins.get(id);
        if (!existing) throw new Error(`Coin with id ${id} not found`);
        const updated = { ...existing, ...data, lastUpdated: new Date().toISOString() };
        this.coins.set(id, updated);
        this.save();
        return updated;
      },
    };
  }

  get watchlist() {
    return {
      findMany: async ({ where = {} } = {}) => {
        let list = [...this.watchlists];
        if (where.userId) {
          list = list.filter((w) => w.userId === where.userId);
        }
        if (where.coinId) {
          list = list.filter((w) => w.coinId === where.coinId);
        }
        return list;
      },

      findFirst: async ({ where = {} } = {}) => {
        return (
          this.watchlists.find(
            (w) =>
              (!where.userId || w.userId === where.userId) &&
              (!where.coinId || w.coinId === where.coinId)
          ) || null
        );
      },

      create: async ({ data }) => {
        const item = {
          id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: data.userId || 'default-user',
          coinId: data.coinId,
          createdAt: new Date().toISOString(),
        };
        this.watchlists.push(item);
        this.save();
        return item;
      },

      deleteMany: async ({ where = {} } = {}) => {
        const initialLen = this.watchlists.length;
        this.watchlists = this.watchlists.filter(
          (w) =>
            !(
              (!where.userId || w.userId === where.userId) &&
              (!where.coinId || w.coinId === where.coinId)
            )
        );
        const count = initialLen - this.watchlists.length;
        if (count > 0) this.save();
        return { count };
      },
    };
  }
}

export const db = new DatabaseService();
export const prisma = db; // Alias for Prisma ORM compatibility
export default db;
