import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../../context/MarketDataContext';
import { coins as fallbackCoins, trendingIds } from '../../data/coins';
import CoinAvatar from '../ui/CoinAvatar';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import { SkeletonMovers } from '../ui/Skeleton';
import { price } from '../../utils/format';

export default function MarketMovers() {
  const [tab, setTab] = useState('Trending');
  const { coins: liveCoins, loading, priceFlashes } = useMarketData();

  const currentCoins = Array.isArray(liveCoins) && liveCoins.length > 0 ? liveCoins : (Array.isArray(fallbackCoins) ? fallbackCoins : []);

  if (loading && (!liveCoins || liveCoins.length === 0)) {
    return <SkeletonMovers />;
  }

  const list =
    tab === 'Trending'
      ? (Array.isArray(trendingIds) ? trendingIds : [])
          .map((id) => currentCoins.find((c) => c?.id === id))
          .filter(Boolean)
      : [...currentCoins]
          .sort((a, b) => (tab === 'Top gainers' ? b.change - a.change : a.change - b.change))
          .slice(0, 5);

  return (
    <section className="panel movers-panel">
      <div className="panel-heading">
        <h2>Market movers</h2>
        <Icon name="trending" size={18} />
      </div>
      <div className="mover-tabs" role="tablist" aria-label="Market movers">
        {['Trending', 'Top gainers', 'Top losers'].map((t) => (
          <button
            id={`mover-${t.replace(' ', '-')}`}
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls="movers-list"
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              const names = ['Trending', 'Top gainers', 'Top losers'];
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = names[(names.indexOf(t) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
                setTab(next);
                document.getElementById(`mover-${next.replace(' ', '-')}`)?.focus();
              }
            }}
            className={tab === t ? 'selected' : ''}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="movers-list"
        aria-labelledby={`mover-${tab.replace(' ', '-')}`}
        className="movers-list"
      >
        {(list || []).map((coin, i) => {
          if (!coin) return null;
          const flash = priceFlashes[coin.id];
          const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

          return (
            <Link to={`/coin/${coin.id}`} className="mover-row" key={coin.id}>
              <span className="mover-rank">{i + 1}</span>
              <CoinAvatar coin={coin} size="small" />
              <div className="mover-name">
                <strong>{coin.name}</strong>
                <span>{coin.symbol}</span>
              </div>
              <div className="mover-value">
                <strong className={`tabular-nums ${flashClass}`}>{price(coin.price)}</strong>
                <ChangeBadge value={coin.change} showIcon={false} />
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        className="movers-all"
        to={`/markets${tab === 'Top gainers' ? '?sort=gainers' : tab === 'Top losers' ? '?sort=losers' : ''}`}
      >
        Explore all markets <Icon name="chevronRight" size={14} />
      </Link>
    </section>
  );
}
