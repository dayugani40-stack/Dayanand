import React, { useState } from 'react';
import { MarketInstrument, TradeSignal, LiveMarketState } from '../types/market';
import { formatPrice } from '../utils/technicalIndicators';
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  Play,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Columns,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Flame
} from 'lucide-react';

interface TradingSignalsCardProps {
  signal: TradeSignal;
  market: MarketInstrument;
  state: LiveMarketState;
  isMarketOpen: boolean;
  language: 'kn' | 'en';
  onExecutePaperTrade: (type: 'BUY' | 'SELL') => void;
  onOpenAiAnalysis: () => void;
}

type ViewSide = 'AUTO' | 'DOWNSIDE' | 'UPSIDE' | 'DUAL';

export const TradingSignalsCard: React.FC<TradingSignalsCardProps> = ({
  signal,
  market,
  state,
  isMarketOpen,
  language,
  onExecutePaperTrade,
  onOpenAiAnalysis
}) => {
  const [selectedSideView, setSelectedSideView] = useState<ViewSide>('AUTO');

  const isBearishDominant =
    signal.particularEntry === 'PUT_PE' ||
    signal.action === 'SELL' ||
    signal.direction === 'DOWNSIDE' ||
    state.downsideProbability > 51;

  const isBullishDominant =
    signal.particularEntry === 'CALL_CE' ||
    signal.action === 'BUY' ||
    signal.direction === 'UPSIDE' ||
    state.upsideProbability > 51;

  // Effective side to emphasize in single view
  const activeSide =
    selectedSideView === 'AUTO'
      ? isBearishDominant
        ? 'DOWNSIDE'
        : 'UPSIDE'
      : selectedSideView;

  const buyPlan = signal.buyPlan || {
    action: 'BUY' as const,
    entryPrice: signal.entryPrice,
    entryZone: signal.entryZone,
    stopLoss: signal.stopLoss,
    stopLossPts: signal.stopLossPts,
    target1: signal.target1,
    target1Pts: signal.target1Pts,
    target2: signal.target2,
    target2Pts: signal.target2Pts,
    target3: signal.target3,
    target3Pts: signal.target3Pts,
    riskReward: signal.riskReward,
    conditionEn: signal.entryConditionEn,
    conditionKn: signal.entryConditionKn,
    exitWhenEn: signal.exitWhenEn,
    exitWhenKn: signal.exitWhenKn,
    confidence: signal.confidence
  };

  const sellPlan = signal.sellPlan || {
    action: 'SELL' as const,
    entryPrice: Number((state.currentPrice - market.tickSize).toFixed(market.decimals)),
    entryZone: `${formatPrice(state.currentPrice * 0.999, market.decimals)} - ${formatPrice(state.currentPrice, market.decimals)}`,
    stopLoss: Number((state.currentPrice + signal.stopLossPts).toFixed(market.decimals)),
    stopLossPts: signal.stopLossPts,
    target1: Number((state.currentPrice - signal.target1Pts).toFixed(market.decimals)),
    target1Pts: signal.target1Pts,
    target2: Number((state.currentPrice - signal.target2Pts).toFixed(market.decimals)),
    target2Pts: signal.target2Pts,
    target3: Number((state.currentPrice - signal.target3Pts).toFixed(market.decimals)),
    target3Pts: signal.target3Pts,
    riskReward: '1 : 2.5',
    conditionEn: `ENTER SELL / PUT (PE) / SHORT when 5M candle breaks below ${market.currency}${formatPrice(state.currentPrice - market.tickSize, market.decimals)}`,
    conditionKn: `ಮಾರಾಟ (SELL / PUT - PE / SHORT): 5 ನಿಮಿಷದ ಕ್ಯಾಂಡಲ್ ${market.currency}${formatPrice(state.currentPrice - market.tickSize, market.decimals)} ಗಿಂತ ಕೆಳಗೆ ಮುಕ್ತಾಯವಾದಾಗ ಪುಟ್ ಖರೀದಿಸಿ / ಶಾರ್ಟ್ ಮಾಡಿ`,
    exitWhenEn: `DOWNSIDE EXIT: 1. SL at ${market.currency}${formatPrice(state.currentPrice + signal.stopLossPts, market.decimals)}. 2. Book 50% at Target 1 (${market.currency}${formatPrice(state.currentPrice - signal.target1Pts, market.decimals)}). 3. Full Exit at Target 2 (${market.currency}${formatPrice(state.currentPrice - signal.target2Pts, market.decimals)}).`,
    exitWhenKn: `ಇಳಿಕೆ (DOWNSIDE) ಎಕ್ಸಿಟ್: ೧. ಬೆಲೆ ${market.currency}${formatPrice(state.currentPrice + signal.stopLossPts, market.decimals)} ಗೆ ಏರಿದರೆ ಸ್ಟಾಪ್ ಲಾಸ್ ಎಕ್ಸಿಟ್. ೨. ಟಾರ್ಗೆಟ್ 1 (${market.currency}${formatPrice(state.currentPrice - signal.target1Pts, market.decimals)}) ತಲುಪಿದಾಗ 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ. ೩. ಟಾರ್ಗೆಟ್ 2 ರಲ್ಲಿ ಸಂಪೂರ್ಣ ನಿರ್ಗಮನ.`,
    confidence: Math.min(96, Math.max(50, state.downsideProbability))
  };

  // Live Exit Advice based on current live price & active direction
  const getLiveExitStatus = () => {
    const cur = state.currentPrice;
    if (!isMarketOpen) {
      return {
        type: 'HOLD',
        messageKn: `⏸️ ಮಾರುಕಟ್ಟೆ ಕ್ಲೋಸ್ ಆಗಿದೆ - ಹೋಲ್ಡ್ (Market Closed). ಹಿಂದಿನ ಕ್ಲೋಸಿಂಗ್ ಹಂತಗಳನ್ನು ಮುಂದಿನ ಸೆಷನ್‌ಗಾಗಿ ಹೋಲ್ಡ್ ಮಾಡಲಾಗಿದೆ.`,
        messageEn: `⏸️ Market session closed · Preserving settlement levels.`,
        color: 'text-amber-400 bg-amber-950/40 border-amber-500/40'
      };
    }

    if (activeSide === 'DOWNSIDE') {
      if (cur <= sellPlan.target2) {
        return {
          type: 'TARGET2',
          messageKn: `🎯 ಇಳಿಕೆಯ ಟಾರ್ಗೆಟ್ 2 ತಲುಪಿದೆ (${market.currency}${formatPrice(sellPlan.target2, market.decimals)})! ಸಂಪೂರ್ಣವಾಗಿ ಎಕ್ಸಿಟ್ ಆಗಿ ಪುಟ್ (PE) ಲಾಭ ಖಾತ್ರಿಪಡಿಸಿ!`,
          messageEn: `🎯 Downside Target 2 achieved (${market.currency}${formatPrice(sellPlan.target2, market.decimals)})! Full exit recommended to bank profit!`,
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
        };
      }
      if (cur <= sellPlan.target1) {
        return {
          type: 'TARGET1',
          messageKn: `🎉 ಇಳಿಕೆಯ ಟಾರ್ಗೆಟ್ 1 ಸಾಧಿಸಲಾಗಿದೆ (${market.currency}${formatPrice(sellPlan.target1, market.decimals)})! 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ, ಸ್ಟಾಪ್ ಲಾಸ್ ಅನ್ನು ಎಂಟ್ರಿ ಬೆಲೆಗೆ ತನ್ನಿ.`,
          messageEn: `🎉 Downside Target 1 reached (${market.currency}${formatPrice(sellPlan.target1, market.decimals)})! Book 50% and trail SL to cost.`,
          color: 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30'
        };
      }
      if (cur >= sellPlan.stopLoss) {
        return {
          type: 'STOPLOSS',
          messageKn: `⚠️ ಇಳಿಕೆಯ ಸ್ಟಾಪ್ ಲಾಸ್ ಹಿಟ್ ಆಗಿದೆ (${market.currency}${formatPrice(sellPlan.stopLoss, market.decimals)})! ತಕ್ಷಣವೇ ಶಾರ್ಟ್ / ಪುಟ್ ಪೊಸಿಷನ್ ಎಕ್ಸಿಟ್ ಮಾಡಿ!`,
          messageEn: `⚠️ Downside Stop Loss hit (${market.currency}${formatPrice(sellPlan.stopLoss, market.decimals)})! Immediate Exit required!`,
          color: 'text-red-400 bg-red-950/40 border-red-500/40'
        };
      }
      return {
        type: 'ACTIVE',
        messageKn: `🔻 ಇಳಿಕೆಯ ಟ್ರೇಡ್ (DOWNSIDE / PUT) ಚಾಲ್ತಿಯಲ್ಲಿದೆ. ಟಾರ್ಗೆಟ್ 1: ${market.currency}${formatPrice(sellPlan.target1, market.decimals)}. ಸ್ಟಾಪ್ ಲಾಸ್: ${market.currency}${formatPrice(sellPlan.stopLoss, market.decimals)}.`,
        messageEn: `🔻 Downside / PUT trade active. Aiming for Target 1: ${market.currency}${formatPrice(sellPlan.target1, market.decimals)}. Strict SL at ${market.currency}${formatPrice(sellPlan.stopLoss, market.decimals)}.`,
        color: 'text-red-400 bg-red-950/30 border-red-500/30'
      };
    } else {
      // Upside
      if (cur >= buyPlan.target2) {
        return {
          type: 'TARGET2',
          messageKn: `🎯 ಏರಿಕೆಯ ಟಾರ್ಗೆಟ್ 2 ತಲುಪಿದೆ (${market.currency}${formatPrice(buyPlan.target2, market.decimals)})! ಸಂಪೂರ್ಣವಾಗಿ ಎಕ್ಸಿಟ್ ಆಗಿ ಕಾಲ್ (CE) ಲಾಭ ಬುಕ್ ಮಾಡಿ!`,
          messageEn: `🎯 Upside Target 2 reached (${market.currency}${formatPrice(buyPlan.target2, market.decimals)})! Full exit recommended!`,
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
        };
      }
      if (cur >= buyPlan.target1) {
        return {
          type: 'TARGET1',
          messageKn: `🎉 ಏರಿಕೆಯ ಟಾರ್ಗೆಟ್ 1 ಸಾಧಿಸಲಾಗಿದೆ (${market.currency}${formatPrice(buyPlan.target1, market.decimals)})! 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ, SL ಅನ್ನು ಎಂಟ್ರಿ ಬೆಲೆಗೆ ತನ್ನಿ.`,
          messageEn: `🎉 Upside Target 1 achieved (${market.currency}${formatPrice(buyPlan.target1, market.decimals)})! Book 50% and trail SL.`,
          color: 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30'
        };
      }
      if (cur <= buyPlan.stopLoss) {
        return {
          type: 'STOPLOSS',
          messageKn: `⚠️ ಏರಿಕೆಯ ಸ್ಟಾಪ್ ಲಾಸ್ ಮುಟ್ಟಿದೆ (${market.currency}${formatPrice(buyPlan.stopLoss, market.decimals)})! ತಕ್ಷಣವೇ ಕಾಲ್ ಪೊಸಿಷನ್ ಎಕ್ಸಿಟ್ ಮಾಡಿ!`,
          messageEn: `⚠️ Upside Stop Loss breached (${market.currency}${formatPrice(buyPlan.stopLoss, market.decimals)})! Exit call position immediately!`,
          color: 'text-red-400 bg-red-950/40 border-red-500/40'
        };
      }
      return {
        type: 'ACTIVE',
        messageKn: `▲ ಏರಿಕೆಯ ಟ್ರೇಡ್ (UPSIDE / CALL) ಚಾಲ್ತಿಯಲ್ಲಿದೆ. ಟಾರ್ಗೆಟ್ 1: ${market.currency}${formatPrice(buyPlan.target1, market.decimals)}. ಸ್ಟಾಪ್ ಲಾಸ್: ${market.currency}${formatPrice(buyPlan.stopLoss, market.decimals)}.`,
        messageEn: `▲ Upside / CALL trade active. Aiming for Target 1: ${market.currency}${formatPrice(buyPlan.target1, market.decimals)}. SL at ${market.currency}${formatPrice(buyPlan.stopLoss, market.decimals)}.`,
        color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30'
      };
    }
  };

  const liveExit = getLiveExitStatus();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* =========================================================================
          HERO SECTION: "BUY (CALL) ತಗೋಬೇಕಾ? ಅಥವಾ PUT (PE) ತಗೋಬೇಕಾ?"
          Direct Answer to User's Core Question
          ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-400">
                {language === 'kn' ? 'ನೇರ & ಖಚಿತ ನಿರ್ಧಾರ' : 'DEFINITIVE TRADE DIRECTIVE'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {language === 'kn'
                  ? 'BUY (CALL - CE) ತಗೋಬೇಕಾ? ಅಥವಾ PUT (PE) ತಗೋಬೇಕಾ?'
                  : 'Should you take BUY / CALL (CE) or PUT (PE) Entry?'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              {language === 'kn' ? 'ಮಾರ್ಕೆಟ್ ಸ್ಥಿತಿ:' : 'Market Bias:'}
            </span>
            <span
              className={`text-xs uppercase font-mono font-extrabold px-2.5 py-1 rounded-lg border ${
                isBearishDominant
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-950'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950'
              }`}
            >
              {isBearishDominant
                ? language === 'kn' ? '🔻 ಇಳಿಕೆಯ ಒತ್ತಡ (Downside)' : '🔻 Downside Selling'
                : language === 'kn' ? '🔺 ಏರಿಕೆಯ ಬಲ (Upside)' : '🔺 Upside Buying'}
            </span>
          </div>
        </div>

        {/* Big Verdict Hero Box */}
        <div
          className={`p-4 sm:p-5 rounded-xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
            isBearishDominant
              ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30 shadow-xl shadow-red-950/50'
              : 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/50'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3.5 rounded-2xl shadow-lg shrink-0 ${
                isBearishDominant
                  ? 'bg-red-600 text-white shadow-red-900/50 animate-pulse'
                  : 'bg-emerald-600 text-white shadow-emerald-900/50 animate-pulse'
              }`}
            >
              {isBearishDominant ? (
                <TrendingDown className="w-8 h-8" />
              ) : (
                <TrendingUp className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-300">
                {language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ನಿರ್ದಿಷ್ಟ ಉತ್ತರ:' : 'YOUR DEFINITIVE ANSWER:'}
              </div>

              {/* Exact Particular Verdict Headline */}
              <div className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  {isBearishDominant
                    ? language === 'kn'
                      ? '🔴 PUT (PE) / ಇಳಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ!'
                      : '🔴 TAKE PUT (PE) / DOWNSIDE ENTRY!'
                    : language === 'kn'
                    ? '🟢 CALL (CE) / ಏರಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ!'
                    : '🟢 TAKE CALL (CE) / UPSIDE ENTRY!'}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-white border border-white/20">
                  {isBearishDominant ? 'BUY PUT / SHORT' : 'BUY CALL / LONG'}
                </span>
              </div>

              {/* Explicit reason why CALL or PUT */}
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium leading-relaxed">
                {isBearishDominant
                  ? language === 'kn'
                    ? '👉 ಕಾಲ್ (CE) ತಗೋಬೇಡಿ! ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಇಳಿಕೆಯ ಒತ್ತಡವಿದೆ (VWAP & EMA ಕೆಳಗೆ). ಪುಟ್ (PUT - PE) ಖರೀದಿಸಿ ಅಥವಾ ಶಾರ್ಟ್ ಮಾಡಿ.'
                    : '👉 Avoid CALLs! Heavy institutional downside pressure below VWAP. Enter PUT (PE) or Short.'
                  : language === 'kn'
                  ? '👉 ಪುಟ್ (PE) ತಗೋಬೇಡಿ! ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಏರಿಕೆಯ ಬಲವಿದೆ (VWAP & EMA ಮೇಲೆ). ಕಾಲ್ (CALL - CE) ಖರೀದಿಸಿ ಅಥವಾ ಲಾಂಗ್ ಮಾಡಿ.'
                  : '👉 Avoid PUTs! Upward momentum dominant above VWAP. Enter CALL (CE) or Long.'}
              </p>

              {/* Exact strike recommendation */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">
                  {language === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಆಯ್ಕೆ:' : 'Recommended Instrument:'}
                </span>
                <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  {isBearishDominant
                    ? `${market.symbol} ATM PUT (PE) / Short Futures`
                    : `${market.symbol} ATM CALL (CE) / Long Futures`}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  {language === 'kn' ? 'ಎಂಟ್ರಿ ಮಟ್ಟ:' : 'Entry:'}{' '}
                  <span className="font-bold text-white">
                    {market.currency}
                    {formatPrice(
                      isBearishDominant ? sellPlan.entryPrice : buyPlan.entryPrice,
                      market.decimals
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Paper Execution CTA */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={() => onExecutePaperTrade(isBearishDominant ? 'SELL' : 'BUY')}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                isBearishDominant
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/60 ring-2 ring-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/60 ring-2 ring-emerald-400'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isBearishDominant
                  ? language === 'kn'
                    ? 'PUT (PE) ಎಂಟ್ರಿ ಟೆಸ್ಟ್ ಮಾಡಿ'
                    : 'Test Paper PUT (PE)'
                  : language === 'kn'
                  ? 'CALL (CE) ಎಂಟ್ರಿ ಟೆಸ್ಟ್ ಮಾಡಿ'
                  : 'Test Paper CALL (CE)'}
              </span>
            </button>
            <button
              onClick={onOpenAiAnalysis}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{language === 'kn' ? 'AI ಆಳವಾದ ವಿಶ್ಲೇಷಣೆ' : 'AI Deep Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW SWITCHER & TAB CONTROLS (AUTO / DOWNSIDE / UPSIDE / DUAL)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white">
            {language === 'kn'
              ? 'ಇಳಿಕೆ (Downside/Put) & ಏರಿಕೆ (Upside/Call) ವಿವರವಾದ ಪ್ಲಾನ್'
              : 'Detailed Downside (Put) & Upside (Call) Playbooks'}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'kn'
              ? 'ಎರಡೂ ಬದಿಯ ನಿಖರ ಬ್ರೇಕ್‌ಔಟ್/ಬ್ರೇಕ್‌ಡೌನ್ ಲೆವೆಲ್, ಸ್ಟಾಪ್ ಲಾಸ್ ಮತ್ತು ಹಂತ ಹಂತದ ಟಾರ್ಗೆಟ್‌ಗಳು'
              : 'Exact entry triggers, stop-loss, and multi-tier targets for both directions'}
          </p>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1 flex-wrap">
          <button
            onClick={() => setSelectedSideView('AUTO')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              selectedSideView === 'AUTO'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'kn' ? 'ಲೈವ್ ಆಟೋ' : 'Live Auto'}
          </button>

          {/* DOWNSIDE (SELL / PUT / SHORT) TAB */}
          <button
            onClick={() => setSelectedSideView('DOWNSIDE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSideView === 'DOWNSIDE'
                ? 'bg-red-600 text-white shadow-md shadow-red-900/40 ring-1 ring-red-400'
                : 'text-red-400 hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? '೧. ಇಳಿಕೆ (PUT / PE)' : '1. Downside (PUT)'}</span>
          </button>

          {/* UPSIDE (BUY / CALL / LONG) TAB */}
          <button
            onClick={() => setSelectedSideView('UPSIDE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedSideView === 'UPSIDE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? '೨. ಏರಿಕೆ (CALL / CE)' : '2. Upside (CALL)'}</span>
          </button>

          {/* DUAL VIEW BUTTON */}
          <button
            onClick={() => setSelectedSideView('DUAL')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer hidden sm:flex items-center gap-1 ${
              selectedSideView === 'DUAL'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Show both sides side-by-side"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಎರಡೂ ಒಟ್ಟಿಗೆ' : 'Dual'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRIMARY ACTION CARDS GRID:
          1. DOWNSIDE (SELL / PUT - PE)
          2. UPSIDE (BUY / CALL - CE)
          3. EXIT BLUEPRINT
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* -------------------------------------------------------------
            CARD 1: DOWNSIDE (SELL / PUT - PE / SHORT)
            ------------------------------------------------------------- */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isBearishDominant || selectedSideView === 'DOWNSIDE' || selectedSideView === 'DUAL'
              ? 'bg-red-950/30 border-red-500 ring-2 ring-red-500/40 shadow-xl shadow-red-950/40'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <span>
                  {language === 'kn'
                    ? '೧. ಇಳಿಕೆ ಟ್ರೇಡ್ (DOWNSIDE / PUT - PE)'
                    : '1. DOWNSIDE TRADE (PUT - PE)'}
                </span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isBearishDominant
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isBearishDominant ? (language === 'kn' ? 'ಸಕ್ರಿಯ ಶಿಫಾರಸು' : 'RECOMMENDED') : 'SETUP READY'}
              </span>
            </div>

            {/* Entry Price & Tag */}
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>
                {market.currency} {formatPrice(sellPlan.entryPrice, market.decimals)}
              </span>
              <span className="text-xs font-semibold text-red-400">
                {language === 'kn' ? '(ಪುಟ್ / ಶಾರ್ಟ್ ಬ್ರೇಕ್‌ಡೌನ್)' : '(PUT Breakdown)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {language === 'kn' ? sellPlan.conditionKn : sellPlan.conditionEn}
            </p>

            {/* Downside SL & Target 1 */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/90 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {language === 'kn' ? 'ಇಳಿಕೆ ಸ್ಟಾಪ್ ಲಾಸ್ (SL):' : 'Downside SL:'}
                </span>
                <span className="text-red-400 font-extrabold text-sm">
                  {market.currency}
                  {formatPrice(sellPlan.stopLoss, market.decimals)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (-{sellPlan.stopLossPts} pts)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {language === 'kn' ? 'ಪುಟ್ ಟಾರ್ಗೆಟ್ 1 (T1):' : 'Downside Target 1:'}
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  {market.currency}
                  {formatPrice(sellPlan.target1, market.decimals)}
                </span>
                <span className="text-[10px] text-emerald-500 block">
                  (+{sellPlan.target1Pts} pts)
                </span>
              </div>
            </div>

            {/* Additional info badge */}
            <div className="mt-2.5 px-2 py-1 rounded bg-red-950/40 border border-red-500/20 text-[11px] text-red-300 font-mono">
              {language === 'kn'
                ? `ಪುಟ್ ಟಾರ್ಗೆಟ್ 2: ${market.currency}${formatPrice(sellPlan.target2, market.decimals)} (ಪೂರ್ಣ ಎಕ್ಸಿಟ್)`
                : `Target 2: ${market.currency}${formatPrice(sellPlan.target2, market.decimals)} (Full Exit)`}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onExecutePaperTrade('SELL')}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md shadow-red-950/50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {language === 'kn' ? 'ಇಳಿಕೆ ಟ್ರೇಡ್ ಪರೀಕ್ಷಿಸಿ (Paper PUT / PE)' : 'Test Paper PUT / PE Entry'}
              </span>
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            CARD 2: UPSIDE (BUY / CALL - CE / LONG)
            ------------------------------------------------------------- */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isBullishDominant || selectedSideView === 'UPSIDE' || selectedSideView === 'DUAL'
              ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-950/40'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'kn'
                    ? '೨. ಏರಿಕೆ ಟ್ರೇಡ್ (UPSIDE / CALL - CE)'
                    : '2. UPSIDE TRADE (CALL - CE)'}
                </span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isBullishDominant
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isBullishDominant ? (language === 'kn' ? 'ಸಕ್ರಿಯ ಶಿಫಾರಸು' : 'RECOMMENDED') : 'SETUP READY'}
              </span>
            </div>

            {/* Entry Price & Tag */}
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>
                {market.currency} {formatPrice(buyPlan.entryPrice, market.decimals)}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {language === 'kn' ? '(ಕಾಲ್ / ಲಾಂಗ್ ಬ್ರೇಕ್‌ಔಟ್)' : '(CALL Breakout)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {language === 'kn' ? buyPlan.conditionKn : buyPlan.conditionEn}
            </p>

            {/* Upside SL & Target 1 */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/90 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {language === 'kn' ? 'ಏರಿಕೆ ಸ್ಟಾಪ್ ಲಾಸ್ (SL):' : 'Upside SL:'}
                </span>
                <span className="text-red-400 font-extrabold text-sm">
                  {market.currency}
                  {formatPrice(buyPlan.stopLoss, market.decimals)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (-{buyPlan.stopLossPts} pts)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {language === 'kn' ? 'ಕಾಲ್ ಟಾರ್ಗೆಟ್ 1 (T1):' : 'Upside Target 1:'}
                </span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  {market.currency}
                  {formatPrice(buyPlan.target1, market.decimals)}
                </span>
                <span className="text-[10px] text-emerald-500 block">
                  (+{buyPlan.target1Pts} pts)
                </span>
              </div>
            </div>

            {/* Additional info badge */}
            <div className="mt-2.5 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
              {language === 'kn'
                ? `ಕಾಲ್ ಟಾರ್ಗೆಟ್ 2: ${market.currency}${formatPrice(buyPlan.target2, market.decimals)} (ಪೂರ್ಣ ಎಕ್ಸಿಟ್)`
                : `Target 2: ${market.currency}${formatPrice(buyPlan.target2, market.decimals)} (Full Exit)`}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onExecutePaperTrade('BUY')}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-950/50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {language === 'kn' ? 'ಏರಿಕೆ ಟ್ರೇಡ್ ಪರೀಕ್ಷಿಸಿ (Paper CALL / CE)' : 'Test Paper CALL / CE Entry'}
              </span>
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            CARD 3: WHEN TO EXIT (ಎಕ್ಸಿಟ್ ನಿಯಮಗಳು)
            ------------------------------------------------------------- */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>{language === 'kn' ? '೩. ಯಾವಾಗ EXIT ಆಗಬೇಕು?' : '3. WHEN TO EXIT RULES'}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeSide === 'DOWNSIDE'
                  ? language === 'kn' ? 'ಇಳಿಕೆ ನಿರ್ಗಮನ' : 'Downside Exit'
                  : language === 'kn' ? 'ಏರಿಕೆ ನಿರ್ಗಮನ' : 'Upside Exit'}
              </span>
            </div>

            {/* Exact targets based on currently active side */}
            {activeSide === 'DOWNSIDE' ? (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-red-400 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಇಳಿಕೆ ಸ್ಟಾಪ್ ಲಾಸ್ (SL):' : 'Downside SL:'}
                  </span>
                  <span className="font-mono font-extrabold text-red-400">
                    {market.currency}
                    {formatPrice(sellPlan.stopLoss, market.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಪುಟ್ ಟಾರ್ಗೆಟ್ 1 (50% ಲಾಭ):' : 'Target 1 (Book 50%):'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {market.currency}
                    {formatPrice(sellPlan.target1, market.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಪುಟ್ ಟಾರ್ಗೆಟ್ 2 (ಪೂರ್ಣ ಎಕ್ಸಿಟ್):' : 'Target 2 (Full Exit):'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {market.currency}
                    {formatPrice(sellPlan.target2, market.decimals)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-red-400 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಕಾಲ್ ಸ್ಟಾಪ್ ಲಾಸ್ (SL):' : 'Upside SL:'}
                  </span>
                  <span className="font-mono font-extrabold text-red-400">
                    {market.currency}
                    {formatPrice(buyPlan.stopLoss, market.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಕಾಲ್ ಟಾರ್ಗೆಟ್ 1 (50% ಲಾಭ):' : 'Target 1 (Book 50%):'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {market.currency}
                    {formatPrice(buyPlan.target1, market.decimals)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {language === 'kn' ? 'ಕಾಲ್ ಟಾರ್ಗೆಟ್ 2 (ಪೂರ್ಣ ಎಕ್ಸಿಟ್):' : 'Target 2 (Full Exit):'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {market.currency}
                    {formatPrice(buyPlan.target2, market.decimals)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
            <span>{language === 'kn' ? 'ರಿಸ್ಕ್-ರಿವಾರ್ಡ್ ಅನುಪಾತ:' : 'Risk-Reward Ratio:'}</span>
            <span className="text-blue-400 font-bold">{signal.riskReward}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Live Exit Alert Notification */}
      <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${liveExit.color}`}>
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div className="text-xs font-medium">
          <span className="font-bold mr-1">
            {language === 'kn' ? 'ಲೈವ್ ಎಕ್ಸಿಟ್ ಎಚ್ಚರಿಕೆ:' : 'Live Market Exit Alert:'}
          </span>
          {language === 'kn' ? liveExit.messageKn : liveExit.messageEn}
        </div>
      </div>

      {/* Detailed Kannada / English Explanation Box */}
      <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1.5">
        <div className="font-bold text-slate-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            {language === 'kn'
              ? activeSide === 'DOWNSIDE'
                ? 'ಇಳಿಕೆ (Downside / Put) ಟ್ರೇಡರ್ ಮಾರ್ಗದರ್ಶಿ ಪುಸ್ತಕ:'
                : 'ಏರಿಕೆ (Upside / Call) ಟ್ರೇಡರ್ ಮಾರ್ಗದರ್ಶಿ ಪುಸ್ತಕ:'
              : activeSide === 'DOWNSIDE'
              ? 'Downside / Put (PE) Trader Execution Playbook:'
              : 'Upside / Call (CE) Trader Execution Playbook:'}
          </span>
        </div>
        <p>
          {language === 'kn'
            ? activeSide === 'DOWNSIDE' ? sellPlan.exitWhenKn : buyPlan.exitWhenKn
            : activeSide === 'DOWNSIDE' ? sellPlan.exitWhenEn : buyPlan.exitWhenEn}
        </p>
      </div>
    </div>
  );
};
