import React from 'react';
import { PaperPosition } from '../types/market';
import { formatPrice } from '../utils/technicalIndicators';
import { Briefcase, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface PaperTradingPanelProps {
  positions: PaperPosition[];
  onClosePosition: (id: string, reason: string) => void;
  language: 'kn' | 'en';
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  positions,
  onClosePosition,
  language
}) => {
  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const totalPnl = openPositions.reduce((acc, p) => acc + p.pnl, 0);

  if (openPositions.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-bold text-white">
            {language === 'kn' ? 'ಲೈವ್ ಸಿಮ್ಯುಲೇಶನ್ ಪೊಸಿಷನ್‌ಗಳು (Paper Trades)' : 'Active Paper Trading Positions'}
          </h4>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded font-bold">
            {openPositions.length} {language === 'kn' ? 'ತೆರೆದಿದೆ' : 'Open'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">
            {language === 'kn' ? 'ಒಟ್ಟು P&L:' : 'Total P&L:'}
          </span>
          <span className={`font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {openPositions.map((pos) => {
          const isProfitable = pos.pnl >= 0;
          return (
            <div
              key={pos.id}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pos.type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {pos.type}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {pos.symbol}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      isProfitable ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isProfitable ? '+' : ''}{pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(2)}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] font-mono text-slate-400">
                  <div>
                    {language === 'kn' ? 'ಎಂಟ್ರಿ:' : 'Entry:'}{' '}
                    <span className="text-slate-200">{pos.entryPrice}</span>
                  </div>
                  <div>
                    {language === 'kn' ? 'ಪ್ರಸ್ತುತ:' : 'Cur:'}{' '}
                    <span className="text-slate-200">{pos.currentPrice}</span>
                  </div>
                  <div>
                    SL:{' '}
                    <span className="text-red-400 font-bold">{pos.stopLoss}</span>
                  </div>
                  <div>
                    T1:{' '}
                    <span className="text-emerald-400 font-bold">{pos.target1}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onClosePosition(pos.id, 'Manual Exit')}
                  className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  {language === 'kn' ? 'ಈಗಲೇ ನಿರ್ಗಮಿಸಿ (Exit Now)' : 'Exit Position'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
