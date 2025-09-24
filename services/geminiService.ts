import { GoogleGenAI, Type } from "@google/genai";
import { PriceData, TradeSignal, TradeAction, Asset, DifficultyLevel } from "../types";
import { MAX_POSITION_SIZE } from '../constants';

// FIX: Initialize GoogleGenAI directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const featuresSnapshotSchema = {
    type: Type.OBJECT,
    properties: {
        SMA10: { type: Type.NUMBER, description: '10-period Simple Moving Average.' },
        SMA20: { type: Type.NUMBER, description: '20-period Simple Moving Average.' },
        RSI: { type: Type.NUMBER, description: '14-period Relative Strength Index.' },
        ATR: { type: Type.NUMBER, description: '14-period Average True Range.' },
        volatility: { type: Type.NUMBER, description: '20-period historical volatility.' },
    },
    required: ['SMA10', 'SMA20', 'RSI', 'ATR', 'volatility'],
    description: 'A snapshot of key technical indicators at the time of decision.'
};

const tradeSignalSchema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.STRING,
      enum: [TradeAction.BUY, TradeAction.SELL, TradeAction.HOLD],
      description: 'The trading action to take.'
    },
    positionSize: {
      type: Type.NUMBER,
      description: `The fraction of the portfolio to use for the trade. Must be between 0.0 and ${MAX_POSITION_SIZE}.`
    },
    rationale: {
      type: Type.STRING,
      description: 'A brief, 60-word maximum rationale for the decision.'
    },
    confidence: {
        type: Type.NUMBER,
        description: 'A confidence score for this signal, from 0.0 (low) to 1.0 (high).'
    },
    features_snapshot: featuresSnapshotSchema,
  },
  required: ['action', 'positionSize', 'rationale', 'confidence', 'features_snapshot']
};

const multiTradeSignalSchema = (count: number) => ({
    type: Type.ARRAY,
    items: tradeSignalSchema,
    minItems: count,
    maxItems: count,
    description: `An array of exactly ${count} distinct trade signals.`
});


const getPrompt = (
    difficulty: DifficultyLevel,
    asset: Asset,
    currentCash: number,
    currentHoldings: number,
    currentDataPoint: PriceData,
    portfolioValue: number,
    formattedHistory: string
) => {
    const { price: currentPrice, sma10, sma20, rsi, atr, volatility } = currentDataPoint;

    const commonIntro = `You are a financial analyst in a simulated trading game. Your goal is to maximize portfolio value by trading ${asset}. Analyze the following recent market data and your current portfolio status to provide a trading signal. You MUST include a snapshot of the current technical indicators in the 'features_snapshot' field.`;

    const commonPortfolio = `
    Current Portfolio:
    - Cash: $${currentCash.toFixed(2)}
    - Asset Holdings (${asset}): ${currentHoldings.toFixed(4)} units
    - Total Portfolio Value: $${portfolioValue.toFixed(2)}`;
    
    const currentIndicators = `
    Current Technical Indicators:
    - Price: $${currentPrice.toFixed(2)}
    - SMA (10-period): ${sma10?.toFixed(2) || 'N/A'}
    - SMA (20-period): ${sma20?.toFixed(2) || 'N/A'}
    - RSI (14-period): ${rsi?.toFixed(2) || 'N/A'}
    - ATR (14-period): ${atr?.toFixed(4) || 'N/A'}
    - Volatility (20-period): ${volatility?.toFixed(4) || 'N/A'}`;

    const commonRules = `
    - Your position size must be a fraction of the total portfolio value, between 0.0 and ${MAX_POSITION_SIZE}.
    - Your rationale must be concise and under 60 words.
    - You must provide a confidence score between 0.0 and 1.0 for your signal.
    - If current holdings are 0, you cannot SELL. If current cash is too low, you cannot BUY.
    - Be cautious. Preserve capital. Small, calculated risks are better than large, speculative ones.
    - Provide all indicator values in the 'features_snapshot' object, even if they are null or N/A.`;

    const fullContext = `${commonIntro}
    ${commonPortfolio}
    ${currentIndicators}

    Recent Market Data (Time, Price, SMA10, SMA20, RSI, ATR, Volatility):
    ${formattedHistory}
    ${commonRules}`;


    switch (difficulty) {
        case DifficultyLevel.PRO:
            return `${fullContext} As an expert quantitative analyst, provide three advanced and distinct trading strategies in a JSON array format, each with its own rationale and feature snapshot.
            1. A short-term momentum strategy based on recent price action and RSI.
            2. A medium-term trend-following strategy using the Simple Moving Averages (SMA).
            3. A risk-averse strategy prioritizing capital preservation based on volatility and ATR.`;
        case DifficultyLevel.INTERMEDIATE:
            return `${fullContext} Provide two distinct trading strategies in a JSON array format, each with its rationale and feature snapshot. One should be a more aggressive, momentum-following strategy, and the other a more cautious, mean-reversion strategy.`;
        case DifficultyLevel.BEGINNER:
        default:
            return `${fullContext} Provide a single trading signal in JSON format, including its rationale and the feature snapshot.`;
    }
};

