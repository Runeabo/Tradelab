import React, { useState, useEffect } from 'react';
import { LeaderboardEntryV2, User } from '../types';
import { getLeaderboardV2 } from '../services/gameService';
import { TrophyIcon } from './icons';
import Spinner from './Spinner';
import { useLocalization } from '../LocalizationContext';

interface LeaderboardProps {
  user: User | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [entries, setEntries] = useState<LeaderboardEntryV2[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocalization();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await getLeaderboardV2(period, user);
      setEntries(data);
      setIsLoading(false);
    };
    fetchLeaderboard();
  }, [period, user]);

  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.substring(0, 3)}***@${domain}`;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-yellow-600';
    return 'text-gray-500';
  };
  
  const currentUserEntry = user ? entries.find(e => e.email === user.email) : null;
  const topEntries = entries.slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-center text-white mb-2">{t('leaderboard.title')}</h2>
      
      <div className="flex justify-center my-6">
        <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
          <button onClick={() => setPeriod('daily')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${period === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>{t('leaderboard.tabs.daily')}</button>
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${period === 'weekly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>{t('leaderboard.tabs.weekly')}</button>
        </div>
      </div>
      
      {isLoading ? <div className="h-96 flex items-center justify-center"><Spinner /></div> : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-600">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-300">{t('leaderboard.columns.rank')}</th>
                <th className="p-4 text-sm font-semibold text-gray-300">{t('leaderboard.columns.trader')}</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">{t('leaderboard.columns.trades')}</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">{t('leaderboard.columns.totalPnl')}</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">{t('leaderboard.columns.bestR')}</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">{t('leaderboard.columns.winRate')}</th>
              </tr>
            </thead>
            <tbody>
              {topEntries.map((entry) => (
                <tr key={entry.rank} className={`border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 ${user?.email === entry.email ? 'bg-blue-900/50' : ''}`}>
                  <td className={`p-4 font-bold text-lg ${getMedalColor(entry.rank)}`}>
                    <div className="flex items-center space-x-2">
                        {entry.rank <= 3 && <TrophyIcon/>}
                        <span>{entry.rank}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">{maskEmail(entry.email)}</td>
                  <td className="p-4 text-right font-mono">{entry.trades}</td>
                  <td className={`p-4 text-right font-mono font-semibold ${entry.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${entry.realizedPnl.toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono text-blue-400">{entry.bestTradeR.toFixed(2)}R</td>
                  <td className="p-4 text-right font-mono">{entry.winRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topEntries.length === 0 && <p className="text-center text-gray-400 py-10">{t('leaderboard.emptySubtitle')}</p>}
        </div>
        
        {currentUserEntry && !topEntries.some(e => e.email === currentUserEntry.email) && (
            <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-600">
                <h3 className="text-lg font-semibold text-center text-gray-300 mb-4">{t('leaderboard.yourRank')}</h3>
                <table className="w-full">
                    <tbody>
                        <tr className="bg-blue-900/50">
                          <td className="p-4 font-bold text-lg w-[120px]">{currentUserEntry.rank}</td>
                          <td className="p-4 text-white">{maskEmail(currentUserEntry.email)}</td>
                          <td className="p-4 text-right font-mono">{currentUserEntry.trades}</td>
                          <td className={`p-4 text-right font-mono font-semibold ${currentUserEntry.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${currentUserEntry.realizedPnl.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-mono text-blue-400">{currentUserEntry.bestTradeR.toFixed(2)}R</td>
                          <td className="p-4 text-right font-mono">{currentUserEntry.winRate.toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
