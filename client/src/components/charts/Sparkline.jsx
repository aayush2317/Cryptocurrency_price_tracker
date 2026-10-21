import React, { useMemo, useId } from 'react';
import { createHistory } from '../../data/coins';

export default function Sparkline({ coin }) {
  const gradientId = useId().replace(/:/g, '');
  const values = useMemo(() => createHistory(coin, '7D', 35).map((d) => d.price), [coin]);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * 110).toFixed(1)},${(30 - ((v - min) / span) * 24).toFixed(1)}`)
    .join(' ');

  const strokeColor = coin.change >= 0 ? '#10B981' : '#F43F5E';

  return (
    <svg
      className="sparkline"
      viewBox="0 0 110 34"
      role="img"
      aria-label={`${coin.name} seven day price trend`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={`0,34 ${points} 110,34`} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
