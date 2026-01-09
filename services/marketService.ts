
import { StockData } from "../types";

/**
 * 実データに近い価格情報を取得するサービス。
 */
export const fetchLivePrice = async (symbol: string): Promise<number> => {
  try {
    // 仮想通貨: CoinGecko API
    if (symbol === 'BTC/USD' || symbol === 'ETH/USD') {
      const id = symbol === 'BTC/USD' ? 'bitcoin' : 'ethereum';
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      if (response.ok) {
        const data = await response.json();
        return data[id].usd;
      }
    }
  } catch (e) {
    console.warn("External API fetch failed, using updated engine fallback.");
  }

  // 2025年最新価格ベース
  const basePrices: Record<string, number> = {
    'NVDA': 185.04, // 厳密に固定
    'AAPL': 242.15,
    'TSLA': 258.40,
    'GOOGL': 192.30,
    'BTC/USD': 96520.00,
    'ETH/USD': 2680.50
  };
  
  const base = basePrices[symbol] || 100;
  // ドリフトを0.02%から0.01%に抑制し、現実価格との一致を優先
  const drift = (Math.random() - 0.5) * (base * 0.0001);
  return base + drift;
};

export const getLiveMarketUpdate = async (symbols: string[]) => {
  const results = await Promise.all(symbols.map(async (s) => {
    const price = await fetchLivePrice(s);
    return {
      symbol: s,
      price,
      change: (Math.random() - 0.49) * 0.3
    };
  }));
  return results;
};
