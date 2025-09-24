import React, { useState, useEffect, useCallback } from 'react';
import { User, DailyChallenge, GameRound, LeaderboardEntry } from '../types';
import { getDailyChallenge, getDailyChallengeLeaderboard, updateDailyChallengeLeaderboard } from '../services/gameService';
import GameArena from './GameArena';
import Spinner from './Spinner';
import { TrophyIcon } from './icons';
import { AssetTicker } from '../constants';
import { useLocalization } from '../LocalizationContext';

const DailyLeaderboard: React.FC<{ entries: LeaderboardEntry[] }> = ({ entries }) => {
    const getMedalColor = (rank: number) => {
        if (rank === 0) return 'text-yellow-400';
        if (rank === 1) return 'text-gray-300';
        if (rank === 2) return 'text-yellow-600';
        return 'text-gray-500';
    };

    if (entries.length === 0) {
        return <p className="text-center text-gray-400">Be the first to complete the challenge today!</p>;
    }

    return (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-600">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-300">Rank</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Player</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Best Performance</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={index} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                  <td className={`p-4 font-bold text-lg ${getMedalColor(index)}`}>
                    <div className="flex items-center space-x-2">
                        {index < 3 && <TrophyIcon/>}
                        <span>{index + 1}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">{entry.email}</td>
                  <td className={`p-4 text-right font-semibold ${entry.bestPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.bestPerformance.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
};


const DailyChallengePage: React.FC<{ user: User }> = ({ user }) => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameState, setGameState] = useState<'info' | 'playing'>('info');
  const [lastPerformance, setLastPerformance] = useState<number | null>(null);
  const { t } = useLocalization();

  const loadChallengeData = useCallback(() => {
    const currentChallenge = getDailyChallenge();
    setChallenge(currentChallenge);
    const currentLeaderboard = getDailyChallengeLeaderboard();
    setLeaderboard(currentLeaderboard);
  }, []);

  useEffect(() => {
    loadChallengeData();
  }, [loadChallengeData]);

  const handleChallengeRoundEnd = (round: GameRound) => {
    updateDailyChallengeLeaderboard(round);
    setLastPerformance(round.performance);
    setGameState('info'); // Return to info screen after playing
    loadChallengeData(); // Reload leaderboard data after update
  };

  if (!challenge) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  const userHasPlayed = leaderboard.some(e => e.email === user.email);
  
  if (gameState === 'playing') {
    return (
      <GameArena 
        user={user} 
        onRoundEnd={handleChallengeRoundEnd}
        challengeConfig={{ asset: challenge.asset, startIndex: challenge.startIndex }}
        onFirstTrade={() => {}}
        isLocked={false}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white">{t('tournaments.title')}</h2>
        <p className="text-lg text-gray-400 mt-2">
          Asset: <span className="font-semibold text-blue-400">{challenge.asset} ({AssetTicker[challenge.asset]})</span>
        </p>
        <p className="text-sm text-gray-500">Challenge resets daily. Everyone plays on the same market data.</p>
        
        {lastPerformance !== null && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <p className="text-lg">Your last attempt's performance: 
              <span className={`font-bold ${lastPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}> {lastPerformance.toFixed(2)}%</span>
            </p>
          </div>
        )}

        <div className="mt-8">
          <button 
            onClick={() => setGameState('playing')}
            className="px-8 py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            {userHasPlayed ? 'Try Again' : 'Start Challenge'}
          </button>
        </div>
      </div>
      
      <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
         <h3 className="text-2xl font-bold text-center text-white mb-6">Daily Challenge Leaderboard</h3>
         <DailyLeaderboard entries={leaderboard} />
      </div>
    </div>
  );
};

export default DailyChallengePage;
