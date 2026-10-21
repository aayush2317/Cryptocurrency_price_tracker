import { useMarketData } from '../../context/MarketDataContext';
import { marketStats as fallbackStats } from '../../data/coins';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import { SkeletonStatCards } from '../ui/Skeleton';

export default function StatsGrid() {
  const { marketStats, loading } = useMarketData();

  if (loading && !marketStats) {
    return <SkeletonStatCards count={3} />;
  }

  const stats = Array.isArray(marketStats?.stats)
    ? marketStats.stats
    : Array.isArray(fallbackStats)
      ? fallbackStats
      : [];

  return (
    <div className="stats-grid">
      {(stats || []).map((stat, i) => (
        <section
          key={stat.kind}
          className="panel stat-card !p-4 sm:!p-5 bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 shadow-[6px_6px_16px_rgba(163,177,198,0.25),-6px_-6px_16px_rgba(255,255,255,0.9)] dark:shadow-none text-slate-900 dark:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
          aria-label={stat.label}
        >
          <div className="stat-top">
            <span>{stat.label}</span>
            <div className="stat-icon">
              <Icon name={stat.kind} size={18} />
            </div>
          </div>
          <div className="stat-values">
            <strong className="text-slate-900 dark:text-white">{stat.value}</strong>
            <ChangeBadge value={stat.change} pill />
          </div>
          <div className="stat-bottom">
            <span>{stat.note}</span>
            {stat.kind === 'dominance' || i === 2 ? (
              <div className="dominance-mini" aria-hidden="true">
                <span style={{ width: stat.value ? `${parseFloat(stat.value)}%` : '54.2%' }} />
              </div>
            ) : (
              <svg viewBox="0 0 84 21" aria-hidden="true">
                <polyline
                  points={
                    i === 0
                      ? '0,18 8,13 14,16 21,10 28,12 36,7 43,11 51,6 58,8 66,3 75,6 84,1'
                      : '0,16 8,18 15,11 22,14 30,7 37,12 44,4 52,9 60,5 68,8 76,2 84,4'
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
