
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TradingChart from './components/TradingChart';
import MarketScanner from './components/MarketScanner';
import ConfidenceGauge from './components/ConfidenceGauge';
import AIAssistant from './components/AIAssistant';
import UsageGuide from './components/UsageGuide';
import { generateMockStockData, MOCK_NEWS, INITIAL_SYMBOLS } from './constants';
import { StockData, Trade, MarketAnalysis, TradingHorizon } from './types';
import { analyzeMarket, syncMarketPricesBySearch } from './services/geminiService';
import { fetchLivePrice, getLiveMarketUpdate } from './services/marketService';

const App: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(INITIAL_SYMBOLS[0]);
  const [horizon, setHorizon] = useState<TradingHorizon>('DAY');
  const [stockHistory, setStockHistory] = useState<StockData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [balance, setBalance] = useState(100000);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  // 1. 高速APIを使用して全銘柄の価格を更新
  const fastPriceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const updates = await getLiveMarketUpdate(INITIAL_SYMBOLS);
      setMarketSignals(prev => prev.map(s => {
        const up = updates.find(u => u.symbol === s.symbol);
        return up ? { ...s, price: up.price, isSyncing: false } : s;
      }));
      
      const currentPrice = updates.find(u => u.symbol === selectedSymbol)?.price;
      if (currentPrice) {
        const mock = generateMockStockData(selectedSymbol, 120, currentPrice);
        setStockHistory(mock);
      }
    } catch (e) {
      console.error("Fast sync failed, trying Gemini fallback...");
      // APIが死んでいる場合のみGeminiで検索を試みる
      const webPrices = await syncMarketPricesBySearch(INITIAL_SYMBOLS);
      setMarketSignals(prev => prev.map(s => ({
        ...s,
        price: webPrices[s.symbol] || s.price,
        isSyncing: false
      })));
    } finally {
      setIsSyncing(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fastPriceSync();
  }, []);

  // 10秒ごとの自動価格更新 (API使用)
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
    const timer = setInterval(updateMarket, 10000);
    return () => clearInterval(timer);
  }, [updateMarket]);

  const handleAIAnalysis = useCallback(async (targetSymbol = selectedSymbol, targetHorizon = horizon) => {
    if (isAnalyzing || stockHistoryRef.current.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarket(targetSymbol, stockHistoryRef.current, MOCK_NEWS, ({} as any), targetHorizon, "");
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSymbol, horizon, isAnalyzing]);

  useEffect(() => {
    const initData = async () => {
      const initialPrice = await fetchLivePrice(selectedSymbol);
      const mock = generateMockStockData(selectedSymbol, 120, initialPrice);
      setStockHistory(mock);
      setAnalysis(null);
    }
    initData();
  }, [selectedSymbol]);

  const executeTrade = useCallback((type: 'BUY' | 'SELL', amount: number) => {
    if (stockHistory.length === 0) return;
    const currentPrice = stockHistory[stockHistory.length - 1].close;
    const tradeValue = currentPrice * amount;
    setTrades(prev => [{ id: Math.random().toString(36).substr(2, 9), symbol: selectedSymbol, type, price: currentPrice, amount, time: new Date().toLocaleTimeString(), status: 'OPEN' }, ...prev]);
    setBalance(prev => type === 'BUY' ? prev - tradeValue : prev + tradeValue);
  }, [stockHistory, selectedSymbol]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      {showGuide && <UsageGuide onClose={() => setShowGuide(false)} />}
      
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-bolt text-white"></i>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">AI QUANT TERMINAL</h1>
              <span className="text-[7px] text-indigo-400 uppercase font-black">Hybrid Data Engine: API + Gemini</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <button onClick={() => setShowGuide(true)} className="text-slate-400 hover:text-white transition-colors">
             <i className="fa-solid fa-circle-question text-lg"></i>
           </button>
           <button onClick={fastPriceSync} disabled={isSyncing} className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase border border-indigo-500/30 px-3 py-1.5 rounded-md flex items-center gap-2">
             <i className={`fa-solid fa-sync ${isSyncing ? 'animate-spin' : ''}`}></i>
             {isSyncing ? 'Syncing...' : 'Quick Price Sync'}
           </button>
           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(['SCALP', 'DAY', 'SWING'] as TradingHorizon[]).map((h) => (
              <button key={h} onClick={() => setHorizon(h)} className={`px-4 py-1 rounded-[6px] text-[9px] font-black transition-all ${horizon === h ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{h}</button>
            ))}
          </div>
          <div className="text-right ml-4">
            <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Balance</div>
            <div className="text-base font-mono font-bold text-green-400 leading-none">${balance.toLocaleString()}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-64px)] overflow-hidden">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
          <MarketScanner signals={marketSignals} onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} onExecute={executeTrade} />
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">AI 予測シグナル</h3>
            <ConfidenceGauge value={analysis?.confidence || 0} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                <div className="text-[7px] text-slate-500 font-black uppercase">Win Rate</div>
                <div className="text-xs font-mono font-black text-white">{analysis?.backtest?.winRate ? `${analysis.backtest.winRate}%` : '--'}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                <div className="text-[7px] text-slate-500 font-black uppercase">Sentiment</div>
                <div className={`text-[10px] font-black uppercase ${analysis?.trend === 'BULLISH' ? 'text-green-400' : analysis?.trend === 'BEARISH' ? 'text-red-400' : 'text-slate-400'}`}>
                  {analysis?.trend || '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
          <TradingChart data={stockHistory} symbol={selectedSymbol} analysis={analysis} trades={trades} />
          
          <div className="grid grid-cols-12 gap-6 pb-6">
            <div className="col-span-12 lg:col-span-8">
               <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[400px]">
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Analyzing Live Markets via Gemini...</p>
                  </div>
                )}
                
                <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-100">AI 戦略カード</h3>
                  </div>
                  <button 
                    onClick={() => handleAIAnalysis()} 
                    disabled={isAnalyzing} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black px-8 py-2.5 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    AI にマーケット分析を依頼
                  </button>
                </div>

                <div className="p-6">
                  {analysis ? (
                    <div className="animate-fadeIn space-y-6">
                      <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/20">
                        <div className="text-[8px] font-black text-indigo-400 uppercase mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-lightbulb"></i> AIの結論
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed">{analysis.recommendation}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="text-[8px] font-black text-slate-500 uppercase mb-2">戦略的根拠</div>
                          <p className="text-[11px] text-slate-400 leading-relaxed italic">{analysis.reasoning}</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="text-[8px] font-black text-slate-500 uppercase mb-2">検証済みソース</div>
                          <div className="space-y-2 mt-2">
                            {analysis.sources?.slice(0, 3).map((s, i) => (
                              <a key={i} href={s.uri} target="_blank" rel="noopener" className="block text-[9px] text-indigo-400 hover:underline truncate">
                                <i className="fa-solid fa-link mr-1"></i> {s.title}
                              </a>
                            )) || <span className="text-[9px] text-slate-600">No sources found</span>}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="text-[8px] font-black text-slate-500 uppercase mb-4 text-center">実行プロトコル</div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center border-r border-slate-800">
                            <span className="text-[8px] font-black text-green-500 uppercase block mb-1">Target</span>
                            <span className="font-mono font-bold text-green-400 text-lg">${analysis.targetPrice?.toLocaleString()}</span>
                          </div>
                          <div className="text-center border-r border-slate-800">
                            <span className="text-[8px] font-black text-red-500 uppercase block mb-1">Stop Loss</span>
                            <span className="font-mono font-bold text-red-400 text-lg">${analysis.stopLoss?.toLocaleString()}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Alpha Score</span>
                            <span className="font-mono font-bold text-indigo-300 text-lg">{analysis.alphaScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                      <i className="fa-solid fa-microchip text-6xl mb-4"></i>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">分析を開始すると戦略カードが生成されます</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 h-full">
              <AIAssistant context={`Current Symbol: ${selectedSymbol}, Price: ${stockHistory[stockHistory.length-1]?.close || 'N/A'}`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