const processSignal = (parsedSignal: any, currentCash: number, currentHoldings: number, portfolioValue: number): TradeSignal => {
    let rawRationale = parsedSignal.rationale;
    let finalRationale: string;

    if (typeof rawRationale === 'string' && rawRationale.trim()) {
        const words = rawRationale.trim().split(/\s+/);
        if (words.length > 60) {
            finalRationale = words.slice(0, 60).join(' ') + '...';
        } else {
            finalRationale = rawRationale;
        }
    } else {
        finalRationale = "No valid rationale was provided by the AI.";
    }

    let finalAction = parsedSignal.action as TradeAction;
    let finalPositionSize = Math.max(0, Math.min(MAX_POSITION_SIZE, Number(parsedSignal.positionSize) || 0));

    if (finalAction === TradeAction.SELL && currentHoldings <= 0) {
        finalAction = TradeAction.HOLD;
        finalRationale = "AI suggested SELL but no assets to sell. Holding instead.";
        finalPositionSize = 0;
    }
    if (finalAction === TradeAction.BUY && currentCash < portfolioValue * finalPositionSize) {
        finalAction = TradeAction.HOLD;
        finalRationale = "AI suggested BUY but insufficient cash. Holding instead.";
        finalPositionSize = 0;
    }

    const confidence = Math.max(0, Math.min(1, Number(parsedSignal.confidence) || 0));

    return {
        source: 'Gemini AI',
        action: finalAction,
        positionSize: finalPositionSize,
        rationale: finalRationale,
        features_snapshot: parsedSignal.features_snapshot,
        confidence: confidence,
    };
};


export const getAITradeSignal = async (
  priceHistory: PriceData[],
  currentCash: number,
  currentHoldings: number,
  asset: Asset,
  difficulty: DifficultyLevel,
): Promise<TradeSignal[]> => {
  if (!ai) {
     throw new Error("Gemini AI Service not initialized. Check API Key.");
  }

  const currentDataPoint = priceHistory[priceHistory.length - 1];
  if (!currentDataPoint) {
      // Handle case with no history
      return [{
          source: 'Gemini AI',
          action: TradeAction.HOLD,
          positionSize: 0,
          rationale: "Not enough market data to make a decision.",
      }];
  }
  const currentPrice = currentDataPoint.price;
  const portfolioValue = currentCash + currentHoldings * currentPrice;
  const recentData = priceHistory.slice(-20);
  
  const formattedHistory = recentData.map(p =>
    `T: ${p.time}, P: ${p.price.toFixed(2)}, S10: ${p.sma10?.toFixed(2)}, S20: ${p.sma20?.toFixed(2)}, RSI: ${p.rsi?.toFixed(2)}, ATR: ${p.atr?.toFixed(4)}, Vol: ${p.volatility?.toFixed(4)}`
  ).join('\n');

  const prompt = getPrompt(difficulty, asset, currentCash, currentHoldings, currentDataPoint, portfolioValue, formattedHistory);
  let schema: any;

  switch (difficulty) {
      case DifficultyLevel.PRO:
          schema = multiTradeSignalSchema(3);
          break;
      case DifficultyLevel.INTERMEDIATE:
          schema = multiTradeSignalSchema(2);
          break;
      default:
          schema = tradeSignalSchema;
          break;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);

    const signals = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    return signals.map(s => processSignal(s, currentCash, currentHoldings, portfolioValue));

  } catch (error) {
    console.error("Error fetching trade signal from Gemini:", error);
    return [{
      source: 'Gemini AI',
      action: TradeAction.HOLD,
      positionSize: 0,
      rationale: "An error occurred while communicating with the AI. Defaulting to HOLD for safety.",
    }];
  }
};