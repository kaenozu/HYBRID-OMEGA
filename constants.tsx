
import React from 'react';
import { StockData, NewsItem } from './types';

export const INITIAL_SYMBOLS = ['NVDA', 'BTC/USD', 'AAPL', 'TSLA', 'ETH/USD', 'GOOGL'];

export const generateMockStockData = (symbol: string, count: number = 50, basePrice?: number): StockData[] => {
  // ユーザーの指摘に基づいた2025年最新の実勢価格
  let currentPrice = basePrice || 200;
  if (!basePrice) {
    if (symbol === 'NVDA') currentPrice = 185.04; // 最新価格に固定
    else if (symbol === 'BTC/USD') currentPrice = 96520;
    else if (symbol === 'ETH/USD') currentPrice = 2680;
    else if (symbol === 'AAPL') currentPrice = 242.15;
    else if (symbol === 'TSLA') currentPrice = 258.40;
    else if (symbol === 'GOOGL') currentPrice = 192.30;
  }

  const data: StockData[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // ボラティリティを0.12%から0.08%に下げ、現実からの乖離を抑える
    const volatility = currentPrice * 0.0008; 
    const open = currentPrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.2);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.2);
    const volume = Math.floor(Math.random() * 500000) + 100000;
    
    data.push({ time, open, high, low, close, volume });
    currentPrice = close;
  }
  return data;
};

export const MOCK_NEWS: NewsItem[] = [
  { id: '1', headline: "NVDA, 次世代チップ需要により時価総額首位を争う展開", source: "Bloomberg", time: "1分前" },
  { id: '2', headline: "米経済指標、予想を上回る堅調さでドル買い優勢", source: "CNBC", time: "8分前" },
  { id: '3', headline: "ビットコイン、調整局面を経て再び10万ドルへの挑戦を開始", source: "Reuters", time: "12分前" },
];
