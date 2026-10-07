import { MarketInstrument, MarketSessionStatus } from '../types/market';

export type SessionMode = 'AUTO' | 'FORCE_OPEN' | 'FORCE_HOLD' | 'SMART_LIVE';

export interface MarketScheduleInfo {
  status: MarketSessionStatus;
  statusLabelEn: string;
  statusLabelKn: string;
  scheduleTextEn: string;
  scheduleTextKn: string;
  nextEventTextEn: string;
  nextEventTextKn: string;
}

// Helper to check if market session is actively running right now in real time
export function isMarketCurrentlyOpen(market: MarketInstrument): boolean {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (5.5 * 3600000));

  const dayOfWeek = istDate.getDay();
  const istHours = istDate.getHours();
  const istMinutes = istDate.getMinutes();
  const istTotalMinutes = istHours * 60 + istMinutes;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. Crypto: 24/7/365 open
  if (market.category === 'crypto') return true;

  // 2. Indian (NSE/BSE): 09:15 to 15:30 IST (Mon-Fri)
  if (market.category === 'indian') {
    if (isWeekend) return false;
    return istTotalMinutes >= (9 * 60 + 15) && istTotalMinutes <= (15 * 60 + 30);
  }

  // 3. Commodities (MCX): 09:00 to 23:30 IST (Mon-Fri)
  if (market.category === 'commodities') {
    if (isWeekend) return false;
    return istTotalMinutes >= (9 * 60) && istTotalMinutes <= (23 * 60 + 30);
  }

  // 4. Forex: 24/5 (Mon to Fri)
  if (market.category === 'forex') {
    if (dayOfWeek === 6 || (dayOfWeek === 0 && istHours < 22)) return false;
    return true;
  }

  return true;
}

