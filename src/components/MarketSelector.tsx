import React, { useState, useEffect } from 'react';
import { MarketCategory, MarketInstrument } from '../types/market';
import { MARKETS } from '../data/markets';
import { formatPrice } from '../utils/technicalIndicators';
import { getMarketSchedule, isMarketCurrentlyOpen, SessionMode } from '../utils/marketHours';
import { Search, TrendingUp, TrendingDown, Zap, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MarketSelectorProps {
  selectedMarket: MarketInstrument;
  onSelectMarket: (market: MarketInstrument) => void;
  marketPrices: Record<string, { price: number; change: number; changePercent: number }>;
  language: 'kn' | 'en';
  sessionMode?: SessionMode;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  selectedMarket,
  onSelectMarket,
  marketPrices,
  language,
  sessionMode = 'SMART_LIVE'
}) => {
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('smart-live');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isMarketOpenNow = (m: MarketInstrument) => {
    return getMarketSchedule(m, sessionMode).status === 'OPEN';
  };

  const categories: { id: MarketCategory; labelEn: string; labelKn: string }[] = [
    { id: 'smart-live', labelEn: '⚡ Smart Live (Started Only)', labelKn: '⚡ ಸ್ಮಾರ್ಟ್ ಲೈವ್ (ಸಕ್ರಿಯ ಮಾತ್ರ)' },
    { id: 'all', labelEn: 'All Markets', labelKn: 'ಎಲ್ಲಾ ಮಾರ್ಕೆಟ್' },
    { id: 'indian', labelEn: 'Indian NSE/BSE', labelKn: 'ಭಾರತೀಯ (NSE/BSE)' },
    { id: 'crypto', labelEn: 'Crypto (24/7)', labelKn: 'ಕ್ರಿಪ್ಟೋ (೨೪/೭)' },
    { id: 'forex', labelEn: 'Forex FX', labelKn: 'ಫಾರೆಕ್ಸ್' },
    { id: 'commodities', labelEn: 'Commodities', labelKn: 'ಕಮಾಡಿಟಿಗಳು' },
  ];

  // Filter logic: In 'smart-live', strictly include ONLY markets that are currently STARTED / OPEN
  const filteredMarkets = MARKETS.filter((m) => {
    if (activeCategory === 'smart-live') {
      if (!isMarketOpenNow(m)) return false;
    } else if (activeCategory !== 'all') {
      if (m.category !== activeCategory) return false;
    }

    const query = searchQuery.toLowerCase().trim();
    return (
      query === '' ||
      m.symbol.toLowerCase().includes(query) ||
      m.name.toLowerCase().includes(query) ||
      m.kannadaName.toLowerCase().includes(query)
    );
  });

  // When 'smart-live' is selected, if current selected market is closed, switch immediately to first started market
  useEffect(() => {
    if (activeCategory === 'smart-live' && !isMarketOpenNow(selectedMarket)) {
      const firstOpen = MARKETS.find((m) => isMarketOpenNow(m));
      if (firstOpen) {
        onSelectMarket(firstOpen);
      }
    }
  }, [activeCategory, selectedMarket, sessionMode, onSelectMarket]);

  const activeStartedCount = MARKETS.filter((m) => isMarketOpenNow(m)).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      {/* Search and Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSmartLive = cat.id === 'smart-live';
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? isSmartLive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400'
                      : 'bg-blue-600 text-white shadow'
                    : isSmartLive
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/70'
                }`}
              >
                {isSmartLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
                <span>{language === 'kn' ? cat.labelKn : cat.labelEn}</span>
                {isSmartLive && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200">
                    {activeStartedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeCategory === 'smart-live'
                ? language === 'kn'
                  ? 'ಸಕ್ರಿಯ ಮಾರ್ಕೆಟ್ ಹುಡುಕಿ...'
                  : 'Search started live markets...'
                : language === 'kn'
                ? 'ಮಾರ್ಕೆಟ್ ಹುಡುಕಿ (Nifty, BTC, Gold)...'
                : 'Search markets...'
            }
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Smart Live Banner Notice */}
      {activeCategory === 'smart-live' && (
        <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {language === 'kn'
                ? `ಸ್ಮಾರ್ಟ್ ಲೈವ್ ಮೋಡ್: ಪ್ರಸ್ತುತ ಚಾಲ್ತಿಯಲ್ಲಿರುವ (${activeStartedCount}) ಮಾರುಕಟ್ಟೆಗಳು ಮಾತ್ರ ಪ್ರದರ್ಶನಗೊಳ್ಳುತ್ತಿವೆ.`
                : `Smart Live Mode: Only actively running sessions (${activeStartedCount} open markets) are shown.`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {language === 'kn' ? 'ಕ್ಲೋಸ್ ಆದ ಮಾರ್ಕೆಟ್‌ಗಳು ಫಿಲ್ಟರ್ ಆಗಿವೆ' : 'Closed markets filtered out'}
          </span>
        </div>
      )}

      {/* Horizontal Market Cards Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-[170px] overflow-y-auto scrollbar-thin">
        {filteredMarkets.map((m) => {
          const isSelected = selectedMarket.id === m.id;
          const isOpen = isMarketOpenNow(m);
          const liveData = marketPrices[m.id] || {
            price: m.basePrice,
            change: 0,
            changePercent: 0
          };
          const isPositive = liveData.change >= 0;

          return (
            <button
              key={m.id}
              onClick={() => onSelectMarket(m)}
              className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                      title={isOpen ? 'Market Session Open / Live' : 'Market Closed / Stop Hold'}
                    />
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {m.symbol}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 rounded uppercase font-bold shrink-0 ${
                      isOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isOpen ? 'START' : 'HOLD'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {language === 'kn' ? m.kannadaName : m.name}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">
                  {m.currency}{formatPrice(liveData.price, m.decimals)}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {isPositive ? '+' : ''}{liveData.changePercent}%
                </span>
              </div>
            </button>
          );
        })}

        {filteredMarkets.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-slate-400 font-mono">
            {language === 'kn'
              ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಮಾರುಕಟ್ಟೆ ಚಾಲ್ತಿಯಲ್ಲಿಲ್ಲ ಅಥವಾ ಹುಡುಕಾಟಕ್ಕೆ ಫಲಿತಾಂಶವಿಲ್ಲ.'
              : 'No active markets found matching your criteria.'}
          </div>
        )}
      </div>
    </div>
  );
};
