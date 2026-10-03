import { useSearchParams } from 'react-router-dom';
import { coins } from '../data/coins';
import PageHeading from '../components/ui/PageHeading';
import StatsGrid from '../components/market/StatsGrid';
import MarketTable from '../components/market/MarketTable';
export default function Markets() {
  const [params] = useSearchParams();
  return (
    <>
      <PageHeading
        eyebrow="EXPLORE THE MARKET"
        title="Cryptocurrency markets"
        description="Find your next asset. Follow every move."
        action={<span className="quiet-badge">{coins.length} tracked assets</span>}
      />
      <StatsGrid />
      <MarketTable
        coins={coins}
        title="All cryptocurrencies"
        subtitle="Browse by category or sort by the numbers that matter."
        initialQuery={params.get('q') || ''}
        initialSort={params.get('sort') || 'rank'}
        showCategories
      />
    </>
  );
}
