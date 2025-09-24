import React, { useState, useEffect, useMemo } from 'react';
import { User, UnlockedAchievement, AchievementDefinition } from '../types';
import { getUnlockedAchievements } from '../services/gameService';
import { ACHIEVEMENTS } from '../constants';

interface AchievementsProps {
  user: User;
}

interface DisplayAchievement extends AchievementDefinition {
    unlocked: boolean;
    unlockedAt?: number;
}

const AchievementCard: React.FC<{ achievement: DisplayAchievement }> = ({ achievement }) => {
    const isUnlocked = achievement.unlocked;
    const cardClasses = `border rounded-lg p-6 flex flex-col items-center justify-start text-center transition-all duration-300 ${
        isUnlocked 
        ? 'bg-gradient-to-br from-blue-900/50 to-gray-800 border-blue-600 shadow-lg' 
        : 'bg-gray-800/50 border-gray-700'
    }`;
    const iconClasses = `mb-4 ${isUnlocked ? 'text-blue-400' : 'text-gray-500'}`;
    const textClasses = isUnlocked ? 'text-white' : 'text-gray-400';

    return (
        <div className={cardClasses}>
            <div className={iconClasses}>
                <achievement.icon />
            </div>
            <h3 className={`font-bold text-lg ${textClasses}`}>{achievement.name}</h3>
            <p className={`text-sm mt-1 h-10 ${isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>{achievement.description}</p>
            {isUnlocked && achievement.unlockedAt && (
                <p className="text-xs text-green-400 mt-4">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
            )}
        </div>
    );
};


const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    setUnlocked(getUnlockedAchievements(user.email));
  }, [user.email]);
  
  const displayAchievements: DisplayAchievement[] = useMemo(() => {
    const unlockedMap = new Map(unlocked.map(ach => [ach.name, ach.unlockedAt]));
    return ACHIEVEMENTS.map(def => ({
        ...def,
        unlocked: unlockedMap.has(def.name),
        unlockedAt: unlockedMap.get(def.name),
    })).sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
  }, [unlocked]);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-white mb-8">Your Achievements</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAchievements.map(ach => (
            <AchievementCard key={ach.name} achievement={ach} />
        ))}
      </div>
    </div>
  );
};

export default Achievements;