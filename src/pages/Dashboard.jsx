import { Link } from 'react-router-dom';
import { coins, SNAPSHOT_DATE } from '../data/coins';
import PageHeading from '../components/ui/PageHeading';
import StatsGrid from '../components/market/StatsGrid';
import PriceChart from '../components/charts/PriceChart';
import MarketMovers from '../components/market/MarketMovers';
import MarketTable from '../components/market/MarketTable';
import Icon from '../components/ui/Icon';
export default function Dashboard({ livePrices }) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR MARKET AT A GLANCE"
        title="Market overview"
        description={
          <>
            The global crypto market is up <span className="positive">2.34%</span> in the last 24
            hours.
          </>
        }
        action={
          <span className="snapshot-date">
            {SNAPSHOT_DATE}
            <span>Sample snapshot</span>
          </span>
        }
      />
      <StatsGrid />
      <div className="overview-grid">
        <PriceChart coin={coins[0]} 
         livePrice={livePrices.bitcoin}/>
        <MarketMovers />
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
        coins={coins}
  livePrices={livePrices}
  subtitle="Explore prices, spot trends, and follow your next move."
      />
    </>
  );
}
