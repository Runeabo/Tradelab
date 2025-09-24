import React, { useState, useEffect, useMemo } from 'react';
import { User, RoundLog, Asset, TradeAction } from '../types';
import { getRoundAnalytics } from '../services/gameService';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { AssetTicker } from '../constants';

const Analytics: React.FC<{ user: User }> = ({ user }) => {
  const [logs, setLogs] = useState<RoundLog[]>([]);

  useEffect(() => {
    const userLogs = getRoundAnalytics().filter(log => log.userEmail === user.email);
    setLogs(userLogs);
  }, [user.email]);

  const performanceOverTime = useMemo(() => {
    return logs.map((log, index) => ({
      name: `Game ${index + 1}`,
      performance: log.performance,
    })).slice(-20); // show last 20 games
  }, [logs]);

  const performanceByAsset = useMemo(() => {
    const byAsset: { [key in Asset]?: { totalPerf: number, count: number } } = {};
    logs.forEach(log => {
        if (!byAsset[log.asset]) {
            byAsset[log.asset] = { totalPerf: 0, count: 0 };
        }
        byAsset[log.asset]!.totalPerf += log.performance;
        byAsset[log.asset]!.count++;
    });

    return Object.entries(byAsset).map(([asset, data]) => ({
      asset: AssetTicker[asset as Asset],
      averagePerformance: data.totalPerf / data.count,
    }));
  }, [logs]);

  const tradeActionDistribution = useMemo(() => {
      const counts: {[key in TradeAction]: number} = { [TradeAction.BUY]: 0, [TradeAction.SELL]: 0, [TradeAction.HOLD]: 0 };
      logs.forEach(log => {
          log.decisions.forEach(dec => {
              if (counts[dec.action] !== undefined) {
                  counts[dec.action]++;
              }
          })
      });
      return [
          { name: 'Buy', value: counts.BUY },
          { name: 'Sell', value: counts.SELL },
          { name: 'Hold', value: counts.HOLD },
      ].filter(item => item.value > 0);
  }, [logs]);

  const COLORS = ['#22C55E', '#EF4444', '#9CA3AF'];

  if (logs.length === 0) {
    return <div className="text-center p-10 bg-gray-800 rounded-lg"><p className="text-gray-400">No game data available. Play a few rounds to see your analytics!</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-center text-white mb-8">Your Trading Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Over Time (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#D1D5DB" />
              <YAxis stroke="#D1D5DB" />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
              <Legend />
              <Line type="monotone" dataKey="performance" stroke="#38BDF8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">Average Performance by Asset (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByAsset}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="asset" stroke="#D1D5DB" />
              <YAxis stroke="#D1D5DB" />
              <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
              <Legend />
              <Bar dataKey="averagePerformance" fill="#818CF8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

         {tradeActionDistribution.length > 0 && <div className="p-6 bg-gray-800 rounded-xl shadow-2xl lg:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Trade Action Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={tradeActionDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {tradeActionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>}
      </div>
    </div>
  );
};

export default Analytics;
