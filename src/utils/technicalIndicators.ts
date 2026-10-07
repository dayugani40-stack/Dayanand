import { Candle, DetailedPlan, FiveMinuteConfirmation, LiveMarketState, MarketInstrument, Timeframe, TradeSignal } from '../types/market';

// Format price with proper decimals
export function formatPrice(price: number, decimals: number = 2): string {
  if (isNaN(price)) return '0.00';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Generate realistic initial candlestick series for a market and timeframe
export function generateCandles(market: MarketInstrument, timeframe: Timeframe, count: number = 60): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  
  const tfMinutesMap: Record<Timeframe, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1D': 1440
  };
  const stepMs = tfMinutesMap[timeframe] * 60 * 1000;
  
  // Market specific volatility factor
  const volFactor = market.basePrice * 0.0018;

  // Natural market bias: Symmetrically distribute upside and downside across instruments!
  // Certain markets like Bank Nifty, Crude Oil, Tata Motors, EUR/USD have active Downside / Pullback structures!
  const downsideMarkets = ['bank-nifty', 'crude-oil', 'eur-usd', 'tata-motors', 'natural-gas', 'sol-usdt'];
  const isDownsideBiased = downsideMarkets.includes(market.id);
  const bias = isDownsideBiased ? -0.00035 : 0.00030;

  let currentPrice = market.basePrice * (1 - (count * bias));
  let cumulativeVolume = 0;
  let cumulativePv = 0;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - (i * stepMs);
    const date = new Date(timestamp);
    const timeStr = timeframe === '1D' 
      ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Brownian motion with momentum waves
    const cycle = Math.sin(i / 5) * volFactor * (isDownsideBiased ? -1.5 : 1.5);
    const randomStep = (Math.random() - (isDownsideBiased ? 0.52 : 0.48)) * volFactor * 2 + cycle * 0.3;
    
    const open = Number((currentPrice).toFixed(market.decimals));
    const close = Number((currentPrice + randomStep).toFixed(market.decimals));
    const high = Number((Math.max(open, close) + Math.random() * volFactor).toFixed(market.decimals));
    const low = Number((Math.min(open, close) - Math.random() * volFactor).toFixed(market.decimals));
    const volume = Math.floor(1000 + Math.random() * 4500 * (market.lotSize > 50 ? 5 : 1));

    const typicalPrice = (high + low + close) / 3;
    cumulativeVolume += volume;
    cumulativePv += typicalPrice * volume;
    const vwap = Number((cumulativePv / cumulativeVolume).toFixed(market.decimals));

    candles.push({
      timestamp,
      timeStr,
      open,
      high,
      low,
      close,
      volume,
      vwap
    });

    currentPrice = close;
  }

  // Calculate EMA 9, 21, 50
  calculateEMAs(candles);
  // Calculate RSI 14
  calculateRSI(candles, 14);
  // Calculate SuperTrend
  calculateSupertrend(candles);

  return candles;
}

// Calculate Exponential Moving Averages
function calculateEMAs(candles: Candle[]) {
  const calcSingleEma = (period: number, key: 'ema9' | 'ema21' | 'ema50') => {
    const k = 2 / (period + 1);
    let ema = candles[0]?.close || 0;
    for (let i = 0; i < candles.length; i++) {
      if (i < period) {
        let sum = 0;
        for (let j = 0; j <= i; j++) sum += candles[j].close;
        ema = sum / (i + 1);
      } else {
        ema = candles[i].close * k + ema * (1 - k);
      }
      candles[i][key] = Number(ema.toFixed(2));
    }
  };

  calcSingleEma(9, 'ema9');
  calcSingleEma(21, 'ema21');
  calcSingleEma(50, 'ema50');
}

// Calculate Relative Strength Index
function calculateRSI(candles: Candle[], period: number = 14) {
  if (candles.length < period) return;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  candles[period].rsi = avgLoss === 0 ? 100 : Number((100 - (100 / (1 + avgGain / avgLoss))).toFixed(1));

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      candles[i].rsi = 100;
    } else {
      const rs = avgGain / avgLoss;
      candles[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(1));
    }
  }
}

