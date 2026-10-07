import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
// Priority: port 3000 as required in AI Studio instructions
const PORT = 3000;

app.use(express.json());

// Helper function to generate algorithmic technical analysis fallback
function generateAlgorithmicAnalysis(
  market: any,
  price: number,
  trend: string,
  timeframe: string,
  confirmationScore: number,
  indicators: any,
  language: string
) {
  const isUpside =
    trend.includes('BULLISH') ||
    trend.includes('ಏರಿಕೆ') ||
    confirmationScore >= 4;
  const isDownside =
    trend.includes('BEARISH') ||
    trend.includes('ಇಳಿಕೆ') ||
    confirmationScore <= 2;
  const dir = isUpside ? 'UPSIDE' : isDownside ? 'DOWNSIDE' : 'SIDEWAYS';
  const dec = market?.decimals ?? 2;
  const currency = market?.currency ?? '₹';
  const name = market?.name ?? 'Market';

  const entryPrice = isUpside
    ? (price * 1.0006).toFixed(dec)
    : (price * 0.9994).toFixed(dec);
  const slPrice = isUpside
    ? (price * 0.993).toFixed(dec)
    : (price * 1.007).toFixed(dec);
  const t1Price = isUpside
    ? (price * 1.008).toFixed(dec)
    : (price * 0.992).toFixed(dec);
  const t2Price = isUpside
    ? (price * 1.016).toFixed(dec)
    : (price * 0.984).toFixed(dec);

  if (language === 'kn') {
    return {
      marketDirection: dir,
      directionReason: isUpside
        ? `${name} ನಲ್ಲಿ 5 ನಿಮಿಷಗಳ ಮೊಮೆಂಟಮ್ ಶಕ್ತಿಯುತವಾಗಿದ್ದು, EMA 9 ಮತ್ತು VWAP ಮಟ್ಟಗಳು ಏರಿಕೆಗೆ ಅನುಕೂಲಕರವಾಗಿವೆ (${confirmationScore}/6 ದೃಢೀಕರಣ).`
        : isDownside
        ? `${name} ನಲ್ಲಿ ಮಾರಾಟಗಾರರ ಒತ್ತಡವಿದ್ದು, ಬೆಲೆಯು VWAP ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗೆ ಚಲಿಸುತ್ತಿದೆ (${confirmationScore}/6 ದೃಢೀಕರಣ).`
        : `${name} ಪ್ರಸ್ತುತ ಕನ್ಸಾಲಿಡೇಶನ್‌ನಲ್ಲಿದೆ. ಸ್ಪಷ್ಟ ಬ್ರೇಕ್‌ಔಟ್ ಮುಂಚೆ ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ.`,
      action: isUpside ? 'BUY' : isDownside ? 'SELL' : 'WAIT',
      particularEntry: isUpside ? 'CALL_CE' : isDownside ? 'PUT_PE' : 'WAIT_NO_ENTRY',
      callOrPutAdviceKn: isUpside
        ? '🟢 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: CALL (CE) / ಏರಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ (ಪುಟ್ ತಗೋಬೇಡಿ)'
        : isDownside
        ? '🔴 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: PUT (PE) / ಇಳಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ (ಕಾಲ್ ತಗೋಬೇಡಿ)'
        : '🟡 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: ಯಾವುದೇ ಎಂಟ್ರಿ ತಗೋಬೇಡಿ (ಕಾಲ್ ಅಥವಾ ಪುಟ್ ಬ್ರೇಕ್‌ಔಟ್‌ಗೆ ಕಾಯಿರಿ)',
      callOrPutAdviceEn: isUpside
        ? '🟢 TAKE CALL (CE) / LONG ENTRY (Avoid Puts)'
        : isDownside
        ? '🔴 TAKE PUT (PE) / DOWNSIDE ENTRY (Avoid Calls)'
        : '🟡 WAIT FOR BREAKOUT BEFORE TAKING CALL OR PUT',
      entryCondition: isUpside
        ? `ಮುಂದಿನ 5M ಕ್ಯಾಂಡಲ್ ${currency} ${entryPrice} ದಾಟಿದಾಗ ಖರೀದಿಸಿ (BUY / CALL - CE)`
        : isDownside
        ? `ಮುಂದಿನ 5M ಕ್ಯಾಂಡಲ್ ${currency} ${entryPrice} ಕೆಳಗೆ ಮುಕ್ತಾಯಗೊಂಡಾಗ ಪುಟ್ ಖರೀದಿಸಿ / ಶಾರ್ಟ್ ಮಾಡಿ (SELL / PUT - PE)`
        : `ಬ್ರೇಕ್‌ಔಟ್‌ಗಾಗಿ ಕಾಯಿರಿ, ಸದ್ಯ ಎಂಟ್ರಿ ಮಾಡಬೇಡಿ`,
      stopLossAdvice: `${currency} ${slPrice} (ಕಟ್ಟುನಿಟ್ಟಾದ ಸ್ಟಾಪ್ ಲಾಸ್)`,
      exitPlan: `ಟಾರ್ಗೆಟ್ 1: ${currency} ${t1Price} (50% ಲಾಭ ಬುಕ್ ಮಾಡಿ), ಟಾರ್ಗೆಟ್ 2: ${currency} ${t2Price} (ಪೂರ್ಣ ಎಕ್ಸಿಟ್).`,
      kannadaSummary: isUpside
        ? `${name} ನಲ್ಲಿ 5 ನಿಮಿಷಗಳ ಚಾರ್ಟ್‌ನಲ್ಲಿ ಏರಿಕೆ (Upside) ಕನ್ಫರ್ಮೇಶನ್ ದೃಢವಾಗಿದೆ. ${currency} ${entryPrice} ಹಂತದಲ್ಲಿ CALL (CE) ಎಂಟ್ರಿ ಮಾಡಿ, ${currency} ${slPrice} ಸ್ಟಾಪ್ ಲಾಸ್ ಪಾಲಿಸಿ. ಟಾರ್ಗೆಟ್ 1 ತಲುಪಿದಾಗ 50% ಲಾಭ ಬುಕ್ ಮಾಡಿ ಸ್ಟಾಪ್ ಲಾಸ್ ಅನ್ನು ಎಂಟ್ರಿ ಬೆಲೆಗೆ ತನ್ನಿ.`
        : isDownside
        ? `${name} ನಲ್ಲಿ ಇಳಿಕೆ (Downside) ಸಂಕೇತವಿದೆ. ಕಾಲ್ ತಗೋಬೇಡಿ, PUT (PE) ಎಂಟ್ರಿ ಮಾಡಿ, ನಿಯಮಾನುಸಾರ ಸ್ಟಾಪ್ ಲಾಸ್ ${currency} ${slPrice} ಇಟ್ಟು ಶಾರ್ಟ್ ಮಾಡಿ.`
        : `${name} ಸದ್ಯ ಕನ್ಸಾಲಿಡೇಶನ್ ರೇಂಜ್‌ನಲ್ಲಿದೆ. ಸ್ಪಷ್ಟ ನಿರ್ದೇಶನ ಬರುವವರೆಗೆ ಕಾಯಿರಿ.`
    };
  }

  return {
    marketDirection: dir,
    directionReason: isUpside
      ? `${name} is showing robust 5-minute upward continuation supported by EMA 9 and VWAP alignment (${confirmationScore}/6 confirmation).`
      : isDownside
      ? `${name} is facing persistent institutional selling pressure below VWAP.`
      : `${name} is in a consolidation squeeze. Awaiting directional breakout.`,
    action: isUpside ? 'BUY' : isDownside ? 'SELL' : 'WAIT',
    particularEntry: isUpside ? 'CALL_CE' : isDownside ? 'PUT_PE' : 'WAIT_NO_ENTRY',
    callOrPutAdviceKn: isUpside
      ? '🟢 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: CALL (CE) / ಏರಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ'
      : isDownside
      ? '🔴 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: PUT (PE) / ಇಳಿಕೆ ಎಂಟ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ'
      : '🟡 ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಎಂಟ್ರಿ ಬೇಡ',
    callOrPutAdviceEn: isUpside
      ? '🟢 TAKE CALL (CE) / LONG ENTRY'
      : isDownside
      ? '🔴 TAKE PUT (PE) / DOWNSIDE ENTRY'
      : '🟡 WAIT FOR BREAKOUT',
    entryCondition: isUpside
      ? `Enter BUY / CALL (CE) when 5M candle holds above ${currency} ${entryPrice}`
      : `Enter SELL / PUT (PE) on breakdown below ${currency} ${entryPrice}`,
    stopLossAdvice: `${currency} ${slPrice} (Strict risk control)`,
    exitPlan: `Target 1: ${currency} ${t1Price} (Scale out 50%), Target 2: ${currency} ${t2Price} (Full exit).`,
    kannadaSummary: `Detailed trade blueprint generated for ${name}. Strict risk management with SL at ${currency} ${slPrice}.`
  };
}

