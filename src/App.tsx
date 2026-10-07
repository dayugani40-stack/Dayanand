import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MARKETS } from './data/markets';
import { Candle, FiveMinuteConfirmation, LiveMarketState, MarketInstrument, PaperPosition, Timeframe, TradeSignal } from './types/market';
import {
  generateCandles,
  deriveLiveMarketState,
  evaluate5MinuteConfirmation,
  generateTradeSignal,
  formatPrice
} from './utils/technicalIndicators';
import { getMarketSchedule, isMarketCurrentlyOpen, SessionMode } from './utils/marketHours';
import { Header } from './components/Header';
import { MarketSelector } from './components/MarketSelector';
import { LiveTrendOverview } from './components/LiveTrendOverview';
import { FiveMinuteConfirmationPanel } from './components/FiveMinuteConfirmation';
import { TradingSignalsCard } from './components/TradingSignalsCard';
import { RiskDashboard } from './components/RiskDashboard';
import { InteractiveChart } from './components/InteractiveChart';
import { MultiTimeframeMatrix } from './components/MultiTimeframeMatrix';
import { AiMarketAnalystModal } from './components/AiMarketAnalystModal';

// Audio chime using standard Web Audio API
function playAlertChime(type: 'BUY' | 'SELL') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type === 'BUY' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(type === 'BUY' ? 587.33 : 349.23, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === 'BUY' ? 880 : 220, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio context may require user interaction
  }
}

