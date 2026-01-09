
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, StockData, NewsItem, GroundingSource, TradingHorizon } from "../types";

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      if (isRateLimit && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Geminiの検索機能を使って、全銘柄の「今この瞬間」の価格をGoogleから取得します。
 */
export const syncMarketPricesBySearch = async (symbols: string[]): Promise<Record<string, number>> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `以下の金融銘柄のリアルタイム市場価格（USD）をGoogle検索で取得し、以下の形式のJSONで返してください。
      
      対象銘柄: ${symbols.join(', ')}
      
      制約事項:
      - キー名は必ず指定されたシンボル名（例: "NVDA", "BTC/USD"）と完全に一致させること。
      - 値は数値（float）のみ。通貨記号やカンマは含めない。
      - 不明な場合は現在の推測値や直近の終値を返す。
      
      例: {"NVDA": 185.04, "BTC/USD": 96520.0}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    
    try {
      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (e) {
      console.error("Sync parse error:", e);
      return {};
    }
  });
};

export const analyzeMarket = async (
  symbol: string, 
  history: StockData[], 
  news: NewsItem[],
  indicators: { rsi: number[], macd: number[], signal: number[] },
  horizon: TradingHorizon = 'DAY',
  userInsight: string = ""
): Promise<MarketAnalysis> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      【検証任務】
      銘柄: ${symbol} / 現在価格: ${history[history.length-1].close}
      ユーザー考察: "${userInsight || "なし"}"
      
      Google検索を使用して、直近の材料を確認し、ユーザーの考察が現在のトレンドと一致するか検証してください。
      また、チャート上の現在価格に基づき、具体的なエントリー・利確・損切戦略を日本語で提案してください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actualPrice: { type: Type.NUMBER },
            sentiment: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'SIDEWAYS'] },
            keyLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            entryPrice: { type: Type.NUMBER },
            targetPrice: { type: Type.NUMBER },
            stopLoss: { type: Type.NUMBER },
            recommendation: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            alphaScore: { type: Type.NUMBER },
            suggestedHorizon: { type: Type.STRING },
            backtest: {
              type: Type.OBJECT,
              properties: {
                winRate: { type: Type.NUMBER },
                totalTrades: { type: Type.NUMBER },
                profitFactor: { type: Type.NUMBER },
                expectedReturn: { type: Type.NUMBER }
              },
              required: ["winRate", "totalTrades", "profitFactor", "expectedReturn"]
            }
          },
          required: ["actualPrice", "sentiment", "trend", "keyLevels", "recommendation", "reasoning", "entryPrice", "targetPrice", "stopLoss", "confidence", "alphaScore", "suggestedHorizon", "backtest"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as MarketAnalysis;
  });
};

export const chatWithAI = async (message: string, context: string): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `あなたはクオンツ・アシスタントです。分析と戦略のみを提供してください。`,
      },
    });
    return response.text || "応答不能";
  });
};
