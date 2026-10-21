import { useMemo, useId, useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { createHistory, periods } from '../../data/coins';
import { price, compact } from '../../utils/format';
import { useMarketData } from '../../context/MarketDataContext';
import api from '../../services/api';
import CoinAvatar from '../ui/CoinAvatar';
import ChangeBadge from '../ui/ChangeBadge';
import Icon from '../ui/Icon';
import CandleChart from '../CandleChart';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span>
        {new Date(label).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        })}{' '}
        UTC
      </span>
      <strong>{price(payload[0].value)}</strong>
      <small>Live market data</small>
    </div>
  );
}

export default function PriceChart({ coin, detail = false }) {
  const [chartMode, setChartMode] = useState('candle'); // 'candle' | 'line'
  const [period, setPeriod] = useState('7D');
  const [chartData, setChartData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const gradientId = useId().replace(/:/g, '');

  const { priceFlashes } = useMarketData();
  const flash = priceFlashes[coin.id];
  const flashClass = flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : '';

  // Fetch dynamic history from backend API with fallback (for Line mode)
  useEffect(() => {
    if (chartMode !== 'line') return;

    let isMounted = true;
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const intervalMap = {
          '24H': '24h',
          '7D': '7d',
          '1M': '30d',
          '3M': '90d',
          '1Y': '1y',
          ALL: 'all',
        };
        const daysMap = {
          '24H': 1,
          '7D': 7,
          '1M': 30,
          '3M': 90,
          '1Y': 365,
          ALL: 1095,
        };
        const queryInterval = intervalMap[period] || '7d';
        const queryDays = daysMap[period] || 7;
        const points = await api.getCoinHistory(coin.id, {
          days: queryDays,
          interval: queryInterval,
        });
        if (isMounted && Array.isArray(points) && points.length > 0) {
          setChartData(points);
        } else if (isMounted) {
          setChartData(createHistory(coin, period));
        }
      } catch (err) {
        if (isMounted) {
          setChartData(createHistory(coin, period));
        }
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [coin.id, period, chartMode]);

  // Keep last point in sync with live ticking price
  const activeData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return createHistory(coin, period);
    }
    const updated = [...chartData];
    updated[updated.length - 1] = {
      ...updated[updated.length - 1],
      price: coin.price,
    };
    return updated;
  }, [chartData, coin.price, period]);

  const gain =
    activeData.length >= 2
      ? ((activeData[activeData.length - 1].price - activeData[0].price) / activeData[0].price) * 100
      : coin.change;

  const min = Math.min(...activeData.map((d) => d.price));
  const max = Math.max(...activeData.map((d) => d.price));
  const span = max - min || coin.price * 0.01;
  const color = gain >= 0 ? '#56e3b0' : '#f07883';
  const [scale, setScale] = useState('linear');

  return (
    <section
      className={`panel price-panel ${detail ? 'detail-chart' : ''}`}
      aria-label={`${coin.name} price chart`}
    >
      <div className="chart-heading">
        <div className="coin-title">
          <CoinAvatar coin={coin} />
          <h2>
            {coin.name}
            <span>{coin.symbol}</span>
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="chart-type-toggle" role="group" aria-label="Chart mode">
            <button
              onClick={() => setChartMode('candle')}
              className={`chart-type-btn ${chartMode === 'candle' ? 'active' : ''}`}
              title="TradingView Candlestick Engine"
              aria-pressed={chartMode === 'candle'}
            >
              <Icon name="candlestick" size={13} />
              Candles (Live)
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`chart-type-btn ${chartMode === 'line' ? 'active' : ''}`}
              title="Recharts Area Overview"
              aria-pressed={chartMode === 'line'}
            >
              <Icon name="trending" size={13} />
              Area
            </button>
          </div>
          <span className="currency-label">USD</span>
        </div>
      </div>

      {chartMode === 'candle' ? (
        <CandleChart coin={coin} height={detail ? 400 : 460} showHeader={true} />
      ) : (
        <>
          <div className="chart-summary">
            <div>
              <strong className={`chart-price ${flashClass}`}>{price(coin.price)}</strong>
              <div className="chart-gain">
                <ChangeBadge value={gain} />
                <span>
                  past{' '}
                  {period === 'ALL'
                    ? '3 years'
                    : period === '24H'
                      ? '24 hours'
                      : period === '7D'
                        ? '7 days'
                        : period === '1M'
                          ? 'month'
                          : period === '3M'
                            ? '3 months'
                            : 'year'}
                </span>
              </div>
            </div>
            <div className="periods" role="group" aria-label="Chart time period">
              {periods.map((p) => (
                <button
                  key={p}
                  aria-pressed={p === period}
                  onClick={() => setPeriod(p)}
                  className={p === period ? 'selected' : ''}
                  disabled={loadingHistory && p === period}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div
            className="chart-canvas"
            role="img"
            aria-label={`${coin.name} ${period} price chart, from ${price(activeData[0]?.price || 0)} to ${price(coin.price)}`}
            style={{ opacity: loadingHistory ? 0.75 : 1, transition: 'opacity 0.2s ease', height: detail ? 380 : 460 }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 680, height: 235 }}
            >
              <AreaChart
                data={activeData}
                margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#272b2e" strokeDasharray="3 5" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={48}
                  tickCount={6}
                  tick={{ fill: '#88918f', fontSize: 12 }}
                  dy={10}
                  tickFormatter={(n) =>
                    period === '24H'
                      ? new Date(n).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })
                      : new Date(n).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })
                  }
                />
                <YAxis
                  orientation="right"
                  scale={scale}
                  domain={[Math.max(min - span * 0.18, 0.00000001), max + span * 0.18]}
                  tickFormatter={(n) => (coin.price < 1 ? price(n) : '$' + compact(n))}
                  tickLine={false}
                  axisLine={false}
                  tickCount={5}
                  width={coin.price < 0.01 ? 94 : 64}
                  tick={{ fill: '#88918f', fontSize: 12 }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: '#6b7c74', strokeDasharray: '4 4' }}
                />
                <ReferenceLine
                  y={coin.price}
                  stroke={color}
                  strokeDasharray="3 5"
                  strokeOpacity={0.3}
                />
                <Area
                  dataKey="price"
                  type="linear"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: color, stroke: '#12241d', strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            <span>
              <span className="chart-legend" />
              Price (USD)<span className="chart-sample"> · Real-time backend feed</span>
            </span>
            <div role="group" aria-label="Chart scale">
              <button
                className={scale === 'linear' ? 'active' : ''}
                onClick={() => setScale('linear')}
                aria-pressed={scale === 'linear'}
              >
                Linear
              </button>
              <button
                className={scale === 'log' ? 'active' : ''}
                onClick={() => setScale('log')}
                aria-pressed={scale === 'log'}
              >
                Log
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
