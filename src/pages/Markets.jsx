import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketData } from '../context/MarketDataContext';
import { coins as fallbackCoins } from '../data/coins';
import PageHeading from '../components/ui/PageHeading';
import StatsGrid from '../components/market/StatsGrid';
import MarketTable from '../components/market/MarketTable';
import ErrorState from '../components/ui/ErrorState';

export default function Markets() {
  const [params] = useSearchParams();
  const { coins: liveCoins, marketStats: liveMarketStats, error, refresh } = useMarketData();

  // Explicit null-safe states defaulting to empty array and null
  const [coins, setCoins] = useState([]);
  const [marketStats, setMarketStats] = useState(null);

  useEffect(() => {
    if (Array.isArray(liveCoins) && liveCoins.length > 0) {
      setCoins(liveCoins);
    } else if (Array.isArray(fallbackCoins)) {
      setCoins(fallbackCoins);
    } else {
      setCoins([]);
    }
  }, [liveCoins]);

  useEffect(() => {
    setMarketStats(liveMarketStats || null);
  }, [liveMarketStats]);

  const totalAssets = (coins || []).length;

  return (
    <>
      {error && !(coins || []).length && (
        <ErrorState
          title="Market Data Offline"
          message="Could not load real-time market data from the backend proxy."
          onRetry={refresh}
        />
      )}

      <PageHeading
        eyebrow="EXPLORE THE MARKET"
        title="Cryptocurrency markets"
        description="Find your next asset. Follow every move."
        action={<span className="quiet-badge">{totalAssets} tracked assets</span>}
      />
      <StatsGrid />
      <MarketTable
        coins={coins || []}
        title="All cryptocurrencies"
        subtitle="Browse by category or sort by the numbers that matter."
        initialQuery={params.get('q') || ''}
        initialSort={params.get('sort') || 'rank'}
        showCategories
      />
    </>
  );
}
