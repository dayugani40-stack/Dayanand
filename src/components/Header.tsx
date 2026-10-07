import React from 'react';
import { Activity, Volume2, VolumeX, Globe, RefreshCw, Play, Pause, Clock, Zap } from 'lucide-react';
import { MarketSessionStatus } from '../types/market';
import { SessionMode } from '../utils/marketHours';

interface HeaderProps {
  language: 'kn' | 'en';
  onToggleLanguage: () => void;
  audioAlerts: boolean;
  onToggleAudio: () => void;
  onRefreshData: () => void;
  sessionMode: SessionMode;
  onSetSessionMode: (mode: SessionMode) => void;
  sessionStatus: MarketSessionStatus;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  audioAlerts,
  onToggleAudio,
  onRefreshData,
  sessionMode,
  onSetSessionMode,
  sessionStatus
}) => {
  const isMarketOpen = sessionStatus === 'OPEN';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2.5 shadow-md backdrop-blur bg-slate-900/95">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Market Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg shrink-0">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  {language === 'kn' ? 'ಮಾರ್ಕೆಟ್‌ಸಿಗ್ನಲ್ ಪ್ರೊ' : 'MarketSignal Pro'}
                </h1>
                {/* Dynamic Live Status Badge */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${
                    isMarketOpen
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMarketOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {isMarketOpen
                      ? language === 'kn'
                        ? 'ಮಾರ್ಕೆಟ್ ಲೈವ್ · ವಿಶ್ಲೇಷಣೆ ಚಾಲ್ತಿ'
                        : 'MARKET LIVE & ANALYZING'
                      : language === 'kn'
                      ? 'ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ · ಸ್ಟಾಪ್ ಹೋಲ್ಡ್'
                      : 'MARKET CLOSED · STOP HOLD'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {language === 'kn'
                  ? 'ಲೈವ್ ದಿನದ ಟ್ರೆಂಡ್ · 5 ನಿಮಿಷಗಳ ಕನ್ಫರ್ಮೇಶನ್ · ಯಾವಾಗ Buy / Sell / Exit ಮಾಡಬೇಕು'
                  : 'Live Day Trend · 5-Minute Confirmation · Precise Buy, Sell & Exit Engine'}
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Controls: SMART LIVE / START / HOLD / AUTO Switcher */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
          {/* Market Session Controller Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5 hidden lg:inline">
              {language === 'kn' ? 'ಸೆಷನ್:' : 'SESSION:'}
            </span>

            {/* 1. SMART LIVE Button (Only Open/Started Markets) */}
            <button
              onClick={() => onSetSessionMode('SMART_LIVE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                sessionMode === 'SMART_LIVE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಲೈವ್: ಕೇವಲ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಮಾರ್ಕೆಟ್‌ಗಳು ಮಾತ್ರ' : 'Smart Live: Started Markets Only'}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>{language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಲೈವ್' : 'SMART LIVE'}</span>
            </button>

            {/* 2. START LIVE Button (Force All Live) */}
            <button
              onClick={() => onSetSessionMode('FORCE_OPEN')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                sessionMode === 'FORCE_OPEN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={language === 'kn' ? 'ಎಲ್ಲಾ ಮಾರ್ಕೆಟ್ ಲೈವ್ ಸ್ಟಾರ್ಟ್ ಮಾಡಿ' : 'Force All Markets Live'}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{language === 'kn' ? 'ಸ್ಟಾರ್ಟ್ ಲೈವ್' : 'START LIVE'}</span>
            </button>

            {/* 3. STOP HOLD Button */}
            <button
              onClick={() => onSetSessionMode('FORCE_HOLD')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                sessionMode === 'FORCE_HOLD'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={language === 'kn' ? 'ಟಿಕ್ ನಿಲ್ಲಿಸಿ, ಕ್ಲೋಸಿಂಗ್ ಡೇಟಾ ಹೋಲ್ಡ್ ಮಾಡಿ' : 'Stop Ticks, Hold Last Close'}
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>{language === 'kn' ? 'ಸ್ಟಾಪ್ ಹೋಲ್ಡ್' : 'STOP HOLD'}</span>
            </button>

            {/* 4. AUTO Exchange Hours Button */}
            <button
              onClick={() => onSetSessionMode('AUTO')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                sessionMode === 'AUTO'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={language === 'kn' ? 'ನೈಜ ಎಕ್ಸ್‌ಚೇಂಜ್ ಸಮಯ ಪಾಲಿಸಿ' : 'Follow Official Exchange Clock'}
            >
              <Clock className="w-3 h-3" />
              <span>{language === 'kn' ? 'ಆಟೋ' : 'AUTO'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={onRefreshData}
              title={language === 'kn' ? 'ಡೇಟಾ ರಿಫ್ರೆಶ್' : 'Refresh Data'}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Sound Notification Alert Toggle */}
            <button
              onClick={onToggleAudio}
              title={audioAlerts ? 'Sound alerts on' : 'Sound alerts muted'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                audioAlerts
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {audioAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {language === 'kn' ? (audioAlerts ? 'ಧ್ವನಿ' : 'ಮ್ಯೂಟ್') : (audioAlerts ? 'Sound' : 'Muted')}
              </span>
            </button>

            {/* Kannada / English Language Switcher */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/40 text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? 'English' : 'ಕನ್ನಡ'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