// Check current session status based on IST / UTC exchange clocks
export function getMarketSchedule(
  market: MarketInstrument,
  mode: SessionMode = 'AUTO'
): MarketScheduleInfo {
  if (mode === 'FORCE_OPEN') {
    return {
      status: 'OPEN',
      statusLabelEn: 'MARKET LIVE & ANALYZING',
      statusLabelKn: 'ಮಾರುಕಟ್ಟೆ ಲೈವ್ · ವಿಶ್ಲೇಷಣೆ ಚಾಲ್ತಿಯಲ್ಲಿದೆ',
      scheduleTextEn: 'Live Streaming Active',
      scheduleTextKn: 'ಲೈವ್ ಸ್ಟ್ರೀಮಿಂಗ್ ಸಕ್ರಿಯವಾಗಿದೆ',
      nextEventTextEn: 'Live Analysis Running',
      nextEventTextKn: 'ಲೈವ್ ವಿಶ್ಲೇಷಣೆ ಚಾಲ್ತಿಯಲ್ಲಿದೆ'
    };
  }

  if (mode === 'FORCE_HOLD') {
    return {
      status: 'HOLD',
      statusLabelEn: 'MARKET CLOSED · STOP HOLD',
      statusLabelKn: 'ಮಾರುಕಟ್ಟೆ ಕ್ಲೋಸ್ · ಸ್ಟಾಪ್ ಹೋಲ್ಡ್ ಆಗಿದೆ',
      scheduleTextEn: 'Trading Stopped · Holding Last Close',
      scheduleTextKn: 'ಟ್ರೇಡಿಂಗ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ · ಹಿಂದಿನ ಕ್ಲೋಸ್ ಹೋಲ್ಡ್ ಆಗಿದೆ',
      nextEventTextEn: 'Market on Hold',
      nextEventTextKn: 'ಮಾರ್ಕೆಟ್ ಹೋಲ್ಡ್‌ನಲ್ಲಿದೆ'
    };
  }

  if (mode === 'SMART_LIVE') {
    const isLive = isMarketCurrentlyOpen(market);
    if (isLive) {
      return {
        status: 'OPEN',
        statusLabelEn: 'SMART LIVE · ACTIVE SESSION',
        statusLabelKn: 'ಸ್ಮಾರ್ಟ್ ಲೈವ್ · ಸಕ್ರಿಯ ವಹಿವಾಟು',
        scheduleTextEn: 'Live Trading & Analysis Active',
        scheduleTextKn: 'ಲೈವ್ ಟ್ರೇಡಿಂಗ್ & ವಿಶ್ಲೇಷಣೆ ಸಕ್ರಿಯವಾಗಿದೆ',
        nextEventTextEn: 'Live Session in Progress',
        nextEventTextKn: 'ಲೈವ್ ಸೆಷನ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ'
      };
    }
    return {
      status: 'CLOSED',
      statusLabelEn: 'MARKET CLOSED · FILTERED OUT',
      statusLabelKn: 'ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ · ಫಿಲ್ಟರ್ ಮಾಡಲಾಗಿದೆ',
      scheduleTextEn: 'Session Closed',
      scheduleTextKn: 'ಸೆಷನ್ ಮುಕ್ತಾಯಗೊಂಡಿದೆ',
      nextEventTextEn: 'Closed',
      nextEventTextKn: 'ಕ್ಲೋಸ್ ಆಗಿದೆ'
    };
  }

  // AUTO: Evaluate based on real exchange operating hours
  const now = new Date();
  // Convert to Indian Standard Time (IST) - UTC + 5:30
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (5.5 * 3600000));

  const dayOfWeek = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  const istHours = istDate.getHours();
  const istMinutes = istDate.getMinutes();
  const istTotalMinutes = istHours * 60 + istMinutes;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. Crypto: 24/7/365 Open
  if (market.category === 'crypto') {
    return {
      status: 'OPEN',
      statusLabelEn: 'MARKET LIVE (24/7 CRYPTO)',
      statusLabelKn: 'ಮಾರುಕಟ್ಟೆ ಲೈವ್ (೨೪/೭ ಕ್ರಿಪ್ಟೋ)',
      scheduleTextEn: '24/7/365 Continuous Trading',
      scheduleTextKn: '೨೪ ಗಂಟೆಯೂ ನಿರಂತರ ಟ್ರೇಡಿಂಗ್',
      nextEventTextEn: 'Non-stop Session',
      nextEventTextKn: 'ನಿರಂತರ ಚಾಲ್ತಿಯಲ್ಲಿದೆ'
    };
  }

  // 2. Indian Stock Market (NSE / BSE): 9:15 AM - 3:30 PM IST (Mon-Fri)
  if (market.category === 'indian') {
    const marketOpen = 9 * 60 + 15; // 09:15
    const marketClose = 15 * 60 + 30; // 15:30

    if (isWeekend) {
      return {
        status: 'CLOSED',
        statusLabelEn: 'NSE/BSE CLOSED (WEEKEND)',
        statusLabelKn: 'ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ (ವಾರಾಂತ್ಯ)',
        scheduleTextEn: 'Mon - Fri: 09:15 AM - 03:30 PM IST',
        scheduleTextKn: 'ಸೋಮ - ಶುಕ್ರ: ಬೆಳಿಗ್ಗೆ ೦೯:೧೫ - ಮಧ್ಯಾಹ್ನ ೦೩:೩೦',
        nextEventTextEn: 'Opens Monday 09:15 AM IST',
        nextEventTextKn: 'ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ ೦೯:೧೫ ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ'
      };
    }

    if (istTotalMinutes >= marketOpen && istTotalMinutes <= marketClose) {
      return {
        status: 'OPEN',
        statusLabelEn: 'NSE/BSE LIVE REGULAR SESSION',
        statusLabelKn: 'ಮಾರುಕಟ್ಟೆ ಲೈವ್ · ನಿಯಮಿತ ಅವಧಿ',
        scheduleTextEn: 'Closes at 03:30 PM IST',
        scheduleTextKn: 'ಮಧ್ಯಾಹ್ನ ೦೩:೩೦ ಕ್ಕೆ ಮುಕ್ತಾಯವಾಗುತ್ತದೆ',
        nextEventTextEn: 'Market Closes at 03:30 PM',
        nextEventTextKn: 'ಮಧ್ಯಾಹ್ನ ೦೩:೩೦ ಕ್ಕೆ ಕ್ಲೋಸ್ ಆಗುತ್ತದೆ'
      };
    }

    return {
      status: 'CLOSED',
      statusLabelEn: 'NSE/BSE CLOSED · STOP HOLD',
      statusLabelKn: 'ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ · ಸ್ಟಾಪ್ ಹೋಲ್ಡ್',
      scheduleTextEn: 'Mon - Fri: 09:15 AM - 03:30 PM IST',
      scheduleTextKn: 'ಸೋಮ - ಶುಕ್ರ: ಬೆಳಿಗ್ಗೆ ೦೯:೧೫ - ಮಧ್ಯಾಹ್ನ ೦೩:೩೦',
      nextEventTextEn: 'Opens Tomorrow 09:15 AM IST',
      nextEventTextKn: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ೦೯:೧೫ ಕ್ಕೆ ಓಪನ್ ಆಗುತ್ತದೆ'
    };
  }

  // 3. Commodities (MCX/COMEX): 9:00 AM - 11:30 PM IST (Mon-Fri)
  if (market.category === 'commodities') {
    const comOpen = 9 * 60; // 09:00
    const comClose = 23 * 60 + 30; // 23:30

    if (isWeekend) {
      return {
        status: 'CLOSED',
        statusLabelEn: 'COMMODITY MCX CLOSED (WEEKEND)',
        statusLabelKn: 'ಕಮಾಡಿಟಿ ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ (ವಾರಾಂತ್ಯ)',
        scheduleTextEn: 'Mon - Fri: 09:00 AM - 11:30 PM IST',
        scheduleTextKn: 'ಸೋಮ - ಶುಕ್ರ: ಬೆಳಿಗ್ಗೆ ೦೯:೦೦ - ರಾತ್ರಿ ೧೧:೩೦',
        nextEventTextEn: 'Opens Monday 09:00 AM IST',
        nextEventTextKn: 'ಸೋಮವಾರ ಬೆಳಿಗ್ಗೆ ೦೯:೦೦ ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ'
      };
    }

    if (istTotalMinutes >= comOpen && istTotalMinutes <= comClose) {
      return {
        status: 'OPEN',
        statusLabelEn: 'MCX/COMEX LIVE ACTIVE SESSION',
        statusLabelKn: 'ಕಮಾಡಿಟಿ ಲೈವ್ · ಸಕ್ರಿಯ ವಹಿವಾಟು',
        scheduleTextEn: 'Closes at 11:30 PM IST',
        scheduleTextKn: 'ರಾತ್ರಿ ೧೧:೩೦ ಕ್ಕೆ ಮುಕ್ತಾಯವಾಗುತ್ತದೆ',
        nextEventTextEn: 'Session closes at 11:30 PM',
        nextEventTextKn: 'ರಾತ್ರಿ ೧೧:೩೦ ಕ್ಕೆ ಕ್ಲೋಸ್ ಆಗುತ್ತದೆ'
      };
    }

    return {
      status: 'CLOSED',
      statusLabelEn: 'COMMODITIES CLOSED · STOP HOLD',
      statusLabelKn: 'ಕಮಾಡಿಟಿ ಕ್ಲೋಸ್ · ಸ್ಟಾಪ್ ಹೋಲ್ಡ್',
      scheduleTextEn: 'Mon - Fri: 09:00 AM - 11:30 PM IST',
      scheduleTextKn: 'ಸೋಮ - ಶುಕ್ರ: ಬೆಳಿಗ್ಗೆ ೦೯:೦೦ - ರಾತ್ರಿ ೧೧:೩೦',
      nextEventTextEn: 'Opens at 09:00 AM IST',
      nextEventTextKn: 'ಬೆಳಿಗ್ಗೆ ೦೯:೦೦ ಕ್ಕೆ ಓಪನ್ ಆಗುತ್ತದೆ'
    };
  }

  // 4. Forex: 24/5 (Mon 00:00 to Fri 22:00 UTC)
  if (market.category === 'forex') {
    if (dayOfWeek === 6 || (dayOfWeek === 0 && istHours < 22)) {
      return {
        status: 'CLOSED',
        statusLabelEn: 'FOREX MARKET CLOSED (WEEKEND)',
        statusLabelKn: 'ಫಾರೆಕ್ಸ್ ಮಾರ್ಕೆಟ್ ಕ್ಲೋಸ್ (ವಾರಾಂತ್ಯ)',
        scheduleTextEn: '24/5 Monday - Friday UTC',
        scheduleTextKn: '೨೪/೫ ಸೋಮವಾರ - ಶುಕ್ರವಾರ',
        nextEventTextEn: 'Opens Sunday Night UTC',
        nextEventTextKn: 'ಭಾನುವಾರ ರಾತ್ರಿ ಓಪನ್ ಆಗುತ್ತದೆ'
      };
    }

    return {
      status: 'OPEN',
      statusLabelEn: 'GLOBAL FOREX 24/5 LIVE',
      statusLabelKn: 'ಜಾಗತಿಕ ಫಾರೆಕ್ಸ್ ಲೈವ್',
      scheduleTextEn: 'Global 24-Hour Currency Market',
      scheduleTextKn: 'ಜಾಗತಿಕ ೨೪ ಗಂಟೆ ಕರೆನ್ಸಿ ಮಾರುಕಟ್ಟೆ',
      nextEventTextEn: 'Trading 24/5',
      nextEventTextKn: 'ನಿರಂತರ ವಹಿವಾಟು'
    };
  }

  return {
    status: 'OPEN',
    statusLabelEn: 'MARKET LIVE',
    statusLabelKn: 'ಮಾರುಕಟ್ಟೆ ಲೈವ್',
    scheduleTextEn: 'Standard Session',
    scheduleTextKn: 'ಸಾಮಾನ್ಯ ಅವಧಿ',
    nextEventTextEn: 'Active',
    nextEventTextKn: 'ಸಕ್ರಿಯ'
  };
}
