import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMarketData } from '../context/MarketDataContext';
import { coins as fallbackCoins, descriptions } from '../data/coins';
import api from '../services/api';
import CoinAvatar from '../components/ui/CoinAvatar';
import WatchButton from '../components/ui/WatchButton';
import ChangeBadge from '../components/ui/ChangeBadge';
import PriceChart from '../components/charts/PriceChart';
import Icon from '../components/ui/Icon';
import { price, moneyCompact, number } from '../utils/format';
import NotFound from './NotFound';

export default function CoinDetails() {
  const { coinId } = useParams();
  const { coins: liveCoins, priceFlashes } = useMarketData();
  const [apiCoin, setApiCoin] = useState(null);

  // Fetch detailed coin info from backend API
  useEffect(() => {
    let isMounted = true;
    if (coinId) {
      api.getCoin(coinId)
        .then((data) => {
          if (isMounted) setApiCoin(data);
        })
        .catch(() => {
          // Handled via context fallback
        });
    }
    return () => {
      isMounted = false;
    };
  }, [coinId]);

  const liveCoin = Array.isArray(liveCoins) ? liveCoins.find((c) => c?.id === coinId) : null;
  const fallbackCoin = Array.isArray(fallbackCoins) ? fallbackCoins.find((c) => c?.id === coinId) : null;
  const coin = liveCoin || apiCoin || fallbackCoin;

  if (!coin) return <NotFound />;

  const flash = priceFlashes?.[coin.id];
  const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

  const supply = coin.maxSupply
    ? Math.min(100, (coin.circulatingSupply / coin.maxSupply) * 100)
    : null;

  const low24h = coin.low24h || coin.price * 0.98;
  const high24h = coin.high24h || coin.price * 1.02;
  const rangeSpan = high24h - low24h || 1;
  const rangePercent = Math.min(100, Math.max(0, ((coin.price - low24h) / rangeSpan) * 100));

  const metrics = [
    ['Market capitalization', moneyCompact(coin.marketCap)],
    ['Trading volume (24h)', moneyCompact(coin.volume)],
    ['All-time high', price(coin.ath)],
    ['Circulating supply', `${number(coin.circulatingSupply)} ${coin.symbol}`],
    ['24h High', price(high24h)],
    ['24h Low', price(low24h)],
  ];

  return (
    <>
      <Link to="/markets" className="back-link">
        <Icon name="left" size={16} />
        All markets
      </Link>
      <div className="coin-detail-heading">
        <div className="coin-detail-title">
          <CoinAvatar coin={coin} size="large" />
          <div>
            <div className="coin-heading-name">
              <h1>{coin.name}</h1>
              <span>{coin.symbol}</span>
            </div>
            <div className="coin-tags">
              <span>Rank #{coin.rank}</span>
              <span>{coin.category}</span>
            </div>
          </div>
        </div>
        <WatchButton coin={coin} expanded />
      </div>
      <div className="detail-price">
        <strong className={`tabular-nums ${flashClass}`}>{price(coin.price)}</strong>
        <ChangeBadge value={coin.change} pill />
        <span>past 24 hours · live feed</span>
      </div>
      <div className="detail-grid">
        <PriceChart key={coin.id} coin={coin} detail />
        <section className="panel coin-statistics bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 shadow-[6px_6px_16px_rgba(163,177,198,0.25),-6px_-6px_16px_rgba(255,255,255,0.9)] dark:shadow-none text-slate-900 dark:text-white">
          <div className="panel-heading">
            <h2>Market statistics</h2>
            <Icon name="markets" size={18} />
          </div>

          {/* 24h Price Range progress bar */}
          <div className="range-card bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 mt-3">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400 font-medium">
              <span>24h Low: <strong className="text-slate-900 dark:text-white tabular-nums ml-1">{price(low24h)}</strong></span>
              <span className="uppercase tracking-wider text-[11px] text-slate-500 dark:text-gray-500 font-semibold">24h Range</span>
              <span>24h High: <strong className="text-slate-900 dark:text-white tabular-nums ml-1">{price(high24h)}</strong></span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${rangePercent}%` }}
              />
            </div>
          </div>

          {/* Clean grid tiles */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {(metrics || []).map(([label, value]) => (
              <div
                key={label}
                className="bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                <span className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums mt-1">{value}</span>
              </div>
            ))}
          </div>

          {/* Circulating / Max Supply Card */}
          <div className="supply-details bg-slate-50 dark:bg-[#161B22] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 mt-3">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              <span>Circulating / max supply</span>
              <strong className="text-slate-900 dark:text-white tabular-nums text-sm font-semibold">{supply === null ? 'No fixed cap' : supply.toFixed(1) + '%'}</strong>
            </div>
            {supply !== null && (
              <div
                className="supply-bar w-full bg-slate-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2"
                role="progressbar"
                aria-label="Circulating share of maximum supply"
                aria-valuenow={Number(supply.toFixed(1))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${supply}%` }} />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
              {coin.maxSupply
                ? `${number(coin.circulatingSupply)} / ${number(coin.maxSupply)} ${coin.symbol}`
                : `${number(coin.circulatingSupply)} ${coin.symbol} circulating`}
            </p>
          </div>
        </section>
      </div>
      <section className="panel about-coin bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 shadow-[6px_6px_16px_rgba(163,177,198,0.25),-6px_-6px_16px_rgba(255,255,255,0.9)] dark:shadow-none text-slate-900 dark:text-white">
        <div>
          <div className="eyebrow">THE FUNDAMENTALS</div>
          <h2>About {coin.name}</h2>
        </div>
        <p>
          {coin.description ||
            descriptions[coin.id] ||
            `${coin.name} (${coin.symbol}) is a cryptocurrency in the ${coin.category.toLowerCase()} category. Explore its live price history, trading activity, and supply statistics above.`}
        </p>
        <div className="about-note">
          <Icon name="info" size={15} />
          Connected to live CryptoPulse price feed simulator.
        </div>
      </section>
    </>
  );
}
