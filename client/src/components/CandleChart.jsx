import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, ColorType, CrosshairMode } from 'lightweight-charts';
import api from '../services/api';
import { subscribeToCandles } from '../services/socket';
import { price } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import Icon from './ui/Icon';

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '1D', value: '1D' },
];

export default function CandleChart({ coin, height = 340, showHeader = true }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [timeframe, setTimeframe] = useState('1m');
  const [loading, setLoading] = useState(true);
  const [activeOhlc, setActiveOhlc] = useState(null);
  const [liveCandle, setLiveCandle] = useState(null);

  const coinId = coin?.id || (typeof coin === 'string' ? coin : 'bitcoin');
  const symbol = coin?.symbol || 'BTC';

  // Fetch historical candlestick records
  const loadCandles = useCallback(async (tf) => {
    setLoading(true);
    try {
      const data = await api.getCoinCandles(coinId, { interval: tf, limit: 45 });
      if (Array.isArray(data) && data.length > 0 && seriesRef.current && chartRef.current) {
        // Sanitize & sort unique timestamps ascending
        const seen = new Set();
        const clean = [];
        for (const item of data) {
          if (item?.time && !seen.has(item.time)) {
            seen.add(item.time);
            clean.push({
              time: item.time,
              open: Number(item.open),
              high: Number(item.high),
              low: Number(item.low),
              close: Number(item.close),
            });
          }
        }
        clean.sort((a, b) => a.time - b.time);

        seriesRef.current.setData(clean);
        chartRef.current.priceScale('right').applyOptions({
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        });
        chartRef.current.timeScale().applyOptions({
          barSpacing: 14,
          minBarSpacing: 8,
          rightOffset: 6,
          fixLeftEdge: false,
        });

        if (clean.length > 0) {
          const last = clean[clean.length - 1];
          setActiveOhlc(last);
          setLiveCandle(last);
        }
      }
    } catch (err) {
      console.warn('[CandleChart] Failed to load historical candles:', err.message);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  // Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container contents
    containerRef.current.innerHTML = '';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth || 640,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: isLight ? '#FFFFFF' : '#0D1117' },
        textColor: isLight ? '#475569' : '#8B949E',
        fontSize: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 230, 118, 0.4)',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: 'rgba(0, 230, 118, 0.4)',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 14,
        minBarSpacing: 8,
        rightOffset: 6,
        fixLeftEdge: false,
      },
    });

    const seriesOptions = {
      upColor: '#00E676',
      downColor: '#FF5252',
      borderVisible: true,
      borderUpColor: '#00E676',
      borderDownColor: '#FF5252',
      wickVisible: true,
      wickUpColor: '#00E676',
      wickDownColor: '#FF5252',
    };

    const candlestickSeries = chart.addSeries
      ? chart.addSeries(CandlestickSeries, seriesOptions)
      : chart.addCandlestickSeries(seriesOptions);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Update OHLC readout on crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setActiveOhlc(liveCandle);
        return;
      }
      const data = param.seriesData.get(candlestickSeries);
      if (data) {
        setActiveOhlc(data);
      }
    });

    // Auto-resize with container
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0 && chartRef.current) {
          chartRef.current.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial load
    loadCandles(timeframe);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [coinId, height]); // Re-create if coinId or height changes

  // Dynamically adapt chart background, grid, and text colors when theme changes
  useEffect(() => {
    if (!chartRef.current) return;
    const isLightMode = theme === 'light';
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isLightMode ? '#FFFFFF' : '#0D1117' },
        textColor: isLightMode ? '#475569' : '#8B949E',
      },
      grid: {
        vertLines: { color: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderColor: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      },
      timeScale: {
        borderColor: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      },
    });
  }, [theme]);

  // Fetch new candles when timeframe changes
  useEffect(() => {
    if (seriesRef.current && chartRef.current) {
      loadCandles(timeframe);
    }
  }, [timeframe, loadCandles]);

  // Subscribe to real-time live candlestick updates from Socket.io
  useEffect(() => {
    const unsubscribe = subscribeToCandles((payload) => {
      if (!payload || !payload.candle || !seriesRef.current) return;

      const isMatch =
        payload.coinId === coinId ||
        payload.symbol?.toUpperCase() === symbol.toUpperCase() ||
        (!payload.coinId && symbol === 'BTC');

      if (isMatch) {
        const c = payload.candle;
        const updatedBar = {
          time: Number(c.time),
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        };

        try {
          seriesRef.current.update(updatedBar);
          setLiveCandle(updatedBar);
          setActiveOhlc((prev) => {
            // If crosshair is not active, keep live candle in OHLC readout
            if (!prev || prev.time === updatedBar.time) {
              return updatedBar;
            }
            return prev;
          });
        } catch (err) {
          // If a new timestamp is out of order, re-sync series
          console.warn('[CandleChart] Handled candle update order:', err.message);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [coinId, symbol]);

  const displayBar = activeOhlc || liveCandle;
  const isUp = displayBar ? displayBar.close >= displayBar.open : true;

  return (
    <div className="candle-chart-wrapper">
      {showHeader && (
        <div className="candle-chart-header flex items-center justify-between flex-wrap gap-2 py-1.5 px-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Exchange Feed
            </span>
            {displayBar && (
              <div className="text-xs font-mono text-slate-600 dark:text-gray-400 flex items-center gap-3 tabular-nums">
                <span>O: <strong className="text-slate-900 dark:text-white tabular-nums">{price(displayBar.open)}</strong></span>
                <span>H: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{price(displayBar.high)}</strong></span>
                <span>L: <strong className="text-rose-600 dark:text-rose-400 tabular-nums">{price(displayBar.low)}</strong></span>
                <span>C: <strong className={isUp ? 'text-emerald-600 dark:text-emerald-400 tabular-nums' : 'text-rose-600 dark:text-rose-400 tabular-nums'}>{price(displayBar.close)}</strong></span>
              </div>
            )}
          </div>

          <div className="candle-timeframe-selector p-0.5 gap-1" role="group" aria-label="Candlestick timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`tf-button py-1 px-2 text-[11px] ${timeframe === tf.value ? 'selected' : ''}`}
                aria-pressed={timeframe === tf.value}
                disabled={loading && timeframe === tf.value}
              >
                {tf.label}
              </button>
            ))}
            <button
              onClick={() => chartRef.current?.timeScale().fitContent()}
              className="tf-button tf-fit py-1 px-2 text-[11px]"
              title="Fit chart content"
              aria-label="Fit timeframe"
            >
              <Icon name="search" size={11} />
              Fit
            </button>
          </div>
        </div>
      )}

      <div className="candle-chart-canvas-container tv-chart-container relative overflow-hidden" style={{ position: 'relative' }}>
        {loading && (
          <div className="candle-chart-loader">
            <div className="loading-spinner" />
            <span>Streaming {timeframe} candlestick bars…</span>
          </div>
        )}
        <div
          ref={containerRef}
          id="tv-chart-container"
          className="tv-chart-container candle-chart-viewport relative w-full overflow-hidden"
          style={{ width: '100%', height }}
        />
      </div>
    </div>
  );
}