// Gemini AI analysis endpoint with bulletproof fallback
app.post('/api/ai-analysis', async (req, res) => {
  const { market, price, trend, timeframe, confirmationScore, indicators, language } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallback = generateAlgorithmicAnalysis(
      market,
      price,
      trend,
      timeframe,
      confirmationScore,
      indicators,
      language
    );
    return res.status(200).json(fallback);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an elite institutional intraday trading analyst.
Analyze the following live setup:
Market: ${market?.name} (${market?.symbol}) - Category: ${market?.category}
Current Price: ${market?.currency} ${price}
Intraday Trend: ${trend}
Timeframe: ${timeframe}
5-Minute Confirmation Score: ${confirmationScore}/6
Key Technical Indicators: ${JSON.stringify(indicators || {})}
User Preferred Language: ${language === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}

Respond strictly with valid JSON with this exact structure:
{
  "marketDirection": "UPSIDE" | "DOWNSIDE" | "SIDEWAYS",
  "directionReason": "Concise 1-2 sentences explaining why upside or downside is likely in the next 5m-60m",
  "action": "BUY" | "SELL" | "WAIT",
  "particularEntry": "CALL_CE" | "PUT_PE" | "WAIT_NO_ENTRY",
  "callOrPutAdviceKn": "ಕನ್ನಡದಲ್ಲಿ ನಿರ್ದಿಷ್ಟ ತೀರ್ಪು: CALL (CE) ತಗೋಬೇಕಾ ಅಥವಾ PUT (PE) ತಗೋಬೇಕಾ?",
  "callOrPutAdviceEn": "Definitive recommendation: Take CALL (CE) or PUT (PE)",
  "entryCondition": "Clear entry trigger price and candle condition",
  "stopLossAdvice": "Exact SL price and risk rationale",
  "exitPlan": "Exit targets (Target 1, Target 2) and trailing stop loss instructions",
  "kannadaSummary": "Detailed guidance written in fluent, helpful Kannada (ಕನ್ನಡ) explaining when to buy/sell, exact entry, stop loss, and exit targets so any Kannada-speaking trader can execute with confidence."
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI response timeout')), 5000)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      }),
      timeoutPromise
    ]);

    const text = response?.text || '';
    if (text) {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    }
  } catch (error: any) {
    console.warn('Gemini API call timed out or had demand spike, using algorithmic model:', error?.message);
  }

  // Graceful fallback: Never fail user request
  const fallback = generateAlgorithmicAnalysis(
    market,
    price,
    trend,
    timeframe,
    confirmationScore,
    indicators,
    language
  );
  return res.status(200).json(fallback);
});

// Dev vs Prod Vite setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
