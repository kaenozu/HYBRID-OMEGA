
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TradingChart from './components/TradingChart';
import TradePanel from './components/TradePanel';
import AIAssistant from './components/AIAssistant';
import UsageGuide from './components/UsageGuide';
import MarketScanner from './components/MarketScanner';
import { generateMockStockData, MOCK_NEWS, INITIAL_SYMBOLS } from './constants';
import { StockData, Trade, MarketAnalysis, NewsItem, TradingHorizon } from './types';
import { analyzeMarket, syncMarketPricesBySearch } from './services/geminiService';
import { getLiveMarketUpdate, fetchLivePrice } from './services/marketService';

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(INITIAL_SYMBOLS[0]);
  const [horizon, setHorizon] = useState<TradingHorizon>('DAY');
  const [stockHistory, setStockHistory] = useState<StockData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [news] = useState<NewsItem[]>(MOCK_NEWS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncingWithWeb, setIsSyncingWithWeb] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [balance, setBalance] = useState(100000);
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'SYNCING' | 'RATE_LIMITED' | 'ERROR'>('IDLE');
  const [userInsight, setUserInsight] = useState("");

  const stockHistoryRef = useRef<StockData[]>([]);
  useEffect(() => { stockHistoryRef.current = stockHistory; }, [stockHistory]);

  const [marketSignals, setMarketSignals] = useState<any[]>(
    INITIAL_SYMBOLS.map(s => ({
      symbol: s,
      price: 0,
      sentiment: 'NEUTRAL',
      strength: 0,
      isSyncing: true
    }))
  );

  // 定期的な価格更新
  const updateMarket = useCallback(async () => {
    const updates = await getLiveMarketUpdate(INITIAL_SYMBOLS);
    setMarketSignals(prev => prev.map(s => {
      const up = updates.find(u => u.symbol === s.symbol);
      if (!up) return s;
      return {
        ...s,
        price: up.price,
        sentiment: up.change > 0.05 ? 'BULLISH' : up.change < -0.05 ? 'BEARISH' : 'NEUTRAL',
        strength: Math.min(5, Math.max(1, Math.ceil(Math.abs(up.change) * 10))),
        isSyncing: false
      };
    }));
  }, []);

  useEffect(() => {
    updateMarket();
    const timer = setInterval(updateMarket, 10000); // 同期間隔を10秒に広げて安定化
    return () => clearInterval(timer);
  }, [updateMarket]);

  // 現実のWeb価格と同期する
  const handleWebPriceSync = async () => {
    if (isSyncingWithWeb) return;
    setIsSyncingWithWeb(true);
    setApiStatus('SYNCING');
    try {
      const realPrices = await syncMarketPricesBySearch(INITIAL_SYMBOLS);
      
      // 全シンボルの信号を更新
      setMarketSignals(prev => prev.map(s => ({
        ...s,
        price: realPrices[s.symbol] || s.price,
        isSyncing: false
      })));

      // 現在のチャート履歴も同期
      const currentRealPrice = realPrices[selectedSymbol];
      if (currentRealPrice) {
        setStockHistory(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const diff = currentRealPrice - last.close;
          return prev.map(d => ({
            ...d, open: d.open + diff, close: d.close + diff, high: d.high + diff, low: d.low + diff
          }));
        });
        setIsSynced(true);
        setSyncMessage(`Synced ${selectedSymbol} to $${currentRealPrice.toFixed(2)}`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
      setApiStatus('IDLE');
    } catch (err: any) {
      setApiStatus('ERROR');
    } finally {
      setIsSyncingWithWeb(false);
    }
  };

  const handleAIAnalysis = useCallback(async (targetSymbol = selectedSymbol, targetHorizon = horizon) => {
    if (isAnalyzing || stockHistoryRef.current.length === 0) return;
    setIsAnalyzing(true);
    setApiStatus('SYNCING');
    try {
      const result = await analyzeMarket(targetSymbol, stockHistoryRef.current, news, ({} as any), targetHorizon, userInsight);
      setAnalysis(result);
      setIsSynced(true);
      setApiStatus('IDLE');
    } catch (err: any) {
      if (err?.message?.includes('429')) setApiStatus('RATE_LIMITED');
      else setApiStatus('ERROR');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSymbol, horizon, news, isAnalyzing, userInsight]);

  useEffect(() => {
    const initData = async () => {
      const initialPrice = await fetchLivePrice(selectedSymbol);
      const mock = generateMockStockData(selectedSymbol, 120, initialPrice);
      setStockHistory(mock);
      setAnalysis(null);
      setIsSynced(false);
    };
    initData();
  }, [selectedSymbol]);

  const executeTrade = useCallback((type: 'BUY' | 'SELL', amount: number) => {
    if (stockHistory.length === 0) return;
    const currentPrice = stockHistory[stockHistory.length - 1].close;
    setTrades(prev => [{ id: Math.random().toString(36).substr(2, 9), symbol: selectedSymbol, type, price: currentPrice, amount, time: new Date().toLocaleTimeString(), status: 'OPEN' }, ...prev]);
    setBalance(prev => type === 'BUY' ? prev - (currentPrice * amount) : prev + (currentPrice * amount));
  }, [stockHistory, selectedSymbol]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-bolt-lightning text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">HYBRID OMEGA</h1>
              <span className="text-[8px] text-indigo-400 uppercase font-black">2025 Market Grounded</span>
            </div>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
            {(['SCALP', 'DAY', 'SWING'] as TradingHorizon[]).map((h) => (
              <button key={h} onClick={() => setHorizon(h)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${horizon === h ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{h}</button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
           {syncMessage && (
             <div className="absolute top-16 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl animate-bounce z-[60] flex items-center gap-2">
               <i className="fa-solid fa-check-circle"></i> {syncMessage}
             </div>
           )}

           <button 
             onClick={handleWebPriceSync}
             disabled={isSyncingWithWeb}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
               isSyncingWithWeb 
               ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-wait' 
               : 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]'
             }`}
           >
             <i className={`fa-solid fa-rotate ${isSyncingWithWeb ? 'animate-spin' : ''}`}></i>
             {isSyncingWithWeb ? 'Synchronizing...' : 'Web価格と同期'}
           </button>

           <div className="text-right bg-indigo-500/5 px-4 py-1.5 rounded-xl border border-indigo-500/20">
            <div className="text-[9px] text-slate-500 uppercase font-black mb-1">BALANCE</div>
            <div className="text-lg font-mono font-bold text-green-400 leading-none">${balance.toLocaleString()}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full overflow-hidden">
        <div className="lg:col-span-3 space-y-6">
          <MarketScanner signals={marketSignals} onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} />
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between">
              <span>マーケット統計</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sky-400">DATA SYNCED</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[8px] text-slate-500 font-black uppercase mb-1">CONFIDENCE</div>
                <div className="text-lg font-mono font-black text-white">{analysis?.confidence || '--'}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[8px] text-slate-500 font-black uppercase mb-1">PROFIT FACTOR</div>
                <div className="text-lg font-mono font-black text-amber-500">{analysis?.backtest?.profitFactor || '--'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <TradingChart data={stockHistory} symbol={selectedSymbol} />
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI 洞察検証中...</p>
              </div>
            )}
            <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-brain text-indigo-400 text-xs"></i>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-100">AI ストラテジー検証</h3>
              </div>
              <button onClick={() => handleAIAnalysis()} disabled={isAnalyzing} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-6 py-2 rounded-xl transition-all shadow-lg active:scale-95">
                市場背景を分析する
              </button>
            </div>
            <div className="p-6">
              {analysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                  <div className="space-y-4">
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                      <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">AI解析結果</div>
                      <p className="text-sm font-bold text-white leading-relaxed">{analysis.recommendation}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-40 overflow-y-auto custom-scrollbar">
                      <div className="text-[8px] font-black text-slate-500 uppercase mb-2">検証データ</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">{analysis.reasoning}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between p-3 bg-green-500/5 rounded-xl border border-green-500/20 items-center">
                      <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">目標価格 (T/P)</span>
                      <span className="font-mono font-bold text-white">${analysis.targetPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/20 items-center">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">損切価格 (S/L)</span>
                      <span className="font-mono font-bold text-white">${analysis.stopLoss?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 items-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase">信頼スコア</span>
                      <span className="font-mono font-bold text-indigo-400">{analysis.confidence}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 opacity-40">
                   <i className="fa-solid fa-robot text-4xl mb-2"></i>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">右下で考察を入力し「分析する」をクリック</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <TradePanel 
            currentPrice={stockHistory.length > 0 ? stockHistory[stockHistory.length - 1].close : 0} 
            symbol={selectedSymbol} 
            onExecute={executeTrade}
            onInsightUpdate={setUserInsight}
          />
          <AIAssistant context={`銘柄: ${selectedSymbol}, 最新価格: ${stockHistory.length > 0 ? stockHistory[stockHistory.length-1].close : '取得中'}`} />
        </div>
      </main>
    </div>
  );
};

export default App;
