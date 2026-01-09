
import React, { useState, useMemo } from 'react';

interface TradePanelProps {
  currentPrice: number;
  symbol: string;
  onExecute: (type: 'BUY' | 'SELL', amount: number) => void;
  onInsightUpdate: (insight: string) => void;
}

const TradePanel: React.FC<TradePanelProps> = ({ currentPrice, symbol, onExecute, onInsightUpdate }) => {
  const [amount, setAmount] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [userInsight, setUserInsight] = useState("");

  const riskPerShare = stopLoss > 0 ? Math.abs(currentPrice - stopLoss) : 0;
  const totalRisk = riskPerShare * amount;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-4">1. ユーザーの考察 (AIへの入力)</h3>
        <textarea
          value={userInsight}
          onChange={(e) => {
            setUserInsight(e.target.value);
            onInsightUpdate(e.target.value);
          }}
          placeholder="例: RSIが売られすぎ水準にあり、直近サポートラインでの反発を期待。ファンダは強気。"
          className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-6">2. 算術リスク計算機</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] text-slate-500 mb-2 uppercase font-black">SL(損切り価格)</label>
            <input 
              type="number" 
              value={stopLoss || ''}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              placeholder="価格を入力"
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 w-full text-white font-mono focus:outline-none focus:border-red-500 transition-all text-sm"
            />
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase">推定損失額 (リスク)</span>
            <span className={`font-mono font-bold text-sm ${totalRisk > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              -${totalRisk.toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-slate-800"></div>

          <div>
            <label className="block text-[9px] text-slate-500 mb-2 uppercase font-black">注文数量</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 w-full text-white font-mono focus:outline-none focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              onClick={() => onExecute('BUY', amount)}
              className="bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all text-xs"
            >
              成行買い
            </button>
            <button 
              onClick={() => onExecute('SELL', amount)}
              className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all text-xs"
            >
              成行売り
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
