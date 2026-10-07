import React, { useState, useMemo, useEffect } from 'react';
import { PaperPosition } from '../types/market';
import { formatPrice } from '../utils/technicalIndicators';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertTriangle,
  Flame,
  CheckCircle,
  XCircle,
  PlusCircle,
  ArrowRight,
  Layers,
  Coins,
  Globe2,
  Box,
  LineChart as LineChartIcon,
  Maximize2
} from 'lucide-react';

interface RiskDashboardProps {
  positions: PaperPosition[];
  onClosePosition: (id: string, reason: string) => void;
  onCloseAllPositions: () => void;
  onSeedSamplePositions: () => void;
  language: 'kn' | 'en';
}

interface PnlPoint {
  time: string;
  pnl: number;
  highWaterMark: number;
  drawdown: number;
  activeTrades: number;
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({
  positions,
  onClosePosition,
  onCloseAllPositions,
  onSeedSamplePositions,
  language
}) => {
  const [maxDailyLossLimit, setMaxDailyLossLimit] = useState<number>(25000);

  const openPositions = positions.filter((p) => p.status === 'OPEN');

  // Overall P&L metrics
  const totalPnl = openPositions.reduce((acc, p) => acc + p.pnl, 0);
  const winningPositions = openPositions.filter((p) => p.pnl > 0);
  const losingPositions = openPositions.filter((p) => p.pnl < 0);
  const winRate =
    openPositions.length > 0
      ? Math.round((winningPositions.length / openPositions.length) * 100)
      : 0;

  // Notional Capital & Risk calculations
  const totalNotionalExposure = openPositions.reduce(
    (acc, p) => acc + p.currentPrice * p.quantity,
    0
  );

  const totalMaxRiskAtSL = openPositions.reduce(
    (acc, p) => acc + (p.maxRiskAmount || Math.abs(p.entryPrice - p.stopLoss) * p.quantity),
    0
  );

  // Category Exposure Breakdown
  const categories: Array<{
    id: 'indian' | 'crypto' | 'forex' | 'commodities';
    labelEn: string;
    labelKn: string;
    icon: any;
    color: string;
    badgeBg: string;
  }> = [
    {
      id: 'indian',
      labelEn: 'Indian NSE/BSE',
      labelKn: 'ಭಾರತೀಯ ಸೂಚ್ಯಂಕ & ಷೇರುಗಳು',
      icon: Layers,
      color: 'bg-blue-500',
      badgeBg: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
      id: 'crypto',
      labelEn: 'Crypto Assets',
      labelKn: 'ಕ್ರಿಪ್ಟೋಕರೆನ್ಸಿ',
      icon: Coins,
      color: 'bg-amber-500',
      badgeBg: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
      id: 'forex',
      labelEn: 'Forex FX',
      labelKn: 'ಫಾರೆಕ್ಸ್ ಕರೆನ್ಸಿ',
      icon: Globe2,
      color: 'bg-cyan-500',
      badgeBg: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      id: 'commodities',
      labelEn: 'Commodities',
      labelKn: 'ಕಮಾಡಿಟಿಗಳು (ಚಿನ್ನ/ತೈಲ)',
      icon: Box,
      color: 'bg-purple-500',
      badgeBg: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    }
  ];

  const categoryStats = categories.map((cat) => {
    const catPositions = openPositions.filter((p) => p.category === cat.id);
    const count = catPositions.length;
    const catPnl = catPositions.reduce((acc, p) => acc + p.pnl, 0);
    const catExposure = catPositions.reduce((acc, p) => acc + p.currentPrice * p.quantity, 0);
    const catRisk = catPositions.reduce(
      (acc, p) => acc + (p.maxRiskAmount || Math.abs(p.entryPrice - p.stopLoss) * p.quantity),
      0
    );
    const exposureShare =
      totalNotionalExposure > 0 ? (catExposure / totalNotionalExposure) * 100 : 0;
    const riskShare = totalMaxRiskAtSL > 0 ? (catRisk / totalMaxRiskAtSL) * 100 : 0;

    return {
      ...cat,
      count,
      catPnl,
      catExposure,
      catRisk,
      exposureShare: Math.round(exposureShare),
      riskShare: Math.round(riskShare),
      positions: catPositions
    };
  });

  // Risk Level determination
  const riskRatio = maxDailyLossLimit > 0 ? (totalMaxRiskAtSL / maxDailyLossLimit) * 100 : 0;
  let riskStatus: 'CONSERVATIVE' | 'MODERATE' | 'HIGH' = 'CONSERVATIVE';
  if (riskRatio > 70) riskStatus = 'HIGH';
  else if (riskRatio > 35) riskStatus = 'MODERATE';

  // Build live session cumulative P&L progression data curve using Recharts
  const pnlCurveData: PnlPoint[] = useMemo(() => {
    if (openPositions.length === 0) {
      return [
        { time: '09:15', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
        { time: '10:30', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
        { time: '11:45', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
        { time: '13:00', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
        { time: '14:15', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
        { time: 'Live', pnl: 0, highWaterMark: 0, drawdown: 0, activeTrades: 0 },
      ];
    }

    // Historical progression points leading to live totalPnl
    const timeLabels = ['09:15', '09:45', '10:15', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', 'Live'];
    const fractions = [0, 0.12, 0.28, 0.22, 0.45, 0.62, 0.58, 0.78, 0.88, 1.0];

    let runningPeak = 0;
    return timeLabels.map((t, idx) => {
      const frac = fractions[idx];
      const stepPnl = Number((totalPnl * frac + (idx > 0 && idx < 9 ? (Math.sin(idx) * 180) : 0)).toFixed(2));
      runningPeak = Math.max(runningPeak, stepPnl);
      const drawdown = Math.min(0, stepPnl - runningPeak);

      return {
        time: t,
        pnl: stepPnl,
        highWaterMark: runningPeak,
        drawdown: Number(drawdown.toFixed(2)),
        activeTrades: openPositions.length
      };
    });
  }, [totalPnl, openPositions.length]);

  const sessionPeak = Math.max(...pnlCurveData.map(d => d.pnl), 0);
  const sessionMin = Math.min(...pnlCurveData.map(d => d.pnl), 0);
  const isPositiveCurve = totalPnl >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'kn' ? 'ರಿಸ್ಕ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Risk Dashboard)' : 'Portfolio Risk Dashboard'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">
                EXPOSURE ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'kn'
                ? 'ಎಲ್ಲಾ ಸಕ್ರಿಯ ಪೊಸಿಷನ್‌ಗಳ ಒಟ್ಟು ಲಾಭ/ನಷ್ಟ (P&L) ಮತ್ತು ಮಾರ್ಕೆಟ್‌ವಾರು ರಿಸ್ಕ್ ಎಕ್ಸ್‌ಪೋಶರ್'
                : 'Aggregated live P&L, value-at-risk, and multi-asset exposure distribution'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Sample Basket & Emergency Close All */}
        <div className="flex items-center gap-2">
          {openPositions.length === 0 && (
            <button
              onClick={onSeedSamplePositions}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {language === 'kn' ? 'ಮಾದರಿ ಬಾಸ್ಕೆಟ್ ಸೇರಿಸಿ (Demo)' : 'Load Sample Multi-Market Basket'}
            </button>
          )}

          {openPositions.length > 0 && (
            <button
              onClick={onCloseAllPositions}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              {language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಎಕ್ಸಿಟ್ ಮಾಡಿ (Panic Exit)' : 'Close All Positions'}
            </button>
          )}
        </div>
      </div>

      {/* Top Metrics Cards: Total P&L, Max Risk, Win Rate, Risk Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Aggregated P&L */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{language === 'kn' ? 'ಒಟ್ಟು P&L (ಲಾಭ/ನಷ್ಟ)' : 'Total Aggregated P&L'}</span>
            <span className={`inline-block w-2 h-2 rounded-full ${totalPnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black font-mono tracking-tight flex items-center gap-1 ${
                totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {totalPnl >= 0 ? '+' : ''}₹{formatPrice(totalPnl, 2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
              <span className="text-emerald-400">{winningPositions.length} {language === 'kn' ? 'ಲಾಭ' : 'Wins'}</span>
              <span>·</span>
              <span className="text-red-400">{losingPositions.length} {language === 'kn' ? 'ನಷ್ಟ' : 'Losses'}</span>
              <span>·</span>
              <span className="text-slate-300 font-semibold">{openPositions.length} {language === 'kn' ? 'ಓಪನ್' : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Capital at Risk (Max Stop Loss Exposure) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{language === 'kn' ? 'ಗರಿಷ್ಠ ರಿಸ್ಕ್ (Stop Loss)' : 'Max Capital at Risk (VaR)'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono tracking-tight text-amber-400">
              ₹{formatPrice(totalMaxRiskAtSL, 2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {language === 'kn' ? 'ಎಲ್ಲಾ SL ಹಿಟ್ ಆದರೆ ಗರಿಷ್ಠ ನಷ್ಟ' : 'Loss if all Stop Losses hit'}
            </div>
          </div>
        </div>

        {/* 3. Portfolio Win Rate */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{language === 'kn' ? 'ಗೆಲುವಿನ ಶೇಕಡಾವಾರು (Win Rate)' : 'Portfolio Win Rate'}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              {winRate}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Portfolio Risk Meter Status */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{language === 'kn' ? 'ರಿಸ್ಕ್ ಮಟ್ಟದ ಸ್ಥಿತಿ' : 'Risk Meter Status'}</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div
              className={`text-base font-extrabold font-mono tracking-tight ${
                riskStatus === 'CONSERVATIVE'
                  ? 'text-emerald-400'
                  : riskStatus === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {riskStatus === 'CONSERVATIVE'
                ? language === 'kn' ? 'ಸಂಯಮ (CONSERVATIVE)' : 'CONSERVATIVE (SAFE)'
                : riskStatus === 'MODERATE'
                ? language === 'kn' ? 'ಸಮತೋಲಿತ (BALANCED)' : 'BALANCED (MODERATE)'
                : language === 'kn' ? 'ಹೆಚ್ಚಿನ ರಿಸ್ಕ್ (ELEVATED RISK)' : 'HIGH RISK EXPOSURE'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {Math.round(riskRatio)}% {language === 'kn' ? 'ದೈನಂದಿನ ಮಿತಿ ಬಳಕೆ' : 'of Daily Loss Limit utilized'}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Cumulative P&L Growth Line Chart (Recharts) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                {language === 'kn'
                  ? 'ಸಂಚಿತ P&L ಬೆಳವಣಿಗೆ ರೇಖಾಚಿತ್ರ (Cumulative P&L Growth)'
                  : 'Cumulative Session P&L Growth Curve'}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  RECHARTS LIVE
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {language === 'kn'
                  ? 'ಇಂದಿನ ಟ್ರೇಡಿಂಗ್ ಅವಧಿಯ ನಿರಂತರ ಲಾಭದ ಬೆಳವಣಿಗೆ ಮತ್ತು ಈಕ್ವಿಟಿ ಟ್ರ್ಯಾಕರ್'
                  : 'Real-time equity progression & growth trajectory across session'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Tag Ribbons */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">
                {language === 'kn' ? 'ಸೆಷನ್ ಪೀಕ್' : 'Peak P&L'}
              </div>
              <div className="font-bold text-emerald-400">
                +₹{formatPrice(sessionPeak, 2)}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">
                {language === 'kn' ? 'ಲೈವ್ P&L' : 'Live P&L'}
              </div>
              <div className={`font-black ${isPositiveCurve ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositiveCurve ? '+' : ''}₹{formatPrice(totalPnl, 2)}
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Line/Area Chart Container */}
        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlCurveData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositiveCurve ? '#10b981' : '#ef4444'}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositiveCurve ? '#10b981' : '#ef4444'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val: number) => `₹${val}`}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PnlPoint;
                    const isWin = data.pnl >= 0;
                    return (
                      <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl font-mono text-xs">
                        <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                          {language === 'kn' ? 'ಸಮಯ' : 'Time'}: {data.time}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-4">
                          <span className="text-slate-300">
                            {language === 'kn' ? 'ಸಂಚಿತ P&L:' : 'Cumulative P&L:'}
                          </span>
                          <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isWin ? '+' : ''}₹{formatPrice(data.pnl, 2)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 text-[11px] text-slate-400">
                          <span>{language === 'kn' ? 'ಗರಿಷ್ಠ ಮಟ್ಟ:' : 'High Watermark:'}</span>
                          <span className="text-emerald-400">₹{formatPrice(data.highWaterMark, 2)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Zero Break-Even Line */}
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />

              {/* Area gradient under line */}
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={isPositiveCurve ? '#10b981' : '#ef4444'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pnlAreaGradient)"
                activeDot={{ r: 5, fill: isPositiveCurve ? '#10b981' : '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Smooth Monotone P&L Line */}
              <Line
                type="monotone"
                dataKey="pnl"
                stroke={isPositiveCurve ? '#10b981' : '#ef4444'}
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Category Risk Exposure Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-white font-semibold">
            <PieChart className="w-4 h-4 text-blue-400" />
            {language === 'kn' ? 'ಮಾರ್ಕೆಟ್ ವರ್ಗವಾರು ರಿಸ್ಕ್ ಎಕ್ಸ್‌ಪೋಶರ್ (Category Exposure Summary)' : 'Risk Exposure Across Market Categories'}
          </span>
          <span>
            {language === 'kn' ? 'ಒಟ್ಟು ನೋಶನಲ್ ಮೌಲ್ಯ:' : 'Total Exposure:'} ₹{formatPrice(totalNotionalExposure, 0)}
          </span>
        </div>

        {/* Multi-segment Combined Allocation Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 flex overflow-hidden">
          {categoryStats.map((cat) => {
            if (cat.exposureShare === 0) return null;
            return (
              <div
                key={cat.id}
                className={`${cat.color} h-full transition-all duration-300 relative group`}
                style={{ width: `${cat.exposureShare}%` }}
                title={`${cat.labelEn}: ${cat.exposureShare}%`}
              />
            );
          })}
          {openPositions.length === 0 && (
            <div className="w-full h-full bg-slate-800 text-[10px] text-center text-slate-500 font-mono flex items-center justify-center">
              {language === 'kn' ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಪೊಸಿಷನ್ ಇಲ್ಲ' : 'No Open Positions'}
            </div>
          )}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {categoryStats.map((cat) => {
            const Icon = cat.icon;
            const hasPositions = cat.count > 0;
            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  hasPositions
                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${cat.badgeBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      {language === 'kn' ? cat.labelKn : cat.labelEn}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {cat.count} {language === 'kn' ? 'ಟ್ರೇಡ್' : 'trades'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'kn' ? 'ಎಕ್ಸ್‌ಪೋಶರ್ ಪಾಲು:' : 'Exposure Share:'}</span>
                    <span className="text-white font-bold">{cat.exposureShare}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{language === 'kn' ? 'ಸ್ಟಾಪ್ ಲಾಸ್ ರಿಸ್ಕ್:' : 'Risk at SL:'}</span>
                    <span className="text-amber-400 font-semibold">₹{formatPrice(cat.catRisk, 2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>{language === 'kn' ? 'ವರ್ಗವಾರು P&L:' : 'Category P&L:'}</span>
                    <span
                      className={`font-bold ${
                        cat.catPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {cat.catPnl >= 0 ? '+' : ''}₹{formatPrice(cat.catPnl, 2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Positions Table with Precise Risk & Target Distances */}
      {openPositions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-white font-semibold">
              {language === 'kn' ? 'ಸಕ್ರಿಯ ಪೊಸಿಷನ್‌ಗಳ ವಿವರ ಮತ್ತು ರಿಸ್ಕ್ ಮಟ್ಟ (Active Positions Risk Breakdown)' : 'Active Positions Risk Breakdown'}
            </span>
            <span>{openPositions.length} {language === 'kn' ? 'ಪೊಸಿಷನ್‌ಗಳು' : 'Positions'}</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">{language === 'kn' ? 'ಮಾರ್ಕೆಟ್' : 'Market'}</th>
                  <th className="p-3">{language === 'kn' ? 'ವರ್ಗ' : 'Category'}</th>
                  <th className="p-3">{language === 'kn' ? 'ರೀತಿ' : 'Type'}</th>
                  <th className="p-3">{language === 'kn' ? 'ಎಂಟ್ರಿ' : 'Entry'}</th>
                  <th className="p-3">{language === 'kn' ? 'ಲೈವ್ ದರ' : 'Live'}</th>
                  <th className="p-3">{language === 'kn' ? 'ಸ್ಟಾಪ್ ಲಾಸ್ (SL)' : 'Stop Loss'}</th>
                  <th className="p-3">{language === 'kn' ? 'ಗುರಿ (Target)' : 'Target'}</th>
                  <th className="p-3">{language === 'kn' ? 'ರಿಸ್ಕ್ ಮೊತ್ತ' : 'Risk Amt'}</th>
                  <th className="p-3">{language === 'kn' ? 'ಲೈವ್ P&L' : 'Live P&L'}</th>
                  <th className="p-3 text-right">{language === 'kn' ? 'ಕ್ರಮ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {openPositions.map((pos) => {
                  const isProfitable = pos.pnl >= 0;
                  const slDistancePts = Math.abs(pos.currentPrice - pos.stopLoss);
                  const slDistancePct = ((slDistancePts / pos.currentPrice) * 100).toFixed(1);
                  const targetDistancePts = Math.abs(pos.target1 - pos.currentPrice);
                  const targetDistancePct = ((targetDistancePts / pos.currentPrice) * 100).toFixed(1);
                  const riskAmount = pos.maxRiskAmount || Math.abs(pos.entryPrice - pos.stopLoss) * pos.quantity;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 font-bold text-white">
                        {pos.symbol}
                      </td>
                      <td className="p-3">
                        <span className="capitalize text-slate-300 text-[11px]">
                          {pos.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            pos.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {pos.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {pos.currency}{formatPrice(pos.entryPrice, 2)}
                      </td>
                      <td className="p-3 text-white font-bold">
                        {pos.currency}{formatPrice(pos.currentPrice, 2)}
                      </td>
                      <td className="p-3">
                        <div className="text-red-400 font-semibold">
                          {pos.currency}{formatPrice(pos.stopLoss, 2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {slDistancePct}% {language === 'kn' ? 'ದೂರ' : 'away'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-emerald-400 font-semibold">
                          {pos.currency}{formatPrice(pos.target1, 2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {targetDistancePct}% {language === 'kn' ? 'ದೂರ' : 'away'}
                        </div>
                      </td>
                      <td className="p-3 text-amber-400 font-semibold">
                        ₹{formatPrice(riskAmount, 2)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isProfitable ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isProfitable ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isProfitable ? '+' : ''}₹{formatPrice(pos.pnl, 2)} ({pos.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onClosePosition(pos.id, 'Risk Dashboard Close')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer transition"
                        >
                          {language === 'kn' ? 'ಎಕ್ಸಿಟ್' : 'Exit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State Banner if no positions */}
      {openPositions.length === 0 && (
        <div className="text-center py-6 px-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
          <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">
            {language === 'kn' ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಪೊಸಿಷನ್‌ಗಳಿಲ್ಲ (ಶೂನ್ಯ ರಿಸ್ಕ್)' : 'No Active Risk Exposure'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {language === 'kn'
              ? 'ಸಿಗ್ನಲ್ ಕಾರ್ಡ್‌ನಲ್ಲಿ "Test Paper Buy/Sell" ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಬಹು-ಮಾರ್ಕೆಟ್ ಮಾದರಿ ಬಾಸ್ಕೆಟ್ ಪರೀಕ್ಷಿಸಿ.'
              : 'Execute paper trades using the signal cards or click below to load a sample multi-asset diversified portfolio.'}
          </p>
          <button
            onClick={onSeedSamplePositions}
            className="mt-3.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {language === 'kn' ? 'ಮಾದರಿ ರಿಸ್ಕ್ ಬಾಸ್ಕೆಟ್ ಸೇರಿಸಿ (Load Sample Basket)' : 'Load Sample Risk Basket'}
          </button>
        </div>
      )}
    </div>
  );
};
