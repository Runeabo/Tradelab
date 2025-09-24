import { PriceData, Asset } from '../types';
import { TOTAL_DATA_POINTS } from '../constants';

// Simple moving average calculator
const calculateSMA = (data: number[], period: number): (number | undefined)[] => {
    const sma: (number | undefined)[] = new Array(data.length).fill(undefined);
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        sma[i] = slice.reduce((sum, val) => sum + val, 0) / period;
    }
    return sma;
};

// Relative Strength Index calculator
const calculateRSI = (data: number[], period: number = 14): (number | undefined)[] => {
    const rsi: (number | undefined)[] = new Array(data.length).fill(undefined);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        if (i <= period) {
            if (change > 0) gains += change;
            else losses -= change;
        } else {
            if (change > 0) {
                gains = (gains * (period - 1) + change) / period;
                losses = (losses * (period - 1)) / period;
            } else {
                gains = (gains * (period - 1)) / period;
                losses = (losses * (period - 1) - change) / period;
            }
        }
        
        if (i >= period) {
            if (losses === 0) {
                rsi[i] = 100;
            } else {
                const rs = gains / losses;
                rsi[i] = 100 - (100 / (1 + rs));
            }
        }
    }
    return rsi;
}

// Average True Range calculator (simplified for single price point)
const calculateATR = (data: number[], period: number = 14): (number | undefined)[] => {
    const atr: (number | undefined)[] = new Array(data.length).fill(undefined);
    if (data.length < 2) return atr;

    const tr: number[] = [data[0] * 0.01]; // Initial TR as 1% of first price
    for (let i = 1; i < data.length; i++) {
        // Simplified TR for single price point data: absolute change
        tr.push(Math.abs(data[i] - data[i - 1]));
    }

    let sumTR = 0;
    for (let i = 0; i < period; i++) {
        sumTR += tr[i];
    }
    atr[period - 1] = sumTR / period;
    
    for (let i = period; i < data.length; i++) {
        atr[i] = (atr[i - 1]! * (period - 1) + tr[i]) / period;
    }

    return atr;
};


// Generate a synthetic price series using a geometric Brownian motion model
const generatePriceSeries = (startPrice: number, drift: number, volatility: number, length: number): number[] => {
    const prices = [startPrice];
    for (let i = 1; i < length; i++) {
        const randomComponent = (Math.random() - 0.5) * 2; // -1 to 1
        const priceChange = prices[i-1] * (drift + volatility * randomComponent);
        const newPrice = prices[i - 1] + priceChange;
        prices.push(Math.max(newPrice, 1)); // prevent price from going to zero
    }
    return prices;
};


const generateFullDataSet = (): { [key in Asset]: PriceData[] } => {
    const assets = Object.values(Asset);
    const dataSet: { [key in Asset]?: PriceData[] } = {};

    assets.forEach((asset, index) => {
        const startPrice = 100 + index * 50;
        const drift = (Math.random() - 0.45) * 0.001;
        const volatility = 0.01 + Math.random() * 0.03;
        
        const prices = generatePriceSeries(startPrice, drift, volatility, TOTAL_DATA_POINTS);
        const sma10 = calculateSMA(prices, 10);
        const sma20 = calculateSMA(prices, 20);
        const rsi14 = calculateRSI(prices, 14);
        const atr14 = calculateATR(prices, 14);

        dataSet[asset] = prices.map((price, i) => ({
            time: i,
            price: price,
            sma10: sma10[i],
            sma20: sma20[i],
            rsi: rsi14[i],
            atr: atr14[i],
            // volatility is more complex, ATR is a good proxy for this simulation
            volatility: atr14[i] ? atr14[i]! / price : undefined,
        }));
    });

    return dataSet as { [key in Asset]: PriceData[] };
}

const fullDataSet = generateFullDataSet();

export const getDataSlice = (asset: Asset, start: number, length: number): PriceData[] => {
    if (!fullDataSet[asset]) {
        throw new Error(`No data for asset ${asset}`);
    }
    return fullDataSet[asset].slice(start, start + length);
};
