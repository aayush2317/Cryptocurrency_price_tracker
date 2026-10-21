import { useContext } from 'react';
import { MarketDataContext } from '../context/marketData';

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}

export default useMarketData;
