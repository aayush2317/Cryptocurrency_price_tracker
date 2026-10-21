import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/coins';
import { price, moneyCompact } from '../../utils/format';
import { useMarketData } from '../../context/MarketDataContext';
import CoinAvatar from '../ui/CoinAvatar';
import ChangeBadge from '../ui/ChangeBadge';
import WatchButton from '../ui/WatchButton';
import Icon from '../ui/Icon';
import Sparkline from '../charts/Sparkline';
import { SkeletonTableRows } from '../ui/Skeleton';

const PAGE_SIZE = 8;

export default function MarketTable({
  coins: propCoins,
  title = 'Cryptocurrency prices',
  subtitle = 'A closer look at the market.',
  initialQuery = '',
  initialSort = 'rank',
  showCategories = false,
}) {
  const { coins: contextCoins, loading: contextLoading, priceFlashes = {} } = useMarketData();
  const effectiveCoins = Array.isArray(propCoins) ? propCoins : (Array.isArray(contextCoins) ? contextCoins : []);
  const isLoading = contextLoading && (!effectiveCoins || effectiveCoins.length === 0);

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('All assets');
  const [sort, setSort] = useState({
    key: initialSort === 'gainers' || initialSort === 'losers' ? 'change' : initialSort || 'rank',
    direction: initialSort === 'gainers' ? 'desc' : 'asc',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    setSort({
      key: initialSort === 'gainers' || initialSort === 'losers' ? 'change' : initialSort || 'rank',
      direction: initialSort === 'gainers' ? 'desc' : 'asc',
    });
    setPage(1);
  }, [initialSort]);

  const filtered = useMemo(() => {
    return effectiveCoins
      .filter((c) => {
        if (!c) return false;
        const matchesCategory = category === 'All assets' || c.category === category;
        const name = c.name || '';
        const symbol = c.symbol || '';
        const matchesQuery = `${name} ${symbol}`
          .toLowerCase()
          .includes((query || '').trim().toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        const key = sort.key;
        let valA = a[key];
        let valB = b[key];

        if (valA === undefined) valA = a.rank;
        if (valB === undefined) valB = b.rank;

        const result =
          typeof valA === 'string'
            ? valA.localeCompare(valB)
            : valA - valB;
        return sort.direction === 'asc' ? result : -result;
      });
  }, [effectiveCoins, query, category, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const displayed = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function sortBy(key) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    setPage(1);
  }

  function sortHead(label, key, cls = '') {
    const isSorted = sort.key === key;
    return (
      <th
        scope="col"
        className={cls}
        aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button onClick={() => sortBy(key)}>
          {label}
          <Icon name="sort" size={12} />
        </button>
      </th>
    );
  }

  return (
    <section className="panel market-panel" aria-label={title}>
      <div className="market-heading">
        <div>
          <h2>
            {title}
            <span className="count-badge">{filtered.length}</span>
          </h2>
          <p>{subtitle}</p>
        </div>
        <label className="search-field table-search">
          <Icon name="search" size={17} />
          <input
            aria-label="Search cryptocurrencies"
            placeholder="Search coins…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setPage(1);
              }}
              aria-label="Clear coin search"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
      </div>

      {showCategories && (
        <div className="category-filters" role="group" aria-label="Market category">
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? 'selected' : ''}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Live cryptocurrency prices in US dollars. Select a column heading to sort. Select a
            coin for details.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="watch-cell">
                <span className="sr-only">Watchlist</span>
              </th>
              {sortHead('#', 'rank', 'rank-cell')}
              {sortHead('Asset', 'name', 'asset-cell')}
              {sortHead('Price', 'price', 'numeric price-col w-[160px] min-w-[160px]')}
              {sortHead('24h change', 'change', 'numeric w-[110px] min-w-[110px]')}
              {sortHead('Market cap', 'marketCap', 'numeric cap-cell')}
              {sortHead('Volume (24h)', 'volume', 'numeric volume-cell')}
              <th scope="col" className="trend-cell">
                Last 7 days
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonTableRows rows={PAGE_SIZE} />
            ) : (
              (displayed || []).map((coin) => {
                if (!coin) return null;
                const flash = priceFlashes[coin.id];
                const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

                return (
                  <tr key={coin.id}>
                    <td className="watch-cell">
                      <WatchButton coin={coin} />
                    </td>
                    <td className="rank-cell tabular-nums">{coin.rank}</td>
                    <td className="asset-cell">
                      <Link to={`/coin/${coin.id}`} className="table-coin">
                        <CoinAvatar coin={coin} />
                        <span>
                          <strong>{coin.name}</strong>
                          <span className="coin-symbol">{coin.symbol}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="numeric price-col py-4 px-4 text-right font-medium text-white tabular-nums w-[160px] min-w-[160px]">
                      <span className={`inline-block transition-colors duration-500 tabular-nums ${flashClass}`}>
                        {price(coin.price)}
                      </span>
                    </td>
                    <td className="numeric tabular-nums w-[110px] min-w-[110px]">
                      <ChangeBadge value={coin.change} />
                    </td>
                    <td className="numeric cap-cell tabular-nums">{moneyCompact(coin.marketCap)}</td>
                    <td className="numeric volume-cell tabular-nums">{moneyCompact(coin.volume)}</td>
                    <td className="trend-cell">
                      <Sparkline coin={coin} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !displayed.length && (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="search" size={28} />
          </span>
          <h3>No coins found</h3>
          <p>Try a different name, symbol, or category.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setQuery('');
              setCategory('All assets');
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="table-footer">
        <p role="status">
          {filtered.length
            ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} assets`
            : '0 assets'}
        </p>
        <div className="pagination" aria-label="Table pagination">
          <button
            aria-label="Previous page"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
          >
            <Icon name="left" size={16} />
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              aria-label={`Page ${i + 1}`}
              aria-current={safePage === i + 1 ? 'page' : undefined}
              className={safePage === i + 1 ? 'selected' : ''}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            aria-label="Next page"
            disabled={safePage === pages}
            onClick={() => setPage(safePage + 1)}
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
