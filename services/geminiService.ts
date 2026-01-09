
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, StockData, NewsItem, GroundingSource, TradingHorizon } from "../types";

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED');
      
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
 * Syncs market prices. 
 * Fallback: If search grounding quota is hit, it attempts a standard generation.
 */
export const syncMarketPricesBySearch = async (symbols: string[]): Promise<Record<string, number>> => {
  const executeSync = async (useSearch: boolean) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const config: any = {
      responseMimeType: "application/json",
    };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `以下の金融銘柄の最新の市場価格（USD）を${useSearch ? 'Google検索を使用して' : ''}取得し、以下の形式のJSONで返してください。
      対象銘柄: ${symbols.join(', ')}
      制約事項:
      - キー名は必ずシンボル名と完全に一致させること。
      - 値は数値（float）のみ。`,
      config
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return {};
    }
  };

  try {
    return await withRetry(() => executeSync(true));
  } catch (error: any) {
    if (error?.message?.includes('search_grounding') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Search grounding quota exceeded, falling back to standard generation for prices.");
      return await withRetry(() => executeSync(false));
    }
    throw error;
  }
};

/**
 * Analyzes market data.
 * Fallback: If search grounding fails, it relies on provided history and news context.
 */
export const analyzeMarket = async (
  symbol: string, 
  history: StockData[], 
  news: NewsItem[],
  indicators: { rsi: number[], macd: number[], signal: number[] },
  horizon: TradingHorizon = 'DAY',
  userInsight: string = ""
): Promise<MarketAnalysis> => {
  const executeAnalysis = async (useSearch: boolean) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const currentPrice = history[history.length - 1].close;
    
    const prompt = `
      現在 ${symbol} の価格は $${currentPrice.toFixed(2)} です。
      ${useSearch ? 'Google検索を使用して、この銘柄に関する最新の金融ニュース、価格動向、アナリストの予測を調査してください。' : '提供されたデータに基づき、市場状況を分析してください。'}
      調査結果に基づき、チャート上の価格 $${currentPrice.toFixed(2)} からの T/P（目標価格）と S/L（損切価格）を算出してください。
    `;

    const config: any = {
      thinkingConfig: { thinkingBudget: 8000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actualPrice: { type: Type.NUMBER },
          referencePrice: { type: Type.NUMBER },
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
        required: ["actualPrice", "referencePrice", "sentiment", "trend", "keyLevels", "recommendation", "reasoning", "entryPrice", "targetPrice", "stopLoss", "confidence", "alphaScore", "suggestedHorizon", "backtest"]
      }
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config
    });

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || '参考ソース',
        uri: chunk.web?.uri || ''
      }))
      .filter((s: GroundingSource) => s.uri) || [];

    const parsed = JSON.parse(response.text || '{}');
    return { ...parsed, referencePrice: currentPrice, sources } as MarketAnalysis;
  };

  try {
    return await withRetry(() => executeAnalysis(true));
  } catch (error: any) {
    if (error?.message?.includes('search_grounding') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Search grounding quota exceeded, performing analysis without real-time web search.");
      return await withRetry(() => executeAnalysis(false));
    }
    throw error;
  }
};

export const chatWithAI = async (prompt: string, context: string): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Market Context: ${context}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are an expert financial analyst. Provide professional, concise, and data-driven answers based on the provided market context.",
      },
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  });
};
