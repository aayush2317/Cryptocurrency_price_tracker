import React, { useMemo } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import Icon from '../ui/Icon';

export default function MarketSentiment() {
  const { marketStats } = useMarketData();

  const fearGreedScore = 74; // Bullish / Greed zone
  const longRatio = 56.4;
  const shortRatio = (100 - longRatio).toFixed(1);

  return (
    <div
      className="market-sentiment-card bg-[#0D1117] border border-white/5 rounded-2xl p-4 shadow-lg"
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
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <Icon name="activity" size={14} />
          </div>
          <div>
            <h3
              className="text-xs font-semibold text-white tracking-wide"
              style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}
            >
              Market Sentiment
            </h3>
            <span
              className="text-[10px] text-gray-400 font-mono"
              style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}
            >
              Fear &amp; Greed · 24h Signals
            </span>
          </div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontFamily: 'monospace',
          }}
        >
          Greed · {fearGreedScore}
        </span>
      </div>

      {/* Fear & Greed Visual Meter */}
      <div
        className="bg-[#161B22] border border-white/5 rounded-xl p-3 mb-3"
        style={{
          backgroundColor: '#161B22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          className="flex items-center justify-between text-xs mb-1.5"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}
        >
          <span className="text-gray-400 font-medium">Fear &amp; Greed Index</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums">
            {fearGreedScore} / 100
          </span>
        </div>
        {/* Progress Bar with multi-stop gradient */}
        <div
          className="w-full h-2 rounded-full overflow-hidden relative"
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '9999px',
            background: 'linear-gradient(90deg, #F43F5E 0%, #F59E0B 50%, #10B981 100%)',
          }}
        >
          <div
            className="absolute top-0 bottom-0 bg-white shadow-sm"
            style={{
              left: `${fearGreedScore}%`,
              width: '3px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        <div
          className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1.5"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#6B7280', fontFamily: 'monospace', marginTop: '6px' }}
        >
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span className="text-emerald-400 font-semibold">Greed (74)</span>
        </div>
      </div>

      {/* Long / Short Ratio */}
      <div
        className="bg-[#161B22] border border-white/5 rounded-xl p-3 mb-3"
        style={{
          backgroundColor: '#161B22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          className="flex items-center justify-between text-xs mb-1.5"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}
        >
          <span className="text-gray-400 font-medium">Exchange Long / Short Ratio</span>
          <span className="font-mono text-xs tabular-nums text-gray-300">
            <span className="text-emerald-400 font-bold">{longRatio}%</span> / <span className="text-rose-400 font-bold">{shortRatio}%</span>
          </span>
        </div>
        {/* Dual ratio bar */}
        <div
          className="w-full h-2 rounded-full overflow-hidden flex"
          style={{ width: '100%', height: '8px', borderRadius: '9999px', display: 'flex', overflow: 'hidden' }}
        >
          <div style={{ width: `${longRatio}%`, backgroundColor: '#10B981' }} />
          <div style={{ width: `${shortRatio}%`, backgroundColor: '#F43F5E' }} />
        </div>
        <div
          className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1.5"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#6B7280', fontFamily: 'monospace', marginTop: '6px' }}
        >
          <span className="text-emerald-400">Longs (Bullish)</span>
          <span className="text-rose-400">Shorts (Bearish)</span>
        </div>
      </div>

      {/* Institutional Flow Statistics Grid */}
      <div
        className="grid grid-cols-2 gap-2 text-xs"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', fontSize: '12px' }}
      >
        <div
          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
          style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono" style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace' }}>
            24h Buy Pressure
          </span>
          <span className="font-mono font-bold text-white text-sm tabular-nums mt-0.5 block" style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace' }}>
            62.8%
          </span>
          <span className="text-[10px] text-emerald-400 font-mono" style={{ fontSize: '10px', color: '#10B981' }}>
            +4.2% vs yesterday
          </span>
        </div>
        <div
          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
          style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono" style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace' }}>
            Total 24h Liquidations
          </span>
          <span className="font-mono font-bold text-rose-400 text-sm tabular-nums mt-0.5 block" style={{ fontSize: '14px', fontWeight: 700, color: '#F43F5E', fontFamily: 'monospace' }}>
            $142.8M
          </span>
          <span className="text-[10px] text-gray-400 font-mono" style={{ fontSize: '10px', color: '#9CA3AF' }}>
            Shorts rekt: 71.4%
          </span>
        </div>
      </div>
    </div>
  );
}
