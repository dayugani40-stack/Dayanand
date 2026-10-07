import React from 'react';
import { MarketInstrument, LiveMarketState, MarketSessionStatus } from '../types/market';
import { MarketScheduleInfo } from '../utils/marketHours';
import { formatPrice } from '../utils/technicalIndicators';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldAlert, Zap, Layers, PauseCircle, PlayCircle, Clock } from 'lucide-react';

interface LiveTrendOverviewProps {
  market: MarketInstrument;
  state: LiveMarketState;
  scheduleInfo: MarketScheduleInfo;
  language: 'kn' | 'en';
}

export const LiveTrendOverview: React.FC<LiveTrendOverviewProps> = ({
  market,
  state,
  scheduleInfo,
  language
}) => {
  const isPositive = state.change >= 0;
  const isMarketOpen = scheduleInfo.status === 'OPEN';
  const rangeWidth = state.dayHigh > state.dayLow 
    ? Math.max(2, Math.min(98, ((state.currentPrice - state.dayLow) / (state.dayHigh - state.dayLow)) * 100))
    : 50;

  // Trend Badge Config
  const getTrendConfig = () => {
    switch (state.trend) {
      case 'STRONG_BULLISH':
        return {
          titleKn: 'ಬಲವಾದ ಏರಿಕೆ (STRONG UPSIDE)',
          titleEn: 'STRONG UPSIDE (BULLISH)',
          descKn: 'ಖರೀದಿದಾರರು ಸಂಪೂರ್ಣ ಹಿಡಿತದಲ್ಲಿದ್ದಾರೆ. ಮಾರ್ಕೆಟ್ ಮೇಲ್ಮುಖವಾಗಿ ಮುನ್ನುಗ್ಗುತ್ತಿದೆ.',
          descEn: 'Bulls in heavy dominance. Strong upside momentum intraday.',
          bgColor: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
          indicatorColor: 'bg-emerald-500',
          icon: TrendingUp,
          bias: 'UPSIDE'
        };
      case 'BULLISH':
        return {
          titleKn: 'ಏರಿಕೆ ಟ್ರೆಂಡ್ (UPSIDE)',
          titleEn: 'UPSIDE BIAS (BULLISH)',
          descKn: 'ಮಾರ್ಕೆಟ್ ಪಾಸಿಟಿವ್ ವಲಯದಲ್ಲಿದೆ. ಪುಲ್‌ಬ್ಯಾಕ್‌ನಲ್ಲಿ ಖರೀದಿಗೆ ಉತ್ತಮ ಅವಕಾಶ.',
          descEn: 'Market trending upwards. Good buy-on-dips conditions.',
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          indicatorColor: 'bg-emerald-400',
          icon: TrendingUp,
          bias: 'UPSIDE'
        };
      case 'STRONG_BEARISH':
        return {
          titleKn: 'ಬಲವಾದ ಇಳಿಕೆ (STRONG DOWNSIDE)',
          titleEn: 'STRONG DOWNSIDE (BEARISH)',
          descKn: 'ಮಾರಾಟಗಾರರ ತೀವ್ರ ಒತ್ತಡವಿದೆ. ಮಾರ್ಕೆಟ್ ಕೆಳಮುಖವಾಗಿ ಧಾವಿಸುತ್ತಿದೆ.',
          descEn: 'Heavy selling pressure. Sharp downside trend in progress.',
          bgColor: 'bg-red-500/10 border-red-500/40 text-red-400',
          indicatorColor: 'bg-red-500',
          icon: TrendingDown,
          bias: 'DOWNSIDE'
        };
      case 'BEARISH':
        return {
          titleKn: 'ಇಳಿಕೆ ಟ್ರೆಂಡ್ (DOWNSIDE)',
          titleEn: 'DOWNSIDE BIAS (BEARISH)',
          descKn: 'ಮಾರ್ಕೆಟ್ ನೆಗೆಟಿವ್ ವಲಯದಲ್ಲಿದೆ. ರೈಸ್‌ನಲ್ಲಿ ಮಾರಾಟ ಮಾಡಲು ಅವಕಾಶ.',
          descEn: 'Negative intraday structure. Sell on bounce setup.',
          bgColor: 'bg-red-500/10 border-red-500/30 text-red-400',
          indicatorColor: 'bg-red-400',
          icon: TrendingDown,
          bias: 'DOWNSIDE'
        };
      default:
        return {
          titleKn: 'ಕನ್ಸಾಲಿಡೇಶನ್ / ಸ್ಥಿರ (SIDEWAYS)',
          titleEn: 'SIDEWAYS / CONSOLIDATION',
          descKn: 'ಮಾರ್ಕೆಟ್ ರೇಂಜ್ ಬೌಂಡ್ ಆಗಿದೆ. ಸ್ಪಷ್ಟ ಬ್ರೇಕ್‌ಔಟ್‌ಗೆ ಕಾಯಿರಿ.',
          descEn: 'Range-bound price action. Wait for breakout trigger.',
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          indicatorColor: 'bg-amber-400',
          icon: Minus,
          bias: 'NEUTRAL'
        };
    }
  };

  const trendConfig = getTrendConfig();
  const TrendIcon = trendConfig.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Session Alert Banner when Closed/Hold */}
      {!isMarketOpen && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PauseCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">
                {language === 'kn' ? scheduleInfo.statusLabelKn : scheduleInfo.statusLabelEn}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {language === 'kn'
                  ? `${market.kannadaName} ಮಾರುಕಟ್ಟೆ ಪ್ರಸ್ತುತ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ಅಂತಿಮ ದಿನದ ಕ್ಲೋಸ್ ಬೆಲೆ ಹೋಲ್ಡ್ ಮಾಡಲಾಗಿದೆ. ಲೈವ್ ಟಿಕ್ ಪರೀಕ್ಷಿಸಲು ಮೇಲಿನ 'ಸ್ಟಾರ್ಟ್ ಲೈವ್' ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.`
                  : `${market.name} session is currently closed. Holding settlement close. To force live streaming ticks, toggle 'START LIVE' at top.`}
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-amber-300 shrink-0 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'kn' ? scheduleInfo.nextEventTextKn : scheduleInfo.nextEventTextEn}</span>
          </div>
        </div>
      )}

      {/* Top Header: Market Name + Exchange + Live Price */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl font-bold text-white tracking-tight">
              {language === 'kn' ? market.kannadaName : market.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {market.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {market.exchange}
            </span>

            {/* Live streaming status indicator tag */}
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isMarketOpen
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isMarketOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              {isMarketOpen
                ? language === 'kn' ? 'ಲೈವ್ ವಿಶ್ಲೇಷಣೆ ಚಾಲ್ತಿಯಲ್ಲಿದೆ' : 'LIVE TICK STREAM'
                : language === 'kn' ? 'ಸ್ಟಾಪ್ ಹೋಲ್ಡ್' : 'HOLDING CLOSE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'kn' ? market.kannadaDescription : market.description}
          </p>
        </div>

        {/* Live Price Block */}
        <div className="flex items-baseline md:items-end flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 font-mono">
              {isMarketOpen
                ? language === 'kn' ? 'ಲೈವ್ ಬೆಲೆ' : 'LIVE TICK'
                : language === 'kn' ? 'ಅಂತಿಮ ಕ್ಲೋಸ್ ಬೆಲೆ' : 'SETTLEMENT CLOSE'}:
            </span>
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight transition-all duration-300 px-2 py-0.5 rounded ${
                state.lastTickDirection === 'UP' && isMarketOpen
                  ? 'text-emerald-300 bg-emerald-500/20 ring-1 ring-emerald-500/40'
                  : state.lastTickDirection === 'DOWN' && isMarketOpen
                  ? 'text-red-300 bg-red-500/20 ring-1 ring-red-500/40'
                  : isPositive
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {market.currency} {formatPrice(state.currentPrice, market.decimals)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold mt-0.5">
            <span className={`flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatPrice(state.change, market.decimals)} ({isPositive ? '+' : ''}{state.changePercent}%)
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-normal">
              {language === 'kn' ? 'ಹಿಂದಿನ ಕ್ಲೋಸ್' : 'Prev Close'}: {market.currency}{formatPrice(state.prevClose, market.decimals)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Trend Banner (Upside vs Downside) */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${trendConfig.bgColor}`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 shadow`}>
            <TrendIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-slate-400">
                {language === 'kn' ? 'ದಿನದ ಒಟ್ಟಾರೆ ಟ್ರೆಂಡ್' : 'DAY TREND MOMENTUM'}
              </span>
              <span className={`inline-block w-2 h-2 rounded-full ${isMarketOpen ? 'animate-ping' : ''} ${trendConfig.indicatorColor}`} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide mt-0.5">
              {language === 'kn' ? trendConfig.titleKn : trendConfig.titleEn}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'kn' ? trendConfig.descKn : trendConfig.descEn}
            </p>

            {/* Particular Trade Directive Pill */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded border shadow-sm ${
                  trendConfig.bias === 'DOWNSIDE'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : trendConfig.bias === 'UPSIDE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {trendConfig.bias === 'DOWNSIDE'
                  ? language === 'kn'
                    ? '🎯 ಶಿಫಾರಸು: PUT (PE) ಎಂಟ್ರಿ ತಗೋಬೇಕು'
                    : '🎯 Direct Action: TAKE PUT (PE) ENTRY'
                  : trendConfig.bias === 'UPSIDE'
                  ? language === 'kn'
                    ? '🎯 ಶಿಫಾರಸು: CALL (CE) ಎಂಟ್ರಿ ತಗೋಬೇಕು'
                    : '🎯 Direct Action: TAKE CALL (CE) ENTRY'
                  : language === 'kn'
                  ? '🎯 ಶಿಫಾರಸು: ಸದ್ಯ ಯಾವುದೂ ತಗೋಬೇಡಿ (Wait)'
                  : '🎯 Direct Action: Await Breakout'}
              </span>
            </div>
          </div>
        </div>

        {/* Probability Score Pill */}
        <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-lg border border-slate-800 shrink-0">
          <div className="text-center">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">
              {language === 'kn' ? 'ಏರಿಕೆ ಸಂಭವನೀಯತೆ' : 'UPSIDE PROB'}
            </div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {state.upsideProbability}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-mono text-red-400 font-semibold">
              {language === 'kn' ? 'ಇಳಿಕೆ ಸಂಭವನೀಯತೆ' : 'DOWNSIDE PROB'}
            </div>
            <div className="text-xl font-extrabold text-red-400 font-mono">
              {state.downsideProbability}%
            </div>
          </div>
        </div>
      </div>

      {/* Buyers vs Sellers Volume Meter & Range Slider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buyers vs Sellers */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {language === 'kn' ? 'ಖರೀದಿದಾರರು (Bulls)' : 'Buyers (Bulls)'}: {state.buyersPercent}%
            </span>
            <span className="text-red-400 font-semibold flex items-center gap-1">
              {language === 'kn' ? 'ಮಾರಾಟಗಾರರು (Bears)' : 'Sellers (Bears)'}: {state.sellersPercent}%
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${state.buyersPercent}%` }}
            />
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${state.sellersPercent}%` }}
            />
          </div>
        </div>

        {/* Intraday Range (Day Low to Day High) */}
        <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-slate-400">
              {language === 'kn' ? 'ದಿನದ ಕನಿಷ್ಠ (Low)' : 'Day Low'}: <span className="text-red-400 font-semibold">{market.currency}{formatPrice(state.dayLow, market.decimals)}</span>
            </span>
            <span className="text-slate-400">
              {language === 'kn' ? 'ದಿನದ ಗರಿಷ್ಠ (High)' : 'Day High'}: <span className="text-emerald-400 font-semibold">{market.currency}{formatPrice(state.dayHigh, market.decimals)}</span>
            </span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-800 rounded-full">
            <div
              className="absolute -top-1 w-3.5 h-4.5 bg-blue-500 border border-white rounded shadow transition-all duration-200"
              style={{ left: `calc(${rangeWidth}% - 7px)` }}
              title={`Current: ${state.currentPrice}`}
            />
          </div>
        </div>
      </div>

      {/* Intraday Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'ಆರಂಭಿಕ (Open)' : 'Open'}
          </div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
            {market.currency}{formatPrice(state.open, market.decimals)}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'ಗರಿಷ್ಠ (High)' : 'High'}
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {market.currency}{formatPrice(state.dayHigh, market.decimals)}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'ಕನಿಷ್ಠ (Low)' : 'Low'}
          </div>
          <div className="text-sm font-bold font-mono text-red-400 mt-0.5">
            {market.currency}{formatPrice(state.dayLow, market.decimals)}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'VWAP ಬೆಲೆ' : 'VWAP'}
          </div>
          <div className="text-sm font-bold font-mono text-orange-400 mt-0.5">
            {market.currency}{formatPrice(state.vwap, market.decimals)}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'ದಿನದ ವಹಿವಾಟು' : 'Day Volume'}
          </div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
            {state.volume.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-mono">
            {language === 'kn' ? 'ಲಾಟ್ ಗಾತ್ರ' : 'Lot Size'}
          </div>
          <div className="text-sm font-bold font-mono text-blue-400 mt-0.5">
            {market.lotSize} {market.category === 'indian' ? 'Qty' : 'Units'}
          </div>
        </div>
      </div>
    </div>
  );
};