// Calculate Supertrend (Simplified ATR 10, Multiplier 3)
function calculateSupertrend(candles: Candle[], period: number = 10, multiplier: number = 3) {
  let prevUpper = 0;
  let prevLower = 0;
  let inUptrend = true;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const prevC = i > 0 ? candles[i - 1] : c;
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prevC.close),
      Math.abs(c.low - prevC.close)
    );
    const hl2 = (c.high + c.low) / 2;
    const basicUpper = hl2 + multiplier * tr;
    const basicLower = hl2 - multiplier * tr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > 0) {
      finalUpper = basicUpper < prevUpper || prevC.close > prevUpper ? basicUpper : prevUpper;
      finalLower = basicLower > prevLower || prevC.close < prevLower ? basicLower : prevLower;
    }

    if (i > 0) {
      if (inUptrend && c.close < finalLower) {
        inUptrend = false;
      } else if (!inUptrend && c.close > finalUpper) {
        inUptrend = true;
      }
    }

    c.supertrend = {
      value: Number((inUptrend ? finalLower : finalUpper).toFixed(2)),
      direction: inUptrend ? 'UP' : 'DOWN'
    };

    prevUpper = finalUpper;
    prevLower = finalLower;
  }
}

// Derive Live Day State & Overall Trend
export function deriveLiveMarketState(market: MarketInstrument, candles: Candle[]): LiveMarketState {
  if (candles.length === 0) {
    return {
      currentPrice: market.basePrice,
      change: 0,
      changePercent: 0,
      dayHigh: market.basePrice * 1.01,
      dayLow: market.basePrice * 0.99,
      open: market.basePrice,
      prevClose: market.basePrice,
      vwap: market.basePrice,
      volume: 120000,
      trend: 'NEUTRAL',
      upsideProbability: 50,
      downsideProbability: 50,
      buyersPercent: 50,
      sellersPercent: 50
    };
  }

  const latest = candles[candles.length - 1];
  const first = candles[0];
  const currentPrice = latest.close;
  const prevClose = first.open;
  const change = Number((currentPrice - prevClose).toFixed(market.decimals));
  const changePercent = Number(((change / prevClose) * 100).toFixed(2));

  let dayHigh = -Infinity;
  let dayLow = Infinity;
  let totalVolume = 0;

  for (const c of candles) {
    if (c.high > dayHigh) dayHigh = c.high;
    if (c.low < dayLow) dayLow = c.low;
    totalVolume += c.volume;
  }

  const vwap = latest.vwap || currentPrice;
  const ema9 = latest.ema9 || currentPrice;
  const ema21 = latest.ema21 || currentPrice;
  const rsi = latest.rsi || 50;

  // Multi-factor trend calculation
  let bullPoints = 0;
  let bearPoints = 0;

  if (changePercent > 0.2) bullPoints += 2;
  else if (changePercent < -0.2) bearPoints += 2;

  if (currentPrice > vwap) bullPoints += 2;
  else bearPoints += 2;

  if (ema9 > ema21) bullPoints += 2;
  else bearPoints += 2;

  if (rsi > 54) bullPoints += 1.5;
  else if (rsi < 46) bearPoints += 1.5;

  if (latest.supertrend?.direction === 'UP') bullPoints += 1.5;
  else bearPoints += 1.5;

  const totalPoints = bullPoints + bearPoints || 1;
  const upsideProb = Math.min(95, Math.max(15, Math.round((bullPoints / totalPoints) * 100)));
  const downsideProb = 100 - upsideProb;

  let trend: LiveMarketState['trend'] = 'NEUTRAL';
  if (upsideProb >= 70) trend = 'STRONG_BULLISH';
  else if (upsideProb >= 53) trend = 'BULLISH';
  else if (downsideProb >= 70) trend = 'STRONG_BEARISH';
  else if (downsideProb >= 53) trend = 'BEARISH';

  return {
    currentPrice,
    change,
    changePercent,
    dayHigh: Number(dayHigh.toFixed(market.decimals)),
    dayLow: Number(dayLow.toFixed(market.decimals)),
    open: Number(first.open.toFixed(market.decimals)),
    prevClose: Number(prevClose.toFixed(market.decimals)),
    vwap: Number(vwap.toFixed(market.decimals)),
    volume: totalVolume,
    trend,
    upsideProbability: upsideProb,
    downsideProbability: downsideProb,
    buyersPercent: upsideProb,
    sellersPercent: downsideProb
  };
}

