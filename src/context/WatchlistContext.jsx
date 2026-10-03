import { useState, useCallback, useEffect } from 'react';
import { coins } from '../data/coins';
import { WatchlistContext } from './watchlist';
const KEY = 'cryptopulse:watchlist:v1';
const DEFAULTS = ['bitcoin', 'ethereum', 'solana'];
function readSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return DEFAULTS;
    const value = JSON.parse(raw);
    return Array.isArray(value)
      ? [...new Set(value)].filter((id) => coins.some((c) => c.id === id))
      : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(readSaved);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [ids]);
  useEffect(() => {
    const sync = (e) => {
      if (e.key === KEY) setIds(readSaved());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  const toggle = useCallback((id) => {
    const coin = coins.find((c) => c.id === id);
    if (!coin) return;
    setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setNotice(`${coin.name} watchlist updated`);
  }, []);
  return (
    <WatchlistContext.Provider value={{ ids, toggle, storageError }}>
      {children}
      <div role="status" aria-live="polite" className={`toast ${notice ? 'toast-visible' : ''}`}>
        {notice}
      </div>
    </WatchlistContext.Provider>
  );
}
