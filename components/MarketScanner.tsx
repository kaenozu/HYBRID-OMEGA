
import React from 'react';

interface Signal {
  symbol: string;
  price: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  isSyncing?: boolean;
}

interface MarketScannerProps {
  signals: Signal[];
  onSelect: (symbol: string) => void;
  selectedSymbol: string;
}

const MarketScanner: React.FC<MarketScannerProps> = ({ signals, onSelect, selectedSymbol }) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <h3 className="font-black text-slate-100 flex items-center gap-2 text-xs uppercase tracking-widest">
          <i className="fa-solid fa-bolt-lightning text-amber-500 animate-pulse"></i>
          AI リアルタイム推奨銘柄
        </h3>
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Auto-Scan Active</span>
      </div>
      <div className="divide-y divide-slate-800">
        {signals.map((s) => {
          const isHighAlpha = s.strength >= 4 && s.sentiment !== 'NEUTRAL';
          return (
            <button
              key={s.symbol}
              onClick={() => !s.isSyncing && onSelect(s.symbol)}
              disabled={s.isSyncing}
              className={`w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-all group ${
                selectedSymbol === s.symbol ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
              } ${s.isSyncing ? 'opacity-60 cursor-wait' : ''}`}
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className="font-black text-slate-200 text-sm tracking-tight">{s.symbol}</div>
                  {isHighAlpha && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-500/30 animate-pulse">AI PICK</span>
                  )}
                </div>
                <div className={`text-[11px] font-mono ${s.isSyncing ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`}>
                  {s.isSyncing ? 'CALCULATING...' : `$${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                  s.isSyncing ? 'bg-slate-800 text-slate-600' :
                  s.sentiment === 'BULLISH' ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                  s.sentiment === 'BEARISH' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                  'bg-slate-700/30 text-slate-500'
                }`}>
                  {s.isSyncing ? 'WAIT' : s.sentiment === 'BULLISH' ? '強気：買い推奨' : s.sentiment === 'BEARISH' ? '弱気：売り推奨' : '様子見'}
                </div>
                <div className="mt-1 flex justify-end gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-3 rounded-full transition-all duration-700 ${
                        s.isSyncing ? 'bg-slate-800' :
                        i < s.strength ? (s.sentiment === 'BULLISH' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : s.sentiment === 'BEARISH' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-slate-400') : 'bg-slate-800'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-3 bg-indigo-500/5 border-t border-slate-800">
         <p className="text-[8px] text-slate-500 italic text-center leading-tight">※AI PICKは、SNSセンチメントと直近の値動き、ニュース重要度を統合して算出されています。</p>
      </div>
    </div>
  );
};

export default MarketScanner;
