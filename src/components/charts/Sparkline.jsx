import { useMemo } from 'react';
import { createHistory } from '../../data/coins';
export default function Sparkline({ coin }) {
  const values = useMemo(() => createHistory(coin, '7D', 35).map((d) => d.price), [coin]);
  const min = Math.min(...values),
    max = Math.max(...values);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 110},${30 - ((v - min) / (max - min || 1)) * 26}`)
    .join(' ');
  return (
    <svg
      className="sparkline"
      viewBox="0 0 110 34"
      role="img"
      aria-label={`${coin.name} simulated seven day price trend`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={coin.change >= 0 ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
