import { CustomStrategy, PriceData, StrategyCondition, Indicator, Operator, TradeSignal, TradeAction } from '../types';

const STRATEGIES_KEY = 'tradelab-strategies';

// --- CRUD Operations ---

export const getCustomStrategies = (userEmail: string): CustomStrategy[] => {
  const data = localStorage.getItem(STRATEGIES_KEY);
  if (!data) return [];
  const allStrategies: CustomStrategy[] = JSON.parse(data);
  return allStrategies.filter(s => s.userEmail === userEmail);
};

export const saveCustomStrategy = (strategy: CustomStrategy): void => {
  const allStrategies = JSON.parse(localStorage.getItem(STRATEGIES_KEY) || '[]') as CustomStrategy[];
  const existingIndex = allStrategies.findIndex(s => s.id === strategy.id);
  
  if (existingIndex > -1) {
    allStrategies[existingIndex] = strategy;
  } else {
    allStrategies.push(strategy);
  }
  
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(allStrategies));
};

export const deleteCustomStrategy = (strategyId: string, userEmail: string): void => {
  let allStrategies = JSON.parse(localStorage.getItem(STRATEGIES_KEY) || '[]') as CustomStrategy[];
  allStrategies = allStrategies.filter(s => !(s.id === strategyId && s.userEmail === userEmail));
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(allStrategies));
};

// --- Evaluation Logic ---

const getIndicatorValue = (indicator: Indicator, dataPoint?: PriceData): number | undefined => {
    if (!dataPoint) return undefined;
    switch(indicator) {
        case Indicator.PRICE: return dataPoint.price;
        case Indicator.SMA10: return dataPoint.sma10;
        case Indicator.SMA20: return dataPoint.sma20;
        case Indicator.RSI: return dataPoint.rsi;
    }
}

const checkCondition = (condition: StrategyCondition, current: PriceData, prev?: PriceData): boolean => {
    const val1_current = getIndicatorValue(condition.indicator1, current);
    
    if (val1_current === undefined) return false;

    // Handle crosses which require previous data
    if (condition.operator === Operator.CROSSES_ABOVE || condition.operator === Operator.CROSSES_BELOW) {
        if (!prev) return false; // Cannot check cross on first point
        const val1_prev = getIndicatorValue(condition.indicator1, prev);
        if (val1_prev === undefined) return false;
        
        let val2_current: number | undefined;
        let val2_prev: number | undefined;

        if (condition.compareTo === 'indicator') {
            val2_current = getIndicatorValue(condition.indicator2, current);
            val2_prev = getIndicatorValue(condition.indicator2, prev);
        } else {
            val2_current = val2_prev = condition.value;
        }

        if (val2_current === undefined || val2_prev === undefined) return false;

        if (condition.operator === Operator.CROSSES_ABOVE) {
            return val1_prev <= val2_prev && val1_current > val2_current;
        }
        if (condition.operator === Operator.CROSSES_BELOW) {
            return val1_prev >= val2_prev && val1_current < val2_current;
        }

    } else { // Handle simple level checks
        let val2_current: number | undefined;

        if (condition.compareTo === 'indicator') {
            val2_current = getIndicatorValue(condition.indicator2, current);
        } else {
            val2_current = condition.value;
        }

        if (val2_current === undefined) return false;

        if (condition.operator === Operator.IS_ABOVE) {
            return val1_current > val2_current;
        }
        if (condition.operator === Operator.IS_BELOW) {
            return val1_current < val2_current;
        }
    }
    
    return false;
};

export const evaluateCustomStrategy = (
  priceHistory: PriceData[],
  strategy: CustomStrategy,
): TradeSignal => {
  if (priceHistory.length < 2) {
    return {
      source: 'Custom Strategy',
      action: TradeAction.HOLD,
      positionSize: 0,
      rationale: "Not enough data to evaluate strategy.",
    };
  }

  const current = priceHistory[priceHistory.length - 1];
  const prev = priceHistory[priceHistory.length - 2];

  const buySignal = strategy.buyConditions.length > 0 && strategy.buyConditions.every(cond => checkCondition(cond, current, prev));
  if (buySignal) {
    return {
      source: 'Custom Strategy',
      action: TradeAction.BUY,
      positionSize: 0.25, // Default size for custom strategies
      rationale: `Strategy '${strategy.name}' triggered a BUY signal.`,
    };
  }

  const sellSignal = strategy.sellConditions.length > 0 && strategy.sellConditions.every(cond => checkCondition(cond, current, prev));
  if (sellSignal) {
    return {
      source: 'Custom Strategy',
      action: TradeAction.SELL,
      positionSize: 1.0, // Default to selling the whole position
      rationale: `Strategy '${strategy.name}' triggered a SELL signal.`,
    };
  }

  return {
    source: 'Custom Strategy',
    action: TradeAction.HOLD,
    positionSize: 0,
    rationale: `Strategy '${strategy.name}': No conditions met.`,
  };
};