// Derive 5-Minute Confirmation Checklist & Verdict (Supports Symmetrical Upside AND Downside!)
export function evaluate5MinuteConfirmation(candles: Candle[], market: MarketInstrument): FiveMinuteConfirmation {
  if (candles.length < 5) {
    return {
      verdict: 'WAIT_CONFIRMATION',
      score: 3,
      maxScore: 6,
      percent: 50,
      checks: {
        emaCross: { status: true, label: 'EMA 9/21 Alignment', labelKn: 'EMA 9/21 ಹೊಂದಾಣಿಕೆ', detail: 'EMA alignment active', detailKn: 'EMA ಹೊಂದಾಣಿಕೆ ಇದೆ' },
        aboveVwap: { status: true, label: 'VWAP Level Position', labelKn: 'VWAP ಮಟ್ಟದ ಸ್ಥಾನ', detail: 'Holding near VWAP', detailKn: 'VWAP ಹತ್ತಿರ ಟ್ರೇಡ್ ಆಗುತ್ತಿದೆ' },
        rsiMomentum: { status: false, label: '5M RSI Trend Zone', labelKn: '5M RSI ಟ್ರೆಂಡ್ ವಲಯ', detail: 'RSI at 50', detailKn: 'RSI 50 ರಷ್ಟಿದೆ' },
        volumeSurge: { status: true, label: 'Volume Confirmation', labelKn: 'ವಾಲ್ಯೂಮ್ ದೃಢೀಕರಣ', detail: 'Normal Volume', detailKn: 'ವಾಲ್ಯೂಮ್ ಸಾಧಾರಣ' },
        priceAction: { status: true, label: '5M Price Action', labelKn: '5M ಪ್ರೈಸ್ ಆಕ್ಷನ್', detail: 'Price testing levels', detailKn: 'ಪ್ರೈಸ್ ಲೆವೆಲ್ ಪರೀಕ್ಷೆ' },
        supertrend: { status: true, label: 'Supertrend Alignment', labelKn: 'ಸೂಪರ್‌ಟ್ರೆಂಡ್ ದಿಕ್ಕು', detail: 'Neutral', detailKn: 'ನ್ಯೂಟ್ರಲ್' },
      },
      summaryKn: 'ಮುಂದಿನ 5M ಕ್ಯಾಂಡಲ್ ಬ್ರೇಕ್‌ಔಟ್‌ಗೆ ಕಾಯಿರಿ.',
      summaryEn: 'Awaiting 5M candle breakout.',
      nextCandleTimeRemaining: 180
    };
  }

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  
  // Calculate average volume
  const last20 = candles.slice(-20);
  const avgVol = last20.reduce((acc, c) => acc + c.volume, 0) / (last20.length || 1);

  // 1. EMA Cross
  const ema9 = current.ema9 || current.close;
  const ema21 = current.ema21 || current.close;
  const isEmaBullish = ema9 >= ema21;
  const isEmaBearish = ema9 < ema21;

  // 2. VWAP position
  const vwap = current.vwap || current.close;
  const isAboveVwap = current.close >= vwap;
  const isBelowVwap = current.close < vwap;

  // 3. RSI Momentum
  const rsi = current.rsi || 50;
  const isRsiBullish = rsi >= 53;
  const isRsiBearish = rsi <= 47;

  // 4. Volume surge
  const isVolumeSurge = current.volume > (avgVol * 1.15);

  // 5. Price Action: Higher High vs Lower Low
  const isHigherHigh = current.close > prev.high || (current.high > prev.high && current.close > current.open);
  const isLowerLow = current.close < prev.low || (current.low < prev.low && current.close < current.open);

  // 6. SuperTrend
  const isSupertrendBullish = current.supertrend?.direction === 'UP';
  const isSupertrendBearish = current.supertrend?.direction === 'DOWN';

  // Compute separate Bullish and Bearish scores
  let bullScore = 0;
  if (isEmaBullish) bullScore++;
  if (isAboveVwap) bullScore++;
  if (isRsiBullish) bullScore++;
  if (isVolumeSurge && current.close >= current.open) bullScore++;
  if (isHigherHigh) bullScore++;
  if (isSupertrendBullish) bullScore++;

  let bearScore = 0;
  if (isEmaBearish) bearScore++;
  if (isBelowVwap) bearScore++;
  if (isRsiBearish) bearScore++;
  if (isVolumeSurge && current.close < current.open) bearScore++;
  if (isLowerLow) bearScore++;
  if (isSupertrendBearish) bearScore++;

  const isDownsideDominant = bearScore > bullScore && bearScore >= 3;
  const activeScore = isDownsideDominant ? bearScore : bullScore;
  const percent = Math.round((activeScore / 6) * 100);

  let verdict: FiveMinuteConfirmation['verdict'] = 'WAIT_CONFIRMATION';
  let summaryKn = '';
  let summaryEn = '';

  if (isDownsideDominant) {
    if (bearScore >= 4) {
      verdict = 'CONFIRMED_DOWNSIDE';
      summaryKn = '🔻 5 ನಿಮಿಷಗಳ ಇಳಿಕೆ (DOWNSIDE) ಸಂಪೂರ್ಣ ಖಚಿತವಾಗಿದೆ! ಶಾರ್ಟ್ ಮಾಡಲು ಅಥವಾ PUT (PE) ಖರೀದಿಸಲು ಪ್ರಬಲ ಅವಕಾಶ.';
      summaryEn = '🔻 5-Minute Downside confirmed! High-probability SELL / PUT (PE) / SHORT setup.';
    } else {
      verdict = 'CONFIRMED_DOWNSIDE';
      summaryKn = '⚡ 5M ಇಳಿಕೆ ಒತ್ತಡ (Bearish Pressure). ಸ್ಟಾಪ್ ಲಾಸ್‌ನೊಂದಿಗೆ Sell / Put ಟ್ರೇಡ್ ಮಾಡಬಹುದು.';
      summaryEn = '⚡ Downside bias active with selling pressure. Safe SELL / PUT entry.';
    }
  } else if (bullScore >= 4) {
    verdict = 'CONFIRMED_UPSIDE';
    summaryKn = '✅ 5 ನಿಮಿಷಗಳ ಏರಿಕೆ (UPSIDE) ಸಂಪೂರ್ಣ ಖಚಿತವಾಗಿದೆ! ಖರೀದಿಸಲು (BUY / CALL / CE) ಪ್ರಬಲ ಅವಕಾಶ.';
    summaryEn = '✅ 5-Minute Upside confirmed! High-probability BUY / CALL (CE) setup.';
  } else {
    verdict = 'WAIT_CONFIRMATION';
    summaryKn = '⏳ ಸದ್ಯ ಮಾರ್ಕೆಟ್ ರೇಂಜ್-ಬೌಂಡ್ ಆಗಿದೆ. ಸ್ಪಷ್ಟ 5M ಕ್ಯಾಂಡಲ್ ಬ್ರೇಕ್‌ಔಟ್‌ಗೆ ಕಾಯಿರಿ.';
    summaryEn = '⏳ Market consolidating in a tight range. Await next 5M breakout candle.';
  }

  // Calculate remaining seconds in current 5-min period
  const now = new Date();
  const secondsInto5M = (now.getMinutes() % 5) * 60 + now.getSeconds();
  const nextCandleTimeRemaining = 300 - secondsInto5M;

  return {
    verdict,
    score: activeScore,
    maxScore: 6,
    percent,
    checks: isDownsideDominant
      ? {
          emaCross: {
            status: isEmaBearish,
            label: '5M EMA 9/21 Bearish Cross',
            labelKn: '5M EMA 9/21 ಇಳಿಕೆಯ ಕ್ರಾಸ್‌ಓವರ್',
            detail: isEmaBearish ? 'EMA 9 is below EMA 21 (Bearish trend confirmed)' : 'EMA 9 still holding',
            detailKn: isEmaBearish ? 'EMA 9 ರೇಖೆಯು 21 ರ ಕೆಳಗೆ ಇಳಿದಿದೆ (ಇಳಿಕೆಯ ದೃಢೀಕರಣ)' : 'EMA ಸಮತೋಲನ'
          },
          aboveVwap: {
            status: isBelowVwap,
            label: 'Below VWAP Breakdown',
            labelKn: 'VWAP ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗೆ ಇಳಿಕೆ',
            detail: isBelowVwap ? `Price trading below VWAP (${market.currency}${formatPrice(vwap, market.decimals)})` : 'Above VWAP',
            detailKn: isBelowVwap ? `ಬೆಲೆ VWAP ಸಾಂಸ್ಥಿಕ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗಿದೆ (${market.currency}${formatPrice(vwap, market.decimals)})` : 'VWAP ಮೇಲೆ'
          },
          rsiMomentum: {
            status: isRsiBearish,
            label: '5M RSI Bearish Zone',
            labelKn: '5M RSI ಇಳಿಕೆಯ ವಲಯ',
            detail: `RSI is ${rsi} (Bearish momentum active)`,
            detailKn: `RSI ${rsi} ರಷ್ಟಿದೆ (ಮಾರಾಟಗಾರರ ಒತ್ತಡ)`
          },
          volumeSurge: {
            status: isVolumeSurge && current.close < current.open,
            label: 'Sell Volume Surge',
            labelKn: 'ಮಾರಾಟ ವಾಲ್ಯೂಮ್ ಏರಿಕೆ',
            detail: isVolumeSurge ? 'High institutional selling volume' : 'Normal volume',
            detailKn: isVolumeSurge ? 'ಸರಾಸರಿಗಿಂತ ಹೆಚ್ಚಿನ ಮಾರಾಟ ವಾಲ್ಯೂಮ್' : 'ಸಾಧಾರಣ ವಾಲ್ಯೂಮ್'
          },
          priceAction: {
            status: isLowerLow,
            label: 'Lower Low Breakdown',
            labelKn: 'ಹಿಂದಿನ ಲೋ ಬ್ರೇಕ್‌ಡೌನ್',
            detail: isLowerLow ? 'Breaking previous 5M low support' : 'Holding support',
            detailKn: isLowerLow ? 'ಹಿಂದಿನ 5M ಕ್ಯಾಂಡಲ್ ಲೋ ಮಟ್ಟ ಬ್ರೇಕ್ ಆಗಿದೆ' : 'ಸಪೋರ್ಟ್ ಹಿಡಿದಿದೆ'
          },
          supertrend: {
            status: isSupertrendBearish,
            label: 'Supertrend (10, 3)',
            labelKn: 'ಸೂಪರ್‌ಟ್ರೆಂಡ್ ಇಂಡಿಕೇಟರ್',
            detail: isSupertrendBearish ? 'Red (Sell trend active)' : 'Green',
            detailKn: isSupertrendBearish ? 'ಕೆಂಪು (ಮಾರಾಟ / ಪುಟ್ ಟ್ರೆಂಡ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ)' : 'ಹಸಿರು'
          }
        }
      : {
          emaCross: {
            status: isEmaBullish,
            label: '5M EMA 9/21 Crossover',
            labelKn: '5M EMA 9/21 ಕ್ರಾಸ್‌ಓವರ್',
            detail: isEmaBullish ? 'EMA 9 is above EMA 21 (Bullish)' : 'EMA 9 is below EMA 21',
            detailKn: isEmaBullish ? 'EMA 9 ರೇಖೆ 21 ರ ಮೇಲಿದೆ (ಏರಿಕೆಯ ಸಂಕೇತ)' : 'EMA ರೇಖೆ ಕೆಳಗಿದೆ'
          },
          aboveVwap: {
            status: isAboveVwap,
            label: 'VWAP Institutional Level',
            labelKn: 'VWAP ಸಾಂಸ್ಥಿಕ ಮಟ್ಟ',
            detail: isAboveVwap ? `Price above VWAP (${market.currency}${formatPrice(vwap, market.decimals)})` : `Price below VWAP`,
            detailKn: isAboveVwap ? `ಬೆಲೆ VWAP ಗಿಂತ ಮೇಲಿದೆ (${market.currency}${formatPrice(vwap, market.decimals)})` : `ಬೆಲೆ VWAP ಗಿಂತ ಕೆಳಗಿದೆ`
          },
          rsiMomentum: {
            status: isRsiBullish,
            label: '5M RSI Trend Zone',
            labelKn: '5M RSI ಟ್ರೆಂಡ್ ವಲಯ',
            detail: `RSI is ${rsi} ${rsi >= 54 ? '(Bullish momentum)' : '(Neutral)'}`,
            detailKn: `RSI ${rsi} ರಷ್ಟಿದೆ ${rsi >= 54 ? '(ಬುಲ್ಲಿಷ್ ಮೊಮೆಂಟಮ್)' : '(ನ್ಯೂಟ್ರಲ್)'}`
          },
          volumeSurge: {
            status: isVolumeSurge,
            label: 'Volume Confirmation',
            labelKn: 'ವಾಲ್ಯೂಮ್ ದೃಢೀಕರಣ',
            detail: isVolumeSurge ? 'Volume > 1.15x average' : 'Normal volume',
            detailKn: isVolumeSurge ? 'ಸರಾಸರಿಗಿಂತ ಹೆಚ್ಚು ವಾಲ್ಯೂಮ್' : 'ಸಾಧಾರಣ ವಾಲ್ಯೂಮ್'
          },
          priceAction: {
            status: isHigherHigh,
            label: 'Price Action 5M High Break',
            labelKn: '5M ಪ್ರೈಸ್ ಆಕ್ಷನ್ ಹೈ ಬ್ರೇಕ್',
            detail: isHigherHigh ? 'Making Higher Highs on 5m' : 'Struggling to cross high',
            detailKn: isHigherHigh ? '5M ಕ್ಯಾಂಡಲ್ ಹೊಸ ಹೈ ಮಾಡುತ್ತಿದೆ' : 'ಹಿಂದಿನ ಗರಿಷ್ಠ ಮಟ್ಟ ದಾಟುತ್ತಿಲ್ಲ'
          },
          supertrend: {
            status: isSupertrendBullish,
            label: 'Supertrend (10, 3)',
            labelKn: 'ಸೂಪರ್‌ಟ್ರೆಂಡ್ ಇಂಡಿಕೇಟರ್',
            detail: isSupertrendBullish ? 'Green (Buy trend active)' : 'Red',
            detailKn: isSupertrendBullish ? 'ಹಸಿರು (ಖರೀದಿ ಟ್ರೆಂಡ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ)' : 'ಕೆಂಪು'
          }
        },
    summaryKn,
    summaryEn,
    nextCandleTimeRemaining
  };
}

