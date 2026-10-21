import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../context/MarketDataContext';
import { coins as fallbackCoins } from '../data/coins';
import PageHeading from '../components/ui/PageHeading';
import StatsGrid from '../components/market/StatsGrid';
import CandleChart from '../components/CandleChart';
import MarketMovers from '../components/market/MarketMovers';
import QuickConverter from '../components/market/QuickConverter';
import MarketTable from '../components/market/MarketTable';
import ErrorState from '../components/ui/ErrorState';
import Icon from '../components/ui/Icon';

export default function Dashboard() {
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

  const currentCoins = coins || [];
  const featuredCoin = currentCoins.find((c) => c?.id === 'bitcoin') || currentCoins[0] || fallbackCoins[0];
  const marketChange = marketStats?.marketCapChange24h ?? 2.34;
  const isPositive = marketChange >= 0;

  return (
    <>
      {error && !currentCoins.length && (
        <ErrorState
          title="Backend Connection Offline"
          message="Could not reach the CryptoPulse backend. Make sure the Node server is running on port 5000."
          onRetry={refresh}
        />
      )}

      <PageHeading
        eyebrow="YOUR MARKET AT A GLANCE"
        title="Market overview"
        description={
          <>
            The global crypto market is{' '}
            <span className={isPositive ? 'positive' : 'negative'}>
              {isPositive ? '+' : ''}{marketChange}%
            </span>{' '}
            in the last 24 hours.
          </>
        }
        action={
          <span className="snapshot-date">
            <span className="live-pulse-dot" style={{ display: 'inline-block', marginRight: '6px' }} />
            Live Market Feed
          </span>
        }
      />

      <StatsGrid />

      {/* Tight vertical alignment with minimal margins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 items-start mb-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 shadow-[6px_6px_16px_rgba(163,177,198,0.25),-6px_-6px_16px_rgba(255,255,255,0.9)] dark:shadow-none text-slate-900 dark:text-white rounded-2xl p-4 flex flex-col justify-between">
            {/* Chart Header (Asset info, Live Feed pill, Timeframes) */}
            <div className="h-[490px] w-full relative">
              <CandleChart
                coin={featuredCoin}
                coinId={featuredCoin?.id || 'bitcoin'}
                height={435}
                showHeader={true}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Movers & Converter */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Upper Right: Market Movers */}
          <MarketMovers />

          {/* Bottom Right: Compact Quick Converter */}
          <QuickConverter />
        </div>
      </div>

      <div className="section-label-row">
        <div>
          <span className="section-dot" />
          THE BIG PICTURE
        </div>
        <Link to="/markets">
          View all markets <Icon name="chevronRight" size={14} />
        </Link>
      </div>

      <MarketTable
        coins={currentCoins}
        subtitle="Explore prices, spot trends, and follow your next move."
      />
    </>
  );
}
