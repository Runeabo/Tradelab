import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot, ReferenceLine } from 'recharts';
import { PriceData, TradeExecution, TradeAction, Position } from '../types';
import { useLocalization } from '../LocalizationContext';

interface PriceChartProps {
  data: PriceData[];
  trades: TradeExecution[];
  position: Position | null;
  sl: number | null;
  tp: number | null;
}

const ChartEmptyState = () => {
    const { t } = useLocalization();
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10 pointer-events-none rounded-lg">
            <p className="text-gray-300 text-lg text-center max-w-xs font-semibold">{t('arena.empty.tapToBuy')}</p>
        </div>
    )
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg shadow-lg text-sm">
        <p className="label text-white">{`Time: ${label}`}</p>
        <p className="intro text-blue-400">{`Price: $${data.price.toFixed(2)}`}</p>
        {data.sma10 && <p className="text-purple-400">{`SMA(10): $${data.sma10.toFixed(2)}`}</p>}
        {data.sma20 && <p className="text-indigo-400">{`SMA(20): $${data.sma20.toFixed(2)}`}</p>}
        {data.rsi && <p className="text-orange-400">{`RSI: ${data.rsi.toFixed(2)}`}</p>}
        {data.atr && <p className="text-yellow-400">{`ATR: ${data.atr.toFixed(4)}`}</p>}
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, trades, position, sl, tp }) => {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>;
  }
  
  const hasPosition = position && position.size > 0;
  
  return (
    <div className="relative w-full h-full">
        {!hasPosition && <ChartEmptyState />}
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
            data={data}
            margin={{
            top: 5, right: 30, left: 20, bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9CA3AF" />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#9CA3AF" tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#38BDF8" strokeWidth={2} dot={false} name="Price" />
            
            {hasPosition && position.entryPrice && (
                <ReferenceLine y={position.entryPrice} label={{ value: "Entry", position: 'right', fill: '#A5B4FC' }} stroke="#A5B4FC" strokeDasharray="3 3" />
            )}
            {hasPosition && sl && (
                <ReferenceLine y={sl} label={{ value: "SL", position: 'right', fill: '#F87171' }} stroke="#F87171" strokeDasharray="3 3" />
            )}
            {hasPosition && tp && (
                <ReferenceLine y={tp} label={{ value: "TP", position: 'right', fill: '#4ADE80' }} stroke="#4ADE80" strokeDasharray="3 3" />
            )}

            {trades.map((trade, index) => (
            <ReferenceDot
                key={index}
                x={trade.time}
                y={trade.price}
                r={5}
                fill={trade.action === TradeAction.BUY ? '#22C55E' : '#EF4444'}
                stroke="#1F2937"
            >
                <title>{`${trade.action} @ $${trade.price.toFixed(2)}`}</title>
            </ReferenceDot>
            ))}
        </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;