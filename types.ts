
export interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TradingHorizon = 'SCALP' | 'DAY' | 'SWING';

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  time: string;
  status: 'OPEN' | 'CLOSED';
  pnl?: number;
}

export interface BacktestResult {
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgProfit: number;
  expectedReturn: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MarketAnalysis {
  sentiment: string;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  keyLevels: number[];
  recommendation: string;
  reasoning: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  alphaScore: number;
  actualPrice?: number;
  sources?: GroundingSource[];
  backtest: BacktestResult;
  suggestedHorizon?: string; // 推奨保持期間（例: "30分〜2時間", "1〜3日"）
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}