export default function App() {
  const [language, setLanguage] = useState<'kn' | 'en'>('kn');
  const initialMarket = MARKETS.find(m => isMarketCurrentlyOpen(m)) || MARKETS[0];
  const [selectedMarket, setSelectedMarket] = useState<MarketInstrument>(initialMarket);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [sessionMode, setSessionMode] = useState<SessionMode>('SMART_LIVE');
  const [audioAlerts, setAudioAlerts] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Auto-switch to started live market when SMART_LIVE is active and current market is closed
  useEffect(() => {
    if (sessionMode === 'SMART_LIVE' && !isMarketCurrentlyOpen(selectedMarket)) {
      const openMarket = MARKETS.find(m => isMarketCurrentlyOpen(m));
      if (openMarket) {
        setSelectedMarket(openMarket);
      }
    }
  }, [sessionMode, selectedMarket]);

  // Candles and Technical states
  const [candles, setCandles] = useState<Candle[]>([]);
  const [marketState, setMarketState] = useState<LiveMarketState>(() =>
    deriveLiveMarketState(MARKETS[0], [])
  );
  const [confirmation, setConfirmation] = useState<FiveMinuteConfirmation>(() =>
    evaluate5MinuteConfirmation([], MARKETS[0])
  );
  const [signal, setSignal] = useState<TradeSignal>(() =>
    generateTradeSignal(MARKETS[0], [], confirmation, marketState)
  );

  // Compute current session schedule based on market & mode
  const scheduleInfo = getMarketSchedule(selectedMarket, sessionMode);
  const isMarketOpen = scheduleInfo.status === 'OPEN';

  // All markets price tracking for selector
  const [allMarketPrices, setAllMarketPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>(() => {
    const initial: Record<string, { price: number; change: number; changePercent: number }> = {};
    for (const m of MARKETS) {
      initial[m.id] = {
        price: m.basePrice,
        change: Number((m.basePrice * 0.004).toFixed(m.decimals)),
        changePercent: 0.40
      };
    }
    return initial;
  });

  // Paper positions with initial diverse multi-market basket
  const [positions, setPositions] = useState<PaperPosition[]>(() => [
    {
      id: 'init-nifty',
      symbol: 'NIFTY 50',
      marketName: 'Nifty 50 Index',
      category: 'indian',
      currency: '₹',
      type: 'BUY',
      entryPrice: 24840.00,
      currentPrice: 24865.50,
      quantity: 50,
      stopLoss: 24780.00,
      target1: 24920.00,
      target2: 24980.00,
      maxRiskAmount: 3000,
      pnl: 1275,
      pnlPercent: 0.10,
      status: 'OPEN',
      timestamp: Date.now() - 360000
    },
    {
      id: 'init-btc',
      symbol: 'BTC/USDT',
      marketName: 'Bitcoin',
      category: 'crypto',
      currency: '$',
      type: 'BUY',
      entryPrice: 67620.00,
      currentPrice: 67880.00,
      quantity: 0.05,
      stopLoss: 66900.00,
      target1: 68500.00,
      target2: 69200.00,
      maxRiskAmount: 3000,
      pnl: 1083,
      pnlPercent: 0.38,
      status: 'OPEN',
      timestamp: Date.now() - 600000
    },
    {
      id: 'init-gold',
      symbol: 'GOLD (XAU/USD)',
      marketName: 'Gold Spot / MCX Gold',
      category: 'commodities',
      currency: '$',
      type: 'BUY',
      entryPrice: 2638.20,
      currentPrice: 2643.80,
      quantity: 5,
      stopLoss: 2625.00,
      target1: 2655.00,
      target2: 2670.00,
      maxRiskAmount: 5500,
      pnl: 2333,
      pnlPercent: 0.21,
      status: 'OPEN',
      timestamp: Date.now() - 720000
    },
    {
      id: 'init-eur',
      symbol: 'EUR/USD',
      marketName: 'Euro / US Dollar',
      category: 'forex',
      currency: '',
      type: 'SELL',
      entryPrice: 1.0855,
      currentPrice: 1.0842,
      quantity: 20000,
      stopLoss: 1.0880,
      target1: 1.0820,
      target2: 1.0790,
      maxRiskAmount: 4100,
      pnl: 2166,
      pnlPercent: 0.12,
      status: 'OPEN',
      timestamp: Date.now() - 900000
    }
  ]);

  // Ref to hold current state for interval updates
  const stateRef = useRef({
    candles,
    selectedMarket,
    timeframe,
    marketState,
    confirmation,
    signal,
    audioAlerts,
    sessionMode
  });

  useEffect(() => {
    stateRef.current = {
      candles,
      selectedMarket,
      timeframe,
      marketState,
      confirmation,
      signal,
      audioAlerts,
      sessionMode
    };
  });

  // Initialize or re-initialize candles on market or timeframe switch
  const loadMarketData = useCallback((market: MarketInstrument, tf: Timeframe) => {
    const initialCandles = generateCandles(market, tf, 50);
    const derivedState = deriveLiveMarketState(market, initialCandles);
    const conf = evaluate5MinuteConfirmation(initialCandles, market);
    const sig = generateTradeSignal(market, initialCandles, conf, derivedState);

    setCandles(initialCandles);
    setMarketState(derivedState);
    setConfirmation(conf);
    setSignal(sig);
  }, []);

  useEffect(() => {
    loadMarketData(selectedMarket, timeframe);
  }, [selectedMarket, timeframe, loadMarketData]);

  // Live real-time tick loop (every 1.5 seconds)
  // ACTIVE ONLY WHEN MARKET IS OPEN; STOPS AND HOLDS WHEN CLOSED/HOLD!
  useEffect(() => {
    const interval = setInterval(() => {
      const {
        selectedMarket: curMarket,
        candles: curCandles,
        audioAlerts: curAudio,
        signal: curSignal,
        sessionMode: curMode
      } = stateRef.current;

      if (curCandles.length === 0) return;

      // Evaluate whether the current market is actively OPEN or on STOP/HOLD
      const curSchedule = getMarketSchedule(curMarket, curMode);
      if (curSchedule.status !== 'OPEN') {
        // Market is CLOSED or STOPPED HOLD: do not generate ticks!
        return;
      }

      // Market is START/OPEN: actively analyze and stream ticks!
      const lastCandle = curCandles[curCandles.length - 1];
      const volMultiplier = curMarket.basePrice * 0.0003;
      const tickDelta = (Math.random() - 0.48) * volMultiplier;
      const newClose = Number((lastCandle.close + tickDelta).toFixed(curMarket.decimals));
      const newHigh = Number(Math.max(lastCandle.high, newClose).toFixed(curMarket.decimals));
      const newLow = Number(Math.min(lastCandle.low, newClose).toFixed(curMarket.decimals));
      const newVol = lastCandle.volume + Math.floor(Math.random() * 80 + 10);
      const lastTickDirection: 'UP' | 'DOWN' = tickDelta >= 0 ? 'UP' : 'DOWN';

      const updatedCandles = [...curCandles];
      updatedCandles[updatedCandles.length - 1] = {
        ...lastCandle,
        high: newHigh,
        low: newLow,
        close: newClose,
        volume: newVol
      };

      const updatedState = {
        ...deriveLiveMarketState(curMarket, updatedCandles),
        lastTickDirection,
        lastTickTimestamp: Date.now(),
        sessionStatus: 'OPEN' as const
      };
      const updatedConf = evaluate5MinuteConfirmation(updatedCandles, curMarket);
      const updatedSignal = generateTradeSignal(curMarket, updatedCandles, updatedConf, updatedState);

      // Play alert sound if signal flipped from WAIT to BUY/SELL
      if (curAudio && curSignal.action !== updatedSignal.action && updatedSignal.action !== 'WAIT') {
        playAlertChime(updatedSignal.action);
      }

      setCandles(updatedCandles);
      setMarketState(updatedState);
      setConfirmation(updatedConf);
      setSignal(updatedSignal);

      // Also update selected market in the full market selector tracker
      setAllMarketPrices(prev => ({
        ...prev,
        [curMarket.id]: {
          price: updatedState.currentPrice,
          change: updatedState.change,
          changePercent: updatedState.changePercent
        }
      }));

      // Update paper positions P&L and trigger targets across all open positions
      setPositions(prev =>
        prev.map(pos => {
          if (pos.status !== 'OPEN') return pos;

          let posCurrentPrice = pos.currentPrice;
          if (pos.marketName === curMarket.name) {
            posCurrentPrice = newClose;
          } else {
            const microJitter = (Math.random() - 0.49) * (pos.currentPrice * 0.0002);
            posCurrentPrice = Number((pos.currentPrice + microJitter).toFixed(2));
          }

          const diff = pos.type === 'BUY'
            ? posCurrentPrice - pos.entryPrice
            : pos.entryPrice - posCurrentPrice;

          const fxRate = pos.currency === '$' ? 83.5 : 1;
          const pnl = Number((diff * pos.quantity * fxRate).toFixed(2));
          const pnlPercent = Number(((diff / pos.entryPrice) * 100).toFixed(2));

          // Check if Target reached
          if (pos.type === 'BUY' && posCurrentPrice >= pos.target2) {
            return { ...pos, currentPrice: posCurrentPrice, pnl, pnlPercent, status: 'CLOSED', closeReason: 'Target 2 Reached' };
          }
          if (pos.type === 'BUY' && posCurrentPrice <= pos.stopLoss) {
            return { ...pos, currentPrice: posCurrentPrice, pnl, pnlPercent, status: 'CLOSED', closeReason: 'Stop Loss Hit' };
          }
          if (pos.type === 'SELL' && posCurrentPrice <= pos.target2) {
            return { ...pos, currentPrice: posCurrentPrice, pnl, pnlPercent, status: 'CLOSED', closeReason: 'Target 2 Reached' };
          }
          if (pos.type === 'SELL' && posCurrentPrice >= pos.stopLoss) {
            return { ...pos, currentPrice: posCurrentPrice, pnl, pnlPercent, status: 'CLOSED', closeReason: 'Stop Loss Hit' };
          }

          return { ...pos, currentPrice: posCurrentPrice, pnl, pnlPercent };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Execute Paper Trade
  const handleExecutePaperTrade = (type: 'BUY' | 'SELL') => {
    const plan = type === 'SELL'
      ? (signal.sellPlan || {
          entryPrice: Number((marketState.currentPrice - selectedMarket.tickSize).toFixed(selectedMarket.decimals)),
          stopLoss: Number((marketState.currentPrice + signal.stopLossPts).toFixed(selectedMarket.decimals)),
          target1: Number((marketState.currentPrice - signal.target1Pts).toFixed(selectedMarket.decimals)),
          target2: Number((marketState.currentPrice - signal.target2Pts).toFixed(selectedMarket.decimals)),
        })
      : (signal.buyPlan || {
          entryPrice: Number((marketState.currentPrice + selectedMarket.tickSize).toFixed(selectedMarket.decimals)),
          stopLoss: Number((marketState.currentPrice - signal.stopLossPts).toFixed(selectedMarket.decimals)),
          target1: Number((marketState.currentPrice + signal.target1Pts).toFixed(selectedMarket.decimals)),
          target2: Number((marketState.currentPrice + signal.target2Pts).toFixed(selectedMarket.decimals)),
        });

    const riskPts = Math.abs(plan.entryPrice - plan.stopLoss);
    const fxRate = selectedMarket.currency === '$' ? 83.5 : 1;
    const maxRiskAmount = Math.round(riskPts * selectedMarket.lotSize * fxRate);

    const newPos: PaperPosition = {
      id: `pos-${Date.now()}`,
      symbol: selectedMarket.symbol,
      marketName: selectedMarket.name,
      category: selectedMarket.category,
      currency: selectedMarket.currency,
      type,
      entryPrice: plan.entryPrice,
      currentPrice: marketState.currentPrice,
      quantity: selectedMarket.lotSize,
      stopLoss: plan.stopLoss,
      target1: plan.target1,
      target2: plan.target2,
      maxRiskAmount,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
      timestamp: Date.now()
    };
    setPositions(p => [newPos, ...p]);
    if (audioAlerts) playAlertChime(type);
  };

  const handleClosePosition = (id: string, reason: string) => {
    setPositions(p =>
      p.map(pos => (pos.id === id ? { ...pos, status: 'CLOSED', closeReason: reason } : pos))
    );
  };

  const handleCloseAllPositions = () => {
    setPositions(p =>
      p.map(pos => (pos.status === 'OPEN' ? { ...pos, status: 'CLOSED', closeReason: 'Panic Close All' } : pos))
    );
  };

  const handleSeedSamplePositions = () => {
    const seed: PaperPosition[] = [
      {
        id: `seed-nifty-${Date.now()}`,
        symbol: 'NIFTY 50',
        marketName: 'Nifty 50 Index',
        category: 'indian',
        currency: '₹',
        type: 'BUY',
        entryPrice: 24845.00,
        currentPrice: 24872.50,
        quantity: 50,
        stopLoss: 24785.00,
        target1: 24930.00,
        target2: 24990.00,
        maxRiskAmount: 3000,
        pnl: 1375,
        pnlPercent: 0.11,
        status: 'OPEN',
        timestamp: Date.now()
      },
      {
        id: `seed-btc-${Date.now()}`,
        symbol: 'BTC/USDT',
        marketName: 'Bitcoin',
        category: 'crypto',
        currency: '$',
        type: 'BUY',
        entryPrice: 67650.00,
        currentPrice: 67895.00,
        quantity: 0.05,
        stopLoss: 66950.00,
        target1: 68600.00,
        target2: 69300.00,
        maxRiskAmount: 2922,
        pnl: 1022,
        pnlPercent: 0.36,
        status: 'OPEN',
        timestamp: Date.now()
      },
      {
        id: `seed-gold-${Date.now()}`,
        symbol: 'GOLD (XAU/USD)',
        marketName: 'Gold Spot / MCX Gold',
        category: 'commodities',
        currency: '$',
        type: 'BUY',
        entryPrice: 2639.50,
        currentPrice: 2644.20,
        quantity: 5,
        stopLoss: 2626.00,
        target1: 2656.00,
        target2: 2672.00,
        maxRiskAmount: 5636,
        pnl: 1962,
        pnlPercent: 0.18,
        status: 'OPEN',
        timestamp: Date.now()
      },
      {
        id: `seed-eur-${Date.now()}`,
        symbol: 'EUR/USD',
        marketName: 'Euro / US Dollar',
        category: 'forex',
        currency: '',
        type: 'SELL',
        entryPrice: 1.0852,
        currentPrice: 1.0841,
        quantity: 20000,
        stopLoss: 1.0878,
        target1: 1.0818,
        target2: 1.0788,
        maxRiskAmount: 4342,
        pnl: 1837,
        pnlPercent: 0.10,
        status: 'OPEN',
        timestamp: Date.now()
      }
    ];
    setPositions(seed);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header with START LIVE / STOP HOLD session switcher */}
      <Header
        language={language}
        onToggleLanguage={() => setLanguage(l => (l === 'kn' ? 'en' : 'kn'))}
        audioAlerts={audioAlerts}
        onToggleAudio={() => setAudioAlerts(a => !a)}
        onRefreshData={() => loadMarketData(selectedMarket, timeframe)}
        sessionMode={sessionMode}
        onSetSessionMode={setSessionMode}
        sessionStatus={scheduleInfo.status}
      />

      {/* Main Trading Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-5">
        {/* Market Selector & Switcher */}
        <MarketSelector
          selectedMarket={selectedMarket}
          onSelectMarket={(m) => {
            setSelectedMarket(m);
            loadMarketData(m, timeframe);
          }}
          marketPrices={allMarketPrices}
          language={language}
          sessionMode={sessionMode}
        />

        {/* Live Day Trend Overview (Upside vs Downside, Volume, Key Levels, Session Notice) */}
        <LiveTrendOverview
          market={selectedMarket}
          state={marketState}
          scheduleInfo={scheduleInfo}
          language={language}
        />

        {/* 5-Minute Directional Confirmation Engine */}
        <FiveMinuteConfirmationPanel
          confirmation={confirmation}
          market={selectedMarket}
          isMarketOpen={isMarketOpen}
          language={language}
        />

        {/* Actionable Live Trade Signals (Buy / Sell / Exit) */}
        <TradingSignalsCard
          signal={signal}
          market={selectedMarket}
          state={marketState}
          isMarketOpen={isMarketOpen}
          language={language}
          onExecutePaperTrade={handleExecutePaperTrade}
          onOpenAiAnalysis={() => setIsAiModalOpen(true)}
        />

        {/* Dedicated Risk Dashboard: Total P&L & Multi-Category Risk Exposure Summary */}
        <RiskDashboard
          positions={positions}
          onClosePosition={handleClosePosition}
          onCloseAllPositions={handleCloseAllPositions}
          onSeedSamplePositions={handleSeedSamplePositions}
          language={language}
        />

        {/* Candlestick & Technical Chart */}
        <InteractiveChart
          candles={candles}
          market={selectedMarket}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          signal={signal}
          language={language}
        />

        {/* Multi-Timeframe Alignment Matrix (1m to 1D) */}
        <MultiTimeframeMatrix
          market={selectedMarket}
          currentPrice={marketState.currentPrice}
          selectedTimeframe={timeframe}
          onSelectTimeframe={setTimeframe}
          language={language}
        />
      </main>

      {/* Gemini AI Market Analyst Modal */}
      <AiMarketAnalystModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        market={selectedMarket}
        marketState={marketState}
        confirmation={confirmation}
        timeframe={timeframe}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        {language === 'kn'
          ? 'ಮಾರ್ಕೆಟ್‌ಸಿಗ್ನಲ್ ಪ್ರೊ · ಶೈಕ್ಷಣಿಕ ಮತ್ತು ಲೈವ್ ವಿಶ್ಲೇಷಣೆ ಉದ್ದೇಶಕ್ಕಾಗಿ ಮಾತ್ರ · ರಿಸ್ಕ್ ಮ್ಯಾನೇಜ್ಮೆಂಟ್ ಮತ್ತು ಸ್ಟಾಪ್ ಲಾಸ್ ಕಡ್ಡಾಯ'
          : 'MarketSignal Pro · Built for multi-market intraday analysis · Strict Stop Loss & Risk Management Advised'}
      </footer>
    </div>
  );
}
