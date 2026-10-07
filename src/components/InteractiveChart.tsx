import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Candle, MarketInstrument, Timeframe, TradeSignal } from '../types/market';
import { formatPrice } from '../utils/technicalIndicators';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface InteractiveChartProps {
  candles: Candle[];
  market: MarketInstrument;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  signal: TradeSignal;
  language: 'kn' | 'en';
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles,
  market,
  timeframe,
  onTimeframeChange,
  signal,
  language
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(45);
  const [showIndicators, setShowIndicators] = useState({
    ema: true,
    vwap: true,
    levels: true
  });

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Layout configuration
    const paddingRight = 75;
    const paddingBottom = 32;
    const paddingTop = 20;
    const chartWidth = width - paddingRight;
    const totalHeight = height - paddingBottom - paddingTop;
    
    // Split height: 75% for main price chart, 25% for volume
    const priceChartHeight = totalHeight * 0.74;
    const volumeChartTop = paddingTop + priceChartHeight + 10;
    const volumeChartHeight = totalHeight * 0.22;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Visible slice
    const sliceCount = Math.min(visibleCount, candles.length);
    const visibleData = candles.slice(-sliceCount);
    if (visibleData.length === 0) return;

    // Min / Max price calculation
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (const c of visibleData) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (showIndicators.ema) {
        if (c.ema9 && c.ema9 < minPrice) minPrice = c.ema9;
        if (c.ema9 && c.ema9 > maxPrice) maxPrice = c.ema9;
        if (c.ema21 && c.ema21 < minPrice) minPrice = c.ema21;
        if (c.ema21 && c.ema21 > maxPrice) maxPrice = c.ema21;
      }
      if (showIndicators.vwap && c.vwap) {
        if (c.vwap < minPrice) minPrice = c.vwap;
        if (c.vwap > maxPrice) maxPrice = c.vwap;
      }
      if (c.volume > maxVol) maxVol = c.volume;
    }

    // Include Signal targets & SL in bounds if levels enabled
    if (showIndicators.levels && signal) {
      if (signal.stopLoss && signal.stopLoss < minPrice) minPrice = signal.stopLoss;
      if (signal.target1 && signal.target1 > maxPrice) maxPrice = signal.target1;
    }

    // Add breathing room
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    const finalPriceRange = maxPrice - minPrice;

    // Scale helpers
    const getX = (index: number) => {
      const candleWidth = chartWidth / visibleData.length;
      return index * candleWidth + candleWidth / 2;
    };

    const getY = (price: number) => {
      return paddingTop + (1 - (price - minPrice) / finalPriceRange) * priceChartHeight;
    };

    // Draw horizontal grid lines & Price Axis
    const gridSteps = 6;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '11px monospace';
    ctx.fillStyle = '#64748b';

    for (let i = 0; i <= gridSteps; i++) {
      const y = paddingTop + (i / gridSteps) * priceChartHeight;
      const priceVal = maxPrice - (i / gridSteps) * finalPriceRange;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price labels on right margin
      ctx.fillText(formatPrice(priceVal, market.decimals), chartWidth + 6, y + 4);
    }

    // Draw vertical time grid lines
    const timeStep = Math.max(1, Math.floor(visibleData.length / 6));
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < visibleData.length; i += timeStep) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      ctx.fillText(visibleData[i].timeStr, x - 18, height - 10);
    }

    // Draw Volume Bars
    const candleWidth = (chartWidth / visibleData.length) * 0.72;
    for (let i = 0; i < visibleData.length; i++) {
      const c = visibleData[i];
      const x = getX(i);
      const isUp = c.close >= c.open;
      const volHeight = maxVol > 0 ? (c.volume / maxVol) * volumeChartHeight : 0;
      const volY = volumeChartTop + volumeChartHeight - volHeight;

      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
      ctx.fillRect(x - candleWidth / 2, volY, candleWidth, volHeight);
    }

    // Draw Indicator Lines (EMA 9, EMA 21, VWAP)
    if (showIndicators.ema) {
      // EMA 9 (Amber)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleData.length; i++) {
        if (visibleData[i].ema9) {
          const x = getX(i);
          const y = getY(visibleData[i].ema9!);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // EMA 21 (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < visibleData.length; i++) {
        if (visibleData[i].ema21) {
          const x = getX(i);
          const y = getY(visibleData[i].ema21!);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    if (showIndicators.vwap) {
      // VWAP (Orange dashed)
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleData.length; i++) {
        if (visibleData[i].vwap) {
          const x = getX(i);
          const y = getY(visibleData[i].vwap!);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]); // reset
    }

    // Draw Signal Lines (Entry, Stop Loss, Target 1, Target 2)
    if (showIndicators.levels && signal && signal.action !== 'WAIT') {
      const drawLevel = (price: number, label: string, color: string, isDashed = true) => {
        const y = getY(price);
        if (y < paddingTop || y > paddingTop + priceChartHeight) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        if (isDashed) ctx.setLineDash([5, 3]);
        else ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label tag badge on price axis
        ctx.fillStyle = color;
        ctx.fillRect(chartWidth + 2, y - 9, paddingRight - 4, 18);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(label, chartWidth + 5, y + 4);
      };

      const isBearish = signal.action === 'SELL' || signal.direction === 'DOWNSIDE' || signal.particularEntry === 'PUT_PE';

      if (isBearish) {
        drawLevel(signal.entryPrice, '🔴 PUT ENTRY', '#ef4444', false);
        drawLevel(signal.stopLoss, 'SL (PUT)', '#f87171', true);
        drawLevel(signal.target1, 'PUT T1', '#10b981', true);
        if (signal.target2) drawLevel(signal.target2, 'PUT T2', '#059669', true);
      } else {
        drawLevel(signal.entryPrice, '🟢 CALL ENTRY', '#3b82f6', false);
        drawLevel(signal.stopLoss, 'SL (CALL)', '#ef4444', true);
        drawLevel(signal.target1, 'CALL T1', '#10b981', true);
        if (signal.target2) drawLevel(signal.target2, 'CALL T2', '#059669', true);
      }
    }

    // Draw Candlesticks (Wicks and Bodies)
    for (let i = 0; i < visibleData.length; i++) {
      const c = visibleData[i];
      const x = getX(i);
      const isUp = c.close >= c.open;
      const candleColor = isUp ? '#10b981' : '#ef4444';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const topY = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1.5);
      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyH);
    }

    // Draw Crosshair & Hover Tooltip
    if (crosshairPos && crosshairPos.x <= chartWidth && crosshairPos.y <= height - paddingBottom) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshairPos.x, paddingTop);
      ctx.lineTo(crosshairPos.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshairPos.y);
      ctx.lineTo(chartWidth, crosshairPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price tag on cursor
      const cursorPrice = maxPrice - ((crosshairPos.y - paddingTop) / priceChartHeight) * finalPriceRange;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(chartWidth + 2, crosshairPos.y - 9, paddingRight - 4, 18);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(formatPrice(cursorPrice, market.decimals), chartWidth + 5, crosshairPos.y + 4);
    }
  }, [candles, visibleCount, market, showIndicators, signal, crosshairPos]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  // Handle Mouse movement for interactive crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCrosshairPos({ x, y });

    const chartWidth = rect.width - 75;
    const sliceCount = Math.min(visibleCount, candles.length);
    const visibleData = candles.slice(-sliceCount);
    const index = Math.floor((x / chartWidth) * visibleData.length);

    if (index >= 0 && index < visibleData.length) {
      setHoveredCandle(visibleData[index]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
    setHoveredCandle(null);
  };

  const latestCandle = candles[candles.length - 1];
  const activeCandle = hoveredCandle || latestCandle;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
      {/* Top Chart Toolbar */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <span className="text-[11px] font-medium text-slate-400 px-2">
            {language === 'kn' ? 'ಟೈಮ್‌ಫ್ರೇಮ್:' : 'TF:'}
          </span>
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowIndicators(p => ({ ...p, ema: !p.ema }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showIndicators.ema 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            EMA 9/21
          </button>

          <button
            onClick={() => setShowIndicators(p => ({ ...p, vwap: !p.vwap }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showIndicators.vwap 
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            VWAP
          </button>

          <button
            onClick={() => setShowIndicators(p => ({ ...p, levels: !p.levels }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showIndicators.levels 
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {showIndicators.levels ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            {language === 'kn' ? 'ಸಿಗ್ನಲ್ ಹಂತಗಳು (SL/Target)' : 'Trade Levels'}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setVisibleCount(c => Math.max(20, c - 10))}
              title="Zoom In"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVisibleCount(c => Math.min(100, c + 10))}
              title="Zoom Out"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVisibleCount(45)}
              title="Reset View"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candlestick OHLC Header Bar */}
      {activeCandle && (
        <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">
            {language === 'kn' ? 'ಸಮಯ' : 'Time'}: <span className="text-slate-200">{activeCandle.timeStr}</span>
          </span>
          <span className="text-slate-400">
            O: <span className="text-slate-200">{formatPrice(activeCandle.open, market.decimals)}</span>
          </span>
          <span className="text-slate-400">
            H: <span className="text-emerald-400">{formatPrice(activeCandle.high, market.decimals)}</span>
          </span>
          <span className="text-slate-400">
            L: <span className="text-red-400">{formatPrice(activeCandle.low, market.decimals)}</span>
          </span>
          <span className="text-slate-400">
            C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-red-400'}>
              {formatPrice(activeCandle.close, market.decimals)}
            </span>
          </span>
          <span className="text-slate-400">
            Vol: <span className="text-slate-300">{activeCandle.volume.toLocaleString()}</span>
          </span>
          {activeCandle.rsi && (
            <span className="text-slate-400">
              RSI(14): <span className={activeCandle.rsi >= 55 ? 'text-emerald-400' : activeCandle.rsi <= 45 ? 'text-red-400' : 'text-slate-300'}>{activeCandle.rsi}</span>
            </span>
          )}
          {activeCandle.vwap && (
            <span className="text-slate-400">
              VWAP: <span className="text-orange-400">{formatPrice(activeCandle.vwap, market.decimals)}</span>
            </span>
          )}
        </div>
      )}

      {/* Canvas Area */}
      <div ref={containerRef} className="relative w-full h-[410px] bg-[#0b0f19]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur border border-slate-800 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#f59e0b]"></span>
            <span>EMA 9</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#06b6d4]"></span>
            <span>EMA 21</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#f97316]"></span>
            <span>VWAP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500"></span>
            <span>{language === 'kn' ? 'ವಾಲ್ಯೂಮ್' : 'Volume'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
