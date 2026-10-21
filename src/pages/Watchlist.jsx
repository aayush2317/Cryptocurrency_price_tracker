import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../context/MarketDataContext';
import { coins as fallbackCoins } from '../data/coins';
import { useWatchlist } from '../hooks/useWatchlist';
import PageHeading from '../components/ui/PageHeading';
import MarketTable from '../components/market/MarketTable';
import Icon from '../components/ui/Icon';
import CoinAvatar from '../components/ui/CoinAvatar';
import ChangeBadge from '../components/ui/ChangeBadge';
import Sparkline from '../components/charts/Sparkline';
import { price } from '../utils/format';

export default function Watchlist() {
  const { ids, storageError, syncedWithBackend } = useWatchlist();
  const { coins: liveCoins, marketStats: liveMarketStats, priceFlashes } = useMarketData();

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
  const validIds = Array.isArray(ids) ? ids : [];
  const saved = (currentCoins || []).filter((c) => c && validIds.includes(c.id));

  return (
    <>
      <PageHeading
        eyebrow="YOUR CORNER OF THE MARKET"
        title="Your watchlist"
        description="The assets you care about, all in one place."
        action={
          <Link to="/markets" className="button button-primary">
            <Icon name="plus" size={17} />
            Add assets
          </Link>
        }
      />
      <div className="local-note">
        <Icon name="info" size={15} />
        {storageError
          ? 'Browser storage is unavailable. Changes will last for this session only.'
          : syncedWithBackend
            ? 'Backend synchronized. Your watchlist persists across sessions.'
            : 'Saved on this device and queued for backend synchronization.'}
      </div>
      {(saved || []).length > 0 ? (
        <>
          <div className="watchlist-cards">
            {(saved.slice(0, 3) || []).map((coin) => {
              const flash = priceFlashes?.[coin.id];
              const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

              return (
                <Link to={`/coin/${coin.id}`} className="panel watch-summary" key={coin.id}>
                  <div className="watch-summary-title">
                    <CoinAvatar coin={coin} />
                    <div>
                      <strong>{coin.name}</strong>
                      <span>{coin.symbol}</span>
                    </div>
                    <Icon name="chevronRight" size={16} />
                  </div>
                  <div className="watch-summary-price">
                    <strong className={`tabular-nums ${flashClass}`}>{price(coin.price)}</strong>
                    <Sparkline coin={coin} />
                  </div>
                  <ChangeBadge value={coin.change} />
                  <span className="watch-summary-time">past 24 hours · live feed</span>
                </Link>
              );
            })}
          </div>
          <MarketTable
            coins={saved || []}
            title="Saved assets"
            subtitle="Your personal view of the market. Select a star to remove an asset."
          />
        </>
      ) : (
        <div className="panel empty-state watchlist-empty">
          <span className="empty-icon">
            <Icon name="star" size={30} />
          </span>
          <h2>A little focus goes a long way.</h2>
          <p>
            Star the coins you want to follow.
            <br />
            They’ll be waiting for you here.
          </p>
          <Link to="/markets" className="button button-primary">
            Explore markets
          </Link>
        </div>
      )}
    </>
  );
}
