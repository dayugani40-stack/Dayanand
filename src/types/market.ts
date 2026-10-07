export type MarketCategory = 'all' | 'smart-live' | 'indian' | 'crypto' | 'forex' | 'commodities';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type TrendDirection = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';

export type SignalType = 'BUY' | 'SELL' | 'WAIT';

export type ParticularEntryType = 'CALL_CE' | 'PUT_PE' | 'WAIT_NO_ENTRY';

export interface MarketInstrument {
  id: string;
  symbol: string;
  name: string;
  kannadaName: string;
  category: 'indian' | 'crypto' | 'forex' | 'commodities';
  currency: string;
  basePrice: number;
  tickSize: number;
  lotSize: number;
  decimals: number;
  exchange: string;
  description: string;
  kannadaDescription: string;
}

export interface Candle {
  timestamp: number;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  vwap?: number;
  rsi?: number;
  supertrend?: {
    value: number;
    direction: 'UP' | 'DOWN';
  };
}

export interface FiveMinuteConfirmation {
  verdict: 'CONFIRMED_UPSIDE' | 'CONFIRMED_DOWNSIDE' | 'WAIT_CONFIRMATION';
  score: number; // 0 to 6
  maxScore: number;
  percent: number;
  checks: {
    emaCross: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
    aboveVwap: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
    rsiMomentum: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
    volumeSurge: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
    priceAction: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
    supertrend: { status: boolean; label: string; labelKn: string; detail: string; detailKn: string };
  };
  summaryKn: string;
  summaryEn: string;
  nextCandleTimeRemaining: number; // seconds
}

export interface DetailedPlan {
  action: 'BUY' | 'SELL';
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  stopLossPts: number;
  target1: number;
  target1Pts: number;
  target2: number;
  target2Pts: number;
  target3: number;
  target3Pts: number;
  riskReward: string;
  conditionEn: string;
  conditionKn: string;
  exitWhenEn: string;
  exitWhenKn: string;
  confidence: number;
}

export interface TradeSignal {
  id: string;
  marketId: string;
  symbol: string;
  action: SignalType;
  direction: 'UPSIDE' | 'DOWNSIDE' | 'NEUTRAL';
  entryPrice: number;
  entryZone: string;
  entryConditionEn: string;
  entryConditionKn: string;
  stopLoss: number;
  stopLossPts: number;
  target1: number; // Safe Exit
  target1Pts: number;
  target2: number; // Main Target
  target2Pts: number;
  target3: number; // Runner
  target3Pts: number;
  riskReward: string;
  exitWhenEn: string;
  exitWhenKn: string;
  confidence: number;
  timeframe: string;
  timestamp: number;
  isTriggered: boolean;
  particularEntry: ParticularEntryType;
  particularVerdictKn: string;
  particularVerdictEn: string;
  entryReasonKn: string;
  entryReasonEn: string;
  strikeRecommendation?: string;
  buyPlan?: DetailedPlan;
  sellPlan?: DetailedPlan;
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  trend: TrendDirection;
  rsi: number;
  macdStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  emaAlignment: 'BULLISH' | 'BEARISH' | 'MIXED';
  support: number;
  resistance: number;
}

export type MarketSessionStatus = 'OPEN' | 'CLOSED' | 'HOLD';

export interface LiveMarketState {
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  prevClose: number;
  vwap: number;
  volume: number;
  trend: TrendDirection;
  upsideProbability: number;
  downsideProbability: number;
  buyersPercent: number;
  sellersPercent: number;
  sessionStatus?: MarketSessionStatus;
  lastTickDirection?: 'UP' | 'DOWN' | 'EQUAL';
  lastTickTimestamp?: number;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  marketName: string;
  category: 'indian' | 'crypto' | 'forex' | 'commodities';
  currency: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  target1: number;
  target2: number;
  maxRiskAmount: number;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
  closeReason?: string;
  timestamp: number;
}
