
import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  Label,
  ReferenceDot,
  Area,
  Scatter
} from 'recharts';
import { StockData, MarketAnalysis, Trade } from '../types';

interface TradingChartProps {
  data: StockData[];
  symbol: string;
  analysis?: MarketAnalysis | null;
  trades: Trade[];
}

const formatPrice = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

// 指数平滑移動平均 (EMA) の計算
const calculateEMA = (data: number[], period: number) => {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

// RSI の計算
const calculateRSI = (data: number[], period: number = 14) => {
  const rsi = new Array(data.length).fill(null);
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = 100 - (100 / (1 + avgGain / avgLoss));
  }
  return rsi;
};

const Candlestick = (props: any) => {
  const { x, y, width, height, open, close, high, low, isFuture } = props;
  if (open == null || close == null) return null;
  const isUp = close >= open;
  const color = isUp ? '#22c55e' : '#ef4444';
  const candleWidth = width * 0.7;
  const candleX = x + (width - candleWidth) / 2;
  const wickX = x + width / 2;
  const opacity = isFuture ? 0.3 : 0.8;

  // 価格をY座標に変換するスケールが必要だが、Rechartsが自動計算したheightを利用
  const absHeight = Math.abs(height);
  const priceRange = Math.abs(open - close);
  const pixelsPerUnit = absHeight / (priceRange || 0.0001);

  const wickTop = y - (high - Math.max(open, close)) * pixelsPerUnit;
  const wickBottom = y + absHeight + (Math.min(open, close) - low) * pixelsPerUnit;

  return (
    <g>
      <line x1={wickX} y1={wickTop} x2={wickX} y2={wickBottom} stroke={color} strokeWidth={1} strokeOpacity={opacity} />
      <rect x={candleX} y={y} width={candleWidth} height={Math.max(1, absHeight)} fill={color} fillOpacity={opacity} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-2xl text-[10px] backdrop-blur-md ring-1 ring-white/10">
        <p className="font-bold text-indigo-400 mb-2 border-b border-slate-700/50 pb-1 flex justify-between">
          <span>{data.time}</span>
          {data.isFuture && <span className="text-[8px] bg-indigo-500/20 px-1 rounded">PROJECTION</span>}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
          <span className="text-slate-500">O:</span> <span className="text-slate-200">{formatPrice(data.open)}</span>
          <span className="text-slate-500">H:</span> <span className="text-green-400">{formatPrice(data.high)}</span>
          <span className="text-slate-500">L:</span> <span className="text-red-400">{formatPrice(data.low)}</span>
          <span className="text-slate-500">C:</span> <span className="text-slate-200 font-bold">{formatPrice(data.close)}</span>
          {data.rsi && (
            <>
              <span className="text-slate-500">RSI:</span> 
              <span className={data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-indigo-300'}>
                {data.rsi.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol, analysis, trades }) => {
  const lastPrice = data.length > 0 ? data[data.length - 1].close : 0;

  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const prices = data.map(d => d.close);
    const ema20 = calculateEMA(prices, 20);
    const rsi = calculateRSI(prices, 14);

    const result = data.map((d, i) => ({
      ...d,
      ema20: ema20[i],
      rsi: rsi[i],
      isFuture: false,
      volColor: d.close >= d.open ? '#22c55e' : '#ef4444',
      tradeMarker: trades.find(t => t.time === d.time)?.type || null,
      targetPath: null,
      stopPath: null,
    }));

    if (analysis) {
      const futureSteps = 30;
      const lastClose = data[data.length - 1].close;
      for (let i = 1; i <= futureSteps; i++) {
        result.push({
          time: `+${i}m`,
          isFuture: true,
          open: null, close: null, high: null, low: null, volume: 0,
          targetPath: (i === futureSteps) ? analysis.targetPrice : (i === 1 ? lastClose : null),
          stopPath: (i === futureSteps) ? analysis.stopLoss : (i === 1 ? lastClose : null),
        } as any);
      }
    }
    return result;
  }, [data, analysis, trades]);

  const performance = useMemo(() => {
    if (trades.length === 0) return { pnl: 0, winRate: 0, count: 0 };
    let totalPnl = 0;
    let wins = 0;
    trades.forEach(trade => {
      const pnl = trade.type === 'BUY' ? (lastPrice - trade.price) * trade.amount : (trade.price - lastPrice) * trade.amount;
      totalPnl += pnl;
      if (pnl > 0) wins++;
    });
    return { pnl: totalPnl, winRate: (wins / trades.length) * 100, count: trades.length };
  }, [trades, lastPrice]);

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden relative group">
      {/* 装飾的な背景要素 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none rounded-full"></div>
      
      <div className="flex justify-between items-start z-10">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{symbol}</h2>
            <div className="flex flex-col">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-black rounded border border-green-500/20 uppercase">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                 Live Terminal
               </div>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {formatPrice(lastPrice)}
            </span>
            <span className={`text-sm font-black px-2 py-0.5 rounded ${performance.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {performance.pnl >= 0 ? '▲' : '▼'} {Math.abs(performance.pnl / 1000).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:grid grid-cols-2 gap-x-6 gap-y-1">
             <div className="flex items-center gap-2"><div className="w-2.5 h-0.5 bg-indigo-500"></div> <span className="text-[9px] font-black text-slate-500 uppercase">EMA 20</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-0.5 bg-slate-700"></div> <span className="text-[9px] font-black text-slate-500 uppercase">Volume</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-0.5 bg-green-500 border-t border-dashed"></div> <span className="text-[9px] font-black text-slate-500 uppercase">Target</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-0.5 bg-red-500 border-t border-dashed"></div> <span className="text-[9px] font-black text-slate-500 uppercase">Stop</span></div>
          </div>
          <div className="h-10 w-px bg-slate-800 mx-2"></div>
          <div className="text-right">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Market Sentiment</div>
            <div className={`text-sm font-black uppercase ${analysis?.trend === 'BULLISH' ? 'text-green-400' : analysis?.trend === 'BEARISH' ? 'text-red-400' : 'text-indigo-400'}`}>
              {analysis?.trend || 'CALIBRATING'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[500px] w-full mt-4">
        {/* メインチャートエリア (株価 + 移動平均) */}
        <div className="h-[350px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 4" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis 
                domain={['auto', 'auto']} 
                orientation="right" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line 
                type="monotone" 
                dataKey="ema20" 
                stroke="#6366f1" 
                strokeWidth={1.5} 
                dot={false} 
                strokeOpacity={0.6}
                connectNulls 
              />

              {/* トレードマーカー */}
              <Scatter dataKey="tradeMarker" shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload.tradeMarker) return null;
                const isBuy = payload.tradeMarker === 'BUY';
                return (
                  <g transform={`translate(${cx-8}, ${cy + (isBuy ? 20 : -20)})`}>
                    <circle r="8" fill={isBuy ? '#22c55e' : '#ef4444'} />
                    <text x="0" y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="black" pointerEvents="none">
                      {isBuy ? 'B' : 'S'}
                    </text>
                  </g>
                );
              }} />

              {/* AI予測パス */}
              <Line type="linear" dataKey="targetPath" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="6 4" connectNulls />
              <Line type="linear" dataKey="stopPath" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="6 4" connectNulls />

              {analysis && (
                <>
                  <ReferenceLine y={analysis.targetPrice} stroke="#22c55e" strokeOpacity={0.15} strokeWidth={1}>
                    <Label value={`TARGET ${formatPrice(analysis.targetPrice)}`} position="right" fill="#22c55e" fontSize={9} fontWeight="black" />
                  </ReferenceLine>
                  <ReferenceLine y={analysis.stopLoss} stroke="#ef4444" strokeOpacity={0.15} strokeWidth={1}>
                    <Label value={`STOP ${formatPrice(analysis.stopLoss)}`} position="right" fill="#ef4444" fontSize={9} fontWeight="black" />
                  </ReferenceLine>
                </>
              )}

              <Bar dataKey="close" shape={<Candlestick />}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fillOpacity={entry.isFuture ? 0 : 1} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* サブチャートエリア (RSI + Volume) */}
        <div className="h-[120px] w-full grid grid-cols-12 gap-2 border-t border-slate-800/50 pt-2">
          {/* RSI チャート */}
          <div className="col-span-8 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="1 8" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} orientation="right" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} ticks={[30, 70]} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
                <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.3} />
                <Line type="monotone" dataKey="rsi" stroke="#818cf8" strokeWidth={1.5} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="absolute left-6 bottom-32 text-[7px] font-black text-slate-600 uppercase">RSI (14)</div>
          </div>

          {/* 出来高 チャート */}
          <div className="col-span-4 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <Bar dataKey="volume">
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`vcell-${index}`} fill={entry.volColor} fillOpacity={0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="absolute right-6 bottom-32 text-[7px] font-black text-slate-600 uppercase">Volume</div>
          </div>
        </div>
      </div>

      {/* パフォーマンスバー */}
      <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-white/5 backdrop-blur-sm mt-2">
        <div className="flex gap-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Account Growth</span>
            <span className={`text-lg font-mono font-bold ${performance.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {performance.pnl >= 0 ? '+' : ''}{formatPrice(performance.pnl)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Win Accuracy</span>
            <span className="text-lg font-mono font-bold text-slate-200">
              {performance.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Open Risk</span>
            <span className="text-lg font-mono font-bold text-indigo-400">
              {trades.filter(t => t.status === 'OPEN').length} <span className="text-[10px] text-slate-500">POS</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
           <div className="text-right">
             <div className="text-[8px] font-black text-slate-500 uppercase">Quant Engine</div>
             <div className="text-[10px] font-bold text-indigo-400">V2.5 HYBRID</div>
           </div>
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <i className="fa-solid fa-microchip text-white text-lg"></i>
           </div>
        </div>
      </div>
    </div>
  );
};

// Rechartsの不足しているコンポーネントをインポートするため、BarChartを修正
import { BarChart } from 'recharts';

export default TradingChart;
