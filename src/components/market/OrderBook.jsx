import React, { useState, useEffect, useMemo } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { price } from '../../utils/format';
import Icon from '../ui/Icon';

export default function OrderBook() {
  const { coins: liveCoins, priceFlashes } = useMarketData();

  const btcCoin = useMemo(() => {
    return (
      (Array.isArray(liveCoins) && liveCoins.find((c) => c?.id === 'bitcoin' || c?.symbol?.toLowerCase() === 'btc')) || {
        price: 84645.99,
        symbol: 'BTC',
      }
    );
  }, [liveCoins]);

  const currentPrice = btcCoin.price || 84645.99;
  const flash = priceFlashes?.['bitcoin'];

  // Seed initial micro-depth sizes
  const [askSizes, setAskSizes] = useState([0.842, 1.250, 0.315, 2.110, 0.540]);
  const [bidSizes, setBidSizes] = useState([0.620, 1.840, 0.420, 1.150, 2.380]);
  const [lastTickDirection, setLastTickDirection] = useState('up');

  // Periodically fluctuate order sizes to simulate an active institutional trading floor
  useEffect(() => {
    const interval = setInterval(() => {
      setAskSizes((prev) =>
        prev.map((s) => {
          const delta = (Math.random() - 0.48) * 0.35;
          return Math.max(0.08, parseFloat((s + delta).toFixed(3)));
        })
      );
      setBidSizes((prev) =>
        prev.map((s) => {
          const delta = (Math.random() - 0.48) * 0.35;
          return Math.max(0.08, parseFloat((s + delta).toFixed(3)));
        })
      );
      setLastTickDirection(Math.random() > 0.45 ? 'up' : 'down');
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  // Compute 5 Asks (Sell Orders - Rose #F43F5E)
  const asks = useMemo(() => {
    const offsets = [9.5, 6.8, 4.4, 2.6, 1.2]; // In descending order so closest to mid-price is at bottom
    const maxAsk = Math.max(...askSizes, 1);
    return offsets.map((offset, idx) => {
      const askPrice = currentPrice + offset;
      const size = askSizes[idx] || 0.5;
      const depthPercent = Math.min(100, Math.round((size / maxAsk) * 90) + 10);
      return { price: askPrice, size, depthPercent };
    });
  }, [currentPrice, askSizes]);

  // Compute 5 Bids (Buy Orders - Emerald #10B981)
  const bids = useMemo(() => {
    const offsets = [1.1, 2.5, 4.2, 6.5, 9.2]; // In ascending offset from mid-price
    const maxBid = Math.max(...bidSizes, 1);
    return offsets.map((offset, idx) => {
      const bidPrice = currentPrice - offset;
      const size = bidSizes[idx] || 0.5;
      const depthPercent = Math.min(100, Math.round((size / maxBid) * 90) + 10);
      return { price: bidPrice, size, depthPercent };
    });
  }, [currentPrice, bidSizes]);

  const spread = (asks[asks.length - 1]?.price - bids[0]?.price) || 2.3;

  return (
    <div
      className="order-book-card bg-[#0D1117] border border-white/5 rounded-2xl p-4 shadow-lg"
      style={{
        backgroundColor: '#0D1117',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '16px',
        color: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}
      >
        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="text-xs font-semibold text-gray-300 uppercase tracking-wider"
            style={{ fontSize: '11px', fontWeight: 600, color: '#D1D5DB', letterSpacing: '0.06em' }}
          >
            Order Book
          </span>
          <span
            className="text-[10px] font-mono text-gray-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
            style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9CA3AF' }}
          >
            BTC/USD
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
            style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}
          />
          <span
            className="text-[10px] text-gray-400 font-mono"
            style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}
          >
            Spread: ${spread.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Column Headers */}
      <div
        className="grid grid-cols-3 text-[10px] uppercase font-mono text-gray-500 pb-1.5 border-b border-white/5 mb-1"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#6B7280',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '4px',
        }}
      >
        <span>Price (USD)</span>
        <span className="text-right" style={{ textAlign: 'right' }}>Size (BTC)</span>
        <span className="text-right" style={{ textAlign: 'right' }}>Total (USD)</span>
      </div>

      {/* Asks (Sell Orders - Rose) */}
      <div className="flex flex-col gap-0.5" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {asks.map((ask, i) => (
          <div
            key={`ask-${i}`}
            className="relative grid grid-cols-3 text-xs font-mono py-0.5 px-1 rounded overflow-hidden transition-all duration-300"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 4px',
              position: 'relative',
            }}
          >
            {/* Depth bar indicator */}
            <div
              className="absolute right-0 top-0 bottom-0 pointer-events-none transition-all duration-500"
              style={{
                width: `${ask.depthPercent}%`,
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                borderRadius: '2px',
              }}
            />
            <span className="text-rose-400 tabular-nums font-semibold relative z-10" style={{ color: '#F43F5E' }}>
              ${ask.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-gray-300 tabular-nums text-right relative z-10" style={{ textAlign: 'right', color: '#D1D5DB' }}>
              {ask.size.toFixed(3)}
            </span>
            <span className="text-gray-500 tabular-nums text-right relative z-10" style={{ textAlign: 'right', color: '#6B7280' }}>
              ${(ask.price * ask.size / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>

      {/* Mid Market Price Banner */}
      <div
        className="my-1.5 py-1.5 px-2.5 rounded-lg bg-[#161B22] border border-white/5 flex items-center justify-between"
        style={{
          margin: '6px 0',
          padding: '6px 10px',
          borderRadius: '8px',
          backgroundColor: '#161B22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={`font-mono text-sm font-bold tabular-nums transition-colors duration-500 ${
              flash === 'up' || lastTickDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'
            }`}
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 700,
              color: flash === 'down' ? '#F43F5E' : '#10B981',
            }}
          >
            {price(currentPrice)}
          </span>
          <span
            style={{
              color: lastTickDirection === 'up' ? '#10B981' : '#F43F5E',
              display: 'inline-flex',
            }}
          >
            <Icon name={lastTickDirection === 'up' ? 'up' : 'down'} size={14} />
          </span>
        </div>
        <span
          className="text-[10px] font-mono text-gray-400 uppercase tracking-wider"
          style={{ fontSize: '10px', fontFamily: 'monospace', color: '#9CA3AF' }}
        >
          Mid-Market
        </span>
      </div>

      {/* Bids (Buy Orders - Emerald) */}
      <div className="flex flex-col gap-0.5" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {bids.map((bid, i) => (
          <div
            key={`bid-${i}`}
            className="relative grid grid-cols-3 text-xs font-mono py-0.5 px-1 rounded overflow-hidden transition-all duration-300"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 4px',
              position: 'relative',
            }}
          >
            {/* Depth bar indicator */}
            <div
              className="absolute right-0 top-0 bottom-0 pointer-events-none transition-all duration-500"
              style={{
                width: `${bid.depthPercent}%`,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderRadius: '2px',
              }}
            />
            <span className="text-emerald-400 tabular-nums font-semibold relative z-10" style={{ color: '#10B981' }}>
              ${bid.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-gray-300 tabular-nums text-right relative z-10" style={{ textAlign: 'right', color: '#D1D5DB' }}>
              {bid.size.toFixed(3)}
            </span>
            <span className="text-gray-500 tabular-nums text-right relative z-10" style={{ textAlign: 'right', color: '#6B7280' }}>
              ${(bid.price * bid.size / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