// Generate Live Buy / Sell / Exit Signal (Calculates BOTH Buy Plan and Downside Sell Plan!)
export function generateTradeSignal(
  market: MarketInstrument,
  candles: Candle[],
  confirmation: FiveMinuteConfirmation,
  marketState: LiveMarketState
): TradeSignal {
  const currentPrice = marketState.currentPrice;

  // Determine overall directional priority
  const isDownside =
    confirmation.verdict === 'CONFIRMED_DOWNSIDE' ||
    marketState.trend === 'BEARISH' ||
    marketState.trend === 'STRONG_BEARISH' ||
    marketState.downsideProbability > 52;

  const isUpside =
    confirmation.verdict === 'CONFIRMED_UPSIDE' ||
    marketState.trend === 'BULLISH' ||
    marketState.trend === 'STRONG_BULLISH' ||
    marketState.upsideProbability > 52;

  const action: TradeSignal['action'] = isDownside ? 'SELL' : isUpside ? 'BUY' : 'WAIT';
  const direction: TradeSignal['direction'] = isDownside ? 'DOWNSIDE' : isUpside ? 'UPSIDE' : 'NEUTRAL';

  // Risk units
  const range = (marketState.dayHigh - marketState.dayLow) || (market.basePrice * 0.01);
  const slPts = Number((range * 0.18).toFixed(market.decimals));
  const t1Pts = Number((slPts * 1.5).toFixed(market.decimals));
  const t2Pts = Number((slPts * 2.5).toFixed(market.decimals));
  const t3Pts = Number((slPts * 4.0).toFixed(market.decimals));

  // --- 1. Comprehensive BUY PLAN (UPSIDE / CALL / CE) ---
  const buyEntry = Number((currentPrice + market.tickSize).toFixed(market.decimals));
  const buySl = Number((currentPrice - slPts).toFixed(market.decimals));
  const buyT1 = Number((currentPrice + t1Pts).toFixed(market.decimals));
  const buyT2 = Number((currentPrice + t2Pts).toFixed(market.decimals));
  const buyT3 = Number((currentPrice + t3Pts).toFixed(market.decimals));

  const buyPlan: DetailedPlan = {
    action: 'BUY',
    entryPrice: buyEntry,
    entryZone: `${formatPrice(buyEntry, market.decimals)} - ${formatPrice(buyEntry * 1.001, market.decimals)}`,
    stopLoss: buySl,
    stopLossPts: slPts,
    target1: buyT1,
    target1Pts: t1Pts,
    target2: buyT2,
    target2Pts: t2Pts,
    target3: buyT3,
    target3Pts: t3Pts,
    riskReward: '1 : 2.5',
    conditionEn: `ENTER BUY / CALL (CE) when 5M candle closes above ${market.currency}${formatPrice(buyEntry, market.decimals)} with volume`,
    conditionKn: `ಖರೀದಿ (BUY / CALL - CE): 5 ನಿಮಿಷದ ಕ್ಯಾಂಡಲ್ ${market.currency}${formatPrice(buyEntry, market.decimals)} ಗಿಂತ ಮೇಲೆ ಮುಕ್ತಾಯಗೊಂಡಾಗ ಖರೀದಿಸಿ`,
    exitWhenEn: `EXIT RULES: 1. Strict Stop Loss at ${market.currency}${formatPrice(buySl, market.decimals)}. 2. Book 50% at Target 1 (${market.currency}${formatPrice(buyT1, market.decimals)}) & move SL to entry cost. 3. Full Exit at Target 2 (${market.currency}${formatPrice(buyT2, market.decimals)}).`,
    exitWhenKn: `ಎಕ್ಸಿಟ್ ಯಾವಾಗ ಮಾಡಬೇಕು: ೧. ಬೆಲೆ ${market.currency}${formatPrice(buySl, market.decimals)} ಗೆ ಇಳಿದರೆ ಸ್ಟಾಪ್ ಲಾಸ್ ಎಕ್ಸಿಟ್. ೨. ಟಾರ್ಗೆಟ್ 1 (${market.currency}${formatPrice(buyT1, market.decimals)}) ತಲುಪಿದಾಗ 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ, SL ಅನ್ನು ಎಂಟ್ರಿಗೆ ತನ್ನಿ. ೩. ಟಾರ್ಗೆಟ್ 2 (${market.currency}${formatPrice(buyT2, market.decimals)}) ನಲ್ಲಿ ಸಂಪೂರ್ಣ ಎಕ್ಸಿಟ್ ಆಗಿ.`,
    confidence: Math.min(96, Math.max(50, marketState.upsideProbability))
  };

  // --- 2. Comprehensive SELL PLAN (DOWNSIDE / PUT / PE / SHORT) ---
  const sellEntry = Number((currentPrice - market.tickSize).toFixed(market.decimals));
  const sellSl = Number((currentPrice + slPts).toFixed(market.decimals));
  const sellT1 = Number((currentPrice - t1Pts).toFixed(market.decimals));
  const sellT2 = Number((currentPrice - t2Pts).toFixed(market.decimals));
  const sellT3 = Number((currentPrice - t3Pts).toFixed(market.decimals));

  const sellPlan: DetailedPlan = {
    action: 'SELL',
    entryPrice: sellEntry,
    entryZone: `${formatPrice(sellEntry * 0.999, market.decimals)} - ${formatPrice(sellEntry, market.decimals)}`,
    stopLoss: sellSl,
    stopLossPts: slPts,
    target1: sellT1,
    target1Pts: t1Pts,
    target2: sellT2,
    target2Pts: t2Pts,
    target3: sellT3,
    target3Pts: t3Pts,
    riskReward: '1 : 2.5',
    conditionEn: `ENTER SELL / PUT (PE) / SHORT when 5M candle breaks below ${market.currency}${formatPrice(sellEntry, market.decimals)} with breakdown volume`,
    conditionKn: `ಮಾರಾಟ (SELL / PUT - PE / SHORT): 5 ನಿಮಿಷದ ಕ್ಯಾಂಡಲ್ ${market.currency}${formatPrice(sellEntry, market.decimals)} ಗಿಂತ ಕೆಳಗೆ ಮುಕ್ತಾಯಗೊಂಡಾಗ ಪುಟ್ ಖರೀದಿಸಿ / ಶಾರ್ಟ್ ಮಾಡಿ`,
    exitWhenEn: `DOWNSIDE EXIT RULES: 1. Strict Stop Loss at ${market.currency}${formatPrice(sellSl, market.decimals)}. 2. Book 50% profit at Target 1 (${market.currency}${formatPrice(sellT1, market.decimals)}) & trail SL to entry cost. 3. Full Exit at Target 2 (${market.currency}${formatPrice(sellT2, market.decimals)}).`,
    exitWhenKn: `ಇಳಿಕೆ (DOWNSIDE) ಎಕ್ಸಿಟ್ ಯಾವಾಗ ಮಾಡಬೇಕು: ೧. ಬೆಲೆ ${market.currency}${formatPrice(sellSl, market.decimals)} ಗೆ ಏರಿದರೆ ತಕ್ಷಣ ಸ್ಟಾಪ್ ಲಾಸ್ ಎಕ್ಸಿಟ್ ಮಾಡಿ. ೨. ಟಾರ್ಗೆಟ್ 1 (${market.currency}${formatPrice(sellT1, market.decimals)}) ತಲುಪಿದಾಗ 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ. ೩. ಟಾರ್ಗೆಟ್ 2 (${market.currency}${formatPrice(sellT2, market.decimals)}) ನಲ್ಲಿ ಸಂಪೂರ್ಣ ಎಕ್ಸಿಟ್ ಆಗಿ.`,
    confidence: Math.min(96, Math.max(50, marketState.downsideProbability))
  };

  // Primary active trade plan assignment
  const activePlan = isDownside ? sellPlan : buyPlan;

  const particularEntry: 'CALL_CE' | 'PUT_PE' | 'WAIT_NO_ENTRY' = isDownside
    ? 'PUT_PE'
    : isUpside
    ? 'CALL_CE'
    : 'WAIT_NO_ENTRY';

  const particularVerdictKn = isDownside
    ? '🔴 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: PUT (PE) / ಇಳಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ!'
    : isUpside
    ? '🟢 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: CALL (CE) / ಏರಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ!'
    : '🟡 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: ಯಾವುದೇ ಎಂಟ್ರಿ ತಗೋಬೇಡಿ (ಬ್ರೇಕ್‌ಔಟ್‌ಗೆ ಕಾಯಿರಿ)';

  const particularVerdictEn = isDownside
    ? '🔴 DEFINITE VERDICT: TAKE PUT (PE) / DOWNSIDE ENTRY NOW'
    : isUpside
    ? '🟢 DEFINITE VERDICT: TAKE CALL (CE) / UPSIDE ENTRY NOW'
    : '🟡 DEFINITE VERDICT: WAIT - DO NOT TAKE CALL OR PUT YET';

  const entryReasonKn = isDownside
    ? 'ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಇಳಿಕೆಯ ತೀವ್ರ ಒತ್ತಡವಿದೆ (VWAP ಗಿಂತ ಕೆಳಗೆ). ಕಾಲ್ (CE) ತಗೋಬೇಡಿ, ಪುಟ್ (PUT - PE) ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ಶಾರ್ಟ್ ಮಾಡಿ.'
    : isUpside
    ? 'ಮಾರ್ಕೆಟ್‌ನಲ್ಲಿ ಏರಿಕೆಯ ಶಕ್ತಿಯಿದೆ (VWAP ಗಿಂತ ಮೇಲೆ). ಪುಟ್ (PE) ತಗೋಬೇಡಿ, ಕಾಲ್ (CALL - CE) ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ಖರೀದಿಸಿ.'
    : 'ಮಾರ್ಕೆಟ್ ರೇಂಜ್-ಬೌಂಡ್ ಆಗಿದೆ. ಸ್ಪಷ್ಟ 5M ಕ್ಯಾಂಡಲ್ ಬ್ರೇಕ್‌ಔಟ್ ಆಗುವವರೆಗೆ ಕಾಲ್ ಅಥವಾ ಪುಟ್ ಯಾವುದನ್ನೂ ತಗೋಬೇಡಿ.';

  const entryReasonEn = isDownside
    ? 'Dominant downside selling pressure below VWAP. Avoid CALLs; Enter PUT (PE) or Short.'
    : isUpside
    ? 'Strong buying momentum holding above VWAP. Avoid PUTs; Enter CALL (CE) or Long.'
    : 'Market consolidating in tight range. Wait for breakout before taking Call or Put.';

  const strikeRecommendation = isDownside
    ? `${market.symbol} ATM Put Option (PE) / Short Futures`
    : isUpside
    ? `${market.symbol} ATM Call Option (CE) / Long Futures`
    : 'No Strike (Await Confirmation)';

  return {
    id: `sig-${market.id}-${Date.now()}`,
    marketId: market.id,
    symbol: market.symbol,
    action,
    direction,
    entryPrice: activePlan.entryPrice,
    entryZone: activePlan.entryZone,
    entryConditionEn: activePlan.conditionEn,
    entryConditionKn: activePlan.conditionKn,
    stopLoss: activePlan.stopLoss,
    stopLossPts: activePlan.stopLossPts,
    target1: activePlan.target1,
    target1Pts: activePlan.target1Pts,
    target2: activePlan.target2,
    target2Pts: activePlan.target2Pts,
    target3: activePlan.target3,
    target3Pts: activePlan.target3Pts,
    riskReward: activePlan.riskReward,
    exitWhenEn: activePlan.exitWhenEn,
    exitWhenKn: activePlan.exitWhenKn,
    confidence: activePlan.confidence,
    timeframe: '5M',
    timestamp: Date.now(),
    isTriggered: true,
    particularEntry,
    particularVerdictKn,
    particularVerdictEn,
    entryReasonKn,
    entryReasonEn,
    strikeRecommendation,
    buyPlan,
    sellPlan
  };
}
