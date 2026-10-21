import React, { useState, useMemo } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { coins as fallbackCoins } from '../../data/coins';

export default function QuickConverter() {
  const [amount, setAmount] = useState(1);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const { coins: liveCoins } = useMarketData();

  const coins = useMemo(() => {
    return Array.isArray(liveCoins) && liveCoins.length > 0
      ? liveCoins
      : Array.isArray(fallbackCoins)
        ? fallbackCoins
        : [];
  }, [liveCoins]);

  const selectedCoin = useMemo(() => {
    return (
      coins.find((c) => c?.symbol?.toUpperCase() === selectedSymbol.toUpperCase()) ||
      coins[0] || { price: 84645.99, symbol: 'BTC', name: 'Bitcoin' }
    );
  }, [coins, selectedSymbol]);

  const numAmount = parseFloat(amount) || 0;
  const rawTotal = numAmount * (selectedCoin.price || 0);

  const convertedValue = rawTotal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: rawTotal < 1 ? 4 : 2,
  });

  return (
    <div className="bg-white dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 shadow-[6px_6px_16px_rgba(163,177,198,0.25),-6px_-6px_16px_rgba(255,255,255,0.9)] dark:shadow-none text-slate-900 dark:text-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase tracking-wider">Quick Converter</span>
        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Live Spot</span>
      </div>

      <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-[#161B22] border border-slate-200/90 dark:border-white/5 rounded-xl p-2.5">
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full bg-transparent text-slate-900 dark:text-white font-mono text-sm outline-none tabular-nums"
          placeholder="1.0"
        />
        <select 
          value={selectedSymbol} 
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="bg-white dark:bg-[#0D1117] text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-white/10 outline-none cursor-pointer"
        >
          {coins.map((c) => (
            <option key={c.symbol} value={c.symbol.toUpperCase()}>{c.symbol.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-xs text-slate-500 dark:text-gray-400">Equivalent</span>
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
          ≈ ${convertedValue} USD
        </span>
      </div>
    </div>
  );
}
