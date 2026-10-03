import { Link, useParams } from 'react-router-dom';
import { coins, descriptions } from '../data/coins';
import CoinAvatar from '../components/ui/CoinAvatar';
import WatchButton from '../components/ui/WatchButton';
import ChangeBadge from '../components/ui/ChangeBadge';
import PriceChart from '../components/charts/PriceChart';
import Icon from '../components/ui/Icon';
import { price, moneyCompact, number } from '../utils/format';
import NotFound from './NotFound';
export default function CoinDetails() {
  const { coinId } = useParams();
  const coin = coins.find((c) => c.id === coinId);
  if (!coin) return <NotFound />;
  const supply = coin.maxSupply
    ? Math.min(100, (coin.circulatingSupply / coin.maxSupply) * 100)
    : null;
  const metrics = [
    ['Market capitalization', moneyCompact(coin.marketCap)],
    ['Trading volume (24h)', moneyCompact(coin.volume)],
    ['All-time high', price(coin.ath)],
    ['Circulating supply', `${number(coin.circulatingSupply)} ${coin.symbol}`],
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
        <strong>{price(coin.price)}</strong>
        <ChangeBadge value={coin.change} pill />
        <span>past 24 hours</span>
      </div>
      <div className="detail-grid">
        <PriceChart key={coin.id} coin={coin} detail />
        <section className="panel coin-statistics">
          <div className="panel-heading">
            <h2>Market statistics</h2>
            <Icon name="markets" size={18} />
          </div>
          <dl>
            {metrics.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="supply-details">
            <div>
              <span>Circulating / max supply</span>
              <strong>{supply === null ? 'No fixed cap' : supply.toFixed(1) + '%'}</strong>
            </div>
            {supply !== null && (
              <div
                className="supply-bar"
                role="progressbar"
                aria-label="Circulating share of maximum supply"
                aria-valuenow={Number(supply.toFixed(1))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${supply}%` }} />
              </div>
            )}
            <p>
              {coin.maxSupply
                ? `${number(coin.circulatingSupply)} / ${number(coin.maxSupply)} ${coin.symbol}`
                : `${number(coin.circulatingSupply)} ${coin.symbol} circulating`}
            </p>
          </div>
        </section>
      </div>
      <section className="panel about-coin">
        <div>
          <div className="eyebrow">THE FUNDAMENTALS</div>
          <h2>About {coin.name}</h2>
        </div>
        <p>
          {descriptions[coin.id] ||
            `${coin.name} (${coin.symbol}) is a cryptocurrency in the ${coin.category.toLowerCase()} category. Explore its sample price history, trading activity, and supply statistics above.`}
        </p>
        <div className="about-note">
          <Icon name="info" size={15} />
          Market figures and charts are illustrative sample data.
        </div>
      </section>
    </>
  );
}
