import { useMemo, useId, useState } from 'react';
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
import CoinAvatar from '../ui/CoinAvatar';
import ChangeBadge from '../ui/ChangeBadge';
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
      <small>Sample price</small>
    </div>
  );
}
export default function PriceChart({  coin,
  detail = false,
  livePrice, }) {
  const hasLivePrice =
  Number.isFinite(livePrice) && livePrice > 0;
  const [period, setPeriod] = useState('7D');
  const gradientId = useId().replace(/:/g, '');
  const data = useMemo(() => createHistory(coin, period), [coin, period]);
  const gain = (data.at(-1).price / data[0].price - 1) * 100;
  const min = Math.min(...data.map((d) => d.price)),
    max = Math.max(...data.map((d) => d.price));
  const span = max - min || coin.price * 0.01;
  const color = gain >= 0 ? 'var(--chart-rise)' : 'var(--chart-fall)';
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
        <span className="currency-label">USD</span>
      </div>
      <div className="chart-summary">
        <div>
          <strong className="chart-price"> {price(hasLivePrice ? livePrice : coin.price)}</strong>
          {hasLivePrice && (
  <small
    style={{
      display: "block",
      marginTop: "5px",
      color: "var(--muted)",
    }}
  >
    Simulated live price · Chart and percentage use sample history
  </small>
)}
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
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div
        className="chart-canvas"
        role="img"
        aria-label={`${coin.name} ${period} sample price chart, from ${price(data[0].price)} to ${price(coin.price)}`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 680, height: 235 }}
        >
          <AreaChart
            data={data}
            margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
              tickCount={6}
              tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
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
              tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'var(--chart-cursor)', strokeDasharray: '4 4' }}
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
              activeDot={{ r: 5, fill: color, stroke: 'var(--chart-dot-ring)', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <span>
          <span className="chart-legend" />
          Price (USD)<span className="chart-sample"> · Sample historical data</span>
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
    </section>
  );
}
