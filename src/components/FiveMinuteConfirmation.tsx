import React from 'react';
import { FiveMinuteConfirmation, MarketInstrument } from '../types/market';
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, Zap, PauseCircle } from 'lucide-react';

interface FiveMinuteConfirmationProps {
  confirmation: FiveMinuteConfirmation;
  market: MarketInstrument;
  isMarketOpen: boolean;
  language: 'kn' | 'en';
}

export const FiveMinuteConfirmationPanel: React.FC<FiveMinuteConfirmationProps> = ({
  confirmation,
  market,
  isMarketOpen,
  language
}) => {
  const isUpside = confirmation.verdict === 'CONFIRMED_UPSIDE';
  const isDownside = confirmation.verdict === 'CONFIRMED_DOWNSIDE';

  // Format countdown minutes and seconds
  const mins = Math.floor(confirmation.nextCandleTimeRemaining / 60);
  const secs = confirmation.nextCandleTimeRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const checksList = [
    confirmation.checks.emaCross,
    confirmation.checks.aboveVwap,
    confirmation.checks.rsiMomentum,
    confirmation.checks.volumeSurge,
    confirmation.checks.priceAction,
    confirmation.checks.supertrend,
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header with Title and 5M Candle Countdown Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === 'kn' ? '5 ನಿಮಿಷಗಳ ಟ್ರೆಂಡ್ ದೃಢೀಕರಣ (Confirmation)' : '5-Minute Trend Confirmation Engine'}
              </h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                MIN 5M
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isMarketOpen
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isMarketOpen ? 'LIVE ANALYZING' : 'HOLDING CLOSE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'kn'
                ? isMarketOpen
                  ? 'ಮಾರ್ಕೆಟ್ ಸ್ಟಾರ್ಟ್ ಆಗಿದೆ · 5 ನಿಮಿಷಗಳಲ್ಲಿ ಯಾವ ಕಡೆ ಹೋಗುತ್ತದೆ ಎಂಬುದರ ಲೈವ್ ಖಚಿತತೆ'
                  : 'ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ ಆಗಿದೆ · ಹಿಂದಿನ 5M ಕ್ಲೋಸಿಂಗ್ ಡೇಟಾ ಹೋಲ್ಡ್ ಮಾಡಲಾಗಿದೆ'
                : isMarketOpen
                ? 'Market session active · Algorithmic multi-factor directional confirmation'
                : 'Market session closed · Holding last 5M settlement levels'}
            </p>
          </div>
        </div>

        {/* 5-Minute Candle Clock / Hold Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 shrink-0">
          {isMarketOpen ? (
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <PauseCircle className="w-4 h-4 text-amber-400" />
          )}
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">
              {isMarketOpen
                ? language === 'kn' ? 'ಮುಂದಿನ 5M ಕ್ಯಾಂಡಲ್ ಕ್ಲೋಸ್' : '5M Bar Close In'
                : language === 'kn' ? 'ಸ್ಥಿತಿ (Session Status)' : 'Timer Status'}
            </div>
            <div
              className={`text-sm font-mono font-bold ${
                isMarketOpen ? 'text-amber-300' : 'text-amber-400'
              }`}
            >
              {isMarketOpen ? timeFormatted : language === 'kn' ? 'ಸ್ಟಾಪ್ ಹೋಲ್ಡ್' : 'STOP HOLD'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Confirmation Verdict Box */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
          isUpside
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
            : isDownside
            ? 'bg-red-950/30 border-red-500/40 text-red-400'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full border shadow-lg ${
              isUpside
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : isDownside
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-amber-500/20 border-amber-500 text-amber-400'
            }`}
          >
            {isUpside ? (
              <ShieldCheck className="w-7 h-7" />
            ) : isDownside ? (
              <AlertCircle className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-wider uppercase text-slate-300">
              {language === 'kn' ? '5 ನಿಮಿಷಗಳ ಅಂತಿಮ ತೀರ್ಪು' : '5M OFFICIAL VERDICT'}
            </div>
            <div className="text-xl font-extrabold tracking-wide mt-0.5 text-white">
              {isUpside
                ? language === 'kn' ? '▲ ಏರಿಕೆ ಖಚಿತ (5M CONFIRMED UPSIDE)' : '▲ CONFIRMED UPSIDE (BULLISH)'
                : isDownside
                ? language === 'kn' ? '▼ ಇಳಿಕೆ ಖಚಿತ (5M CONFIRMED DOWNSIDE)' : '▼ CONFIRMED DOWNSIDE (BEARISH)'
                : language === 'kn' ? '● ಕಾಯಿರಿ / ಕನ್ಸಾಲಿಡೇಶನ್ (NO CONFIRMATION)' : '● AWAIT 5M BREAKOUT CLOSE'}
            </div>

            {/* Direct Specific Action Pill: CALL vs PUT */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-md border ${
                  isUpside
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/40'
                    : isDownside
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 ring-1 ring-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {isUpside
                  ? language === 'kn'
                    ? '👉 ನಿರ್ದಿಷ್ಟ ಕ್ರಿಯೆ: CALL (CE) / ಬೈ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ'
                    : '👉 Action: TAKE CALL (CE) / BUY ENTRY'
                  : isDownside
                  ? language === 'kn'
                    ? '👉 ನಿರ್ದಿಷ್ಟ ಕ್ರಿಯೆ: PUT (PE) / ಇಳಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ'
                    : '👉 Action: TAKE PUT (PE) / DOWNSIDE ENTRY'
                  : language === 'kn'
                  ? '👉 ನಿರ್ದಿಷ್ಟ ಕ್ರಿಯೆ: ಯಾವುದೂ ತಗೋಬೇಡಿ (ವೇಯ್ಟ್ ಮಾಡಿ)'
                  : '👉 Action: NO ENTRY NOW (WAIT)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1.5">
              {language === 'kn' ? confirmation.summaryKn : confirmation.summaryEn}
            </p>
          </div>
        </div>

        {/* Confluence Score Bar */}
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 w-full md:w-auto md:min-w-[200px]">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-slate-400">
              {language === 'kn' ? 'ದೃಢೀಕರಣ ಅಂಕ' : 'Score'}:
            </span>
            <span className="text-white font-bold">
              {confirmation.score} / {confirmation.maxScore} ({confirmation.percent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isUpside ? 'bg-emerald-500' : isDownside ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${confirmation.percent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-center mt-1 font-mono">
            {confirmation.score >= 4
              ? language === 'kn' ? 'ಅತ್ಯುನ್ನತ ಸಂಭವನೀಯತೆ' : 'High Probability Setup'
              : confirmation.score <= 2
              ? language === 'kn' ? 'ಬೇರಿಷ್ ಪ್ರಾಬಲ್ಯ' : 'Strong Bearish Pressure'
              : language === 'kn' ? 'ಮಿಶ್ರ ಸಂಕೇತಗಳು' : 'Neutral / Chop Zone'}
          </div>
        </div>
      </div>

      {/* 6-Point Real-time Confirmation Checklist */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{language === 'kn' ? '೬-ಅಂಶಗಳ ತಾಂತ್ರಿಕ ಪರಿಶೀಲನೆ ಪಟ್ಟಿ' : '6-Factor Institutional Checklist'}</span>
          <span className="text-blue-400">{confirmation.score} of 6 Passed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {checksList.map((check, idx) => {
            const passed = check.status;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  passed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {language === 'kn' ? check.labelKn : check.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {language === 'kn' ? check.detailKn : check.detail}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
