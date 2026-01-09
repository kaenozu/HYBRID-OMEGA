
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
  referencePrice: number; // 分析時の基準価格
  actualPrice?: number;   // Google検索で取得した実勢価格
  sources?: GroundingSource[];
  backtest: BacktestResult;
  suggestedHorizon?: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}
