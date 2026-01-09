
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
  Area
} from 'recharts';
import { StockData } from '../types';

interface TradingChartProps {
  data: StockData[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-2xl text-[10px] backdrop-blur-md">
        <p className="font-bold text-sky-400 mb-2 border-b border-slate-700 pb-1">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
          <span className="text-slate-500">O:</span> <span className="text-slate-200">${data.open.toFixed(2)}</span>
          <span className="text-slate-500">H:</span> <span className="text-slate-200">${data.high.toFixed(2)}</span>
          <span className="text-slate-500">L:</span> <span className="text-slate-200">${data.low.toFixed(2)}</span>
          <span className="text-slate-500">C:</span> <span className="text-slate-200">${data.close.toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol }) => {
  const chartData = useMemo(() => {
    const period = 20;
    const closes = data.map(d => d.close);
    
    return data.map((d, i) => {
      if (i < period) return { ...d };
      
      const slice = closes.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      const stdDev = Math.sqrt(slice.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / period);
      
      return {
        ...d,
        sma20: avg,
        upper: avg + stdDev * 2,
        lower: avg - stdDev * 2
      };
    });
  }, [data]);

  const lastPrice = data[data.length - 1]?.close || 0;
  const prevPrice = data[data.length - 2]?.close || 0;
  const isUp = lastPrice >= prevPrice;

  return (
    <div className="w-full flex flex-col gap-2 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-white">{symbol}</span>
          <span className={`text-lg font-mono font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            ${lastPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500/20 rounded-sm"></div> Bollinger Band (20, 2σ)</div>
        </div>
      </div>

      <div className="h-[320px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Bollinger Band Area */}
            <Area dataKey="upper" stroke="none" fill="#6366f1" fillOpacity={0.05} />
            <Area dataKey="lower" stroke="none" fill="#0f172a" fillOpacity={1} />
            
            <Bar dataKey="close" barSize={6}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
              ))}
            </Bar>
            
            <Line type="monotone" dataKey="sma20" stroke="#6366f1" strokeWidth={1} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="upper" stroke="#4f46e5" strokeWidth={1} dot={false} opacity={0.3} />
            <Line type="monotone" dataKey="lower" stroke="#4f46e5" strokeWidth={1} dot={false} opacity={0.3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingChart;
