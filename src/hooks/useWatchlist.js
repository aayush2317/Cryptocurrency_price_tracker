import { useContext } from 'react';
import { WatchlistContext } from '../context/watchlist';
export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error('useWatchlist must be used within WatchlistProvider.');
  return context;
}
