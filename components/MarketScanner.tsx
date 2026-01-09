
import React, { useState } from 'react';

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
  onExecute: (type: 'BUY' | 'SELL', amount: number) => void;
}

const MarketScanner: React.FC<MarketScannerProps> = ({ signals, onSelect, selectedSymbol, onExecute }) => {
  const [amount, setAmount] = useState<number>(1);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <h3 className="font-black text-slate-100 flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <i className="fa-solid fa-satellite-dish text-indigo-400"></i>
          マーケット・スキャナー
        </h3>
        <span className="text-[8px] text-slate-500 font-bold uppercase">Live</span>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800 custom-scrollbar">
        {signals.map((s) => {
          const isSelected = selectedSymbol === s.symbol;
          return (
            <div key={s.symbol} className={`transition-all ${isSelected ? 'bg-indigo-600/10' : 'hover:bg-slate-800/40'}`}>
              <button
                onClick={() => onSelect(s.symbol)}
                className={`w-full p-4 flex items-center justify-between text-left ${isSelected ? 'border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">{s.symbol}</span>
                    {s.strength >= 4 && (
                      <span className="text-[7px] bg-amber-500 text-slate-950 px-1 rounded font-black">AI PICK</span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    ${s.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                    s.sentiment === 'BULLISH' ? 'text-green-400 bg-green-400/10' : 
                    s.sentiment === 'BEARISH' ? 'text-red-400 bg-red-400/10' : 'text-slate-500 bg-slate-800'
                  }`}>
                    {s.sentiment === 'BULLISH' ? 'STRONG BUY' : s.sentiment === 'BEARISH' ? 'STRONG SELL' : 'NEUTRAL'}
                  </div>
                </div>
              </button>

              {/* 選択時のみ表示されるクイックトレードUI */}
              {isSelected && (
                <div className="px-4 pb-4 pt-0 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-2 border border-slate-800">
                    <span className="text-[8px] font-black text-slate-500 uppercase px-1">Qty</span>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                      className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => onExecute('BUY', amount)}
                      className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-black py-2 rounded-lg transition-all active:scale-95"
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => onExecute('SELL', amount)}
                      className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black py-2 rounded-lg transition-all active:scale-95"
                    >
                      SELL
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScanner;
