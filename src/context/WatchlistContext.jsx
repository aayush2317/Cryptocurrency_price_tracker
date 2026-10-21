import { useState, useCallback, useEffect } from 'react';
import { WatchlistContext } from './watchlist';
import api from '../services/api';

const KEY = 'cryptopulse:watchlist:v1';
const DEFAULTS = ['bitcoin', 'ethereum', 'solana'];

function readSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return DEFAULTS;
    const value = JSON.parse(raw);
    return Array.isArray(value) && value.length > 0
      ? [...new Set(value)]
      : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(readSaved);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [syncedWithBackend, setSyncedWithBackend] = useState(false);

  // Sync with backend on initial mount
  useEffect(() => {
    let isMounted = true;
    async function initWatchlist() {
      try {
        const data = await api.getWatchlist();
        if (isMounted && data?.watchlist && Array.isArray(data.watchlist)) {
          setIds(data.watchlist);
          setSyncedWithBackend(true);
          try {
            localStorage.setItem(KEY, JSON.stringify(data.watchlist));
          } catch {
            // LocalStorage failure
          }
        }
      } catch (err) {
        console.warn('Backend watchlist sync unavailable, using local cache:', err.message);
        setSyncedWithBackend(false);
      }
    }
    initWatchlist();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage whenever ids change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [ids]);

  // Sync across browser tabs
  useEffect(() => {
    const sync = (e) => {
      if (e.key === KEY) setIds(readSaved());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Toast notice timer
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const toggle = useCallback(
    async (id, coinName = '') => {
      if (!id) return;

      // Optimistic update
      const willBeSaved = !ids.includes(id);
      const updatedIds = willBeSaved ? [...ids, id] : ids.filter((item) => item !== id);
      setIds(updatedIds);

      const displayName = coinName || id.charAt(0).toUpperCase() + id.slice(1);
      setNotice(
        willBeSaved
          ? `Added ${displayName} to watchlist`
          : `Removed ${displayName} from watchlist`
      );

      // Persist to backend
      try {
        const res = await api.toggleWatchlist(id);
        if (res?.watchlist && Array.isArray(res.watchlist)) {
          setIds(res.watchlist);
          setSyncedWithBackend(true);
        }
      } catch (err) {
        console.warn('Backend watchlist update failed, persisted locally:', err.message);
        setSyncedWithBackend(false);
      }
    },
    [ids]
  );

  return (
    <WatchlistContext.Provider
      value={{
        ids,
        toggle,
        storageError,
        syncedWithBackend,
      }}
    >
      {children}
      <div role="status" aria-live="polite" className={`toast ${notice ? 'toast-visible' : ''}`}>
        {notice}
      </div>
    </WatchlistContext.Provider>
  );
}
