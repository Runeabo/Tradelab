import { User, LeaderboardEntry, LeaderboardEntryV2, GameRound, RoundLog, UnlockedAchievement, DailyChallenge, Asset, PVPGame } from '../types';
import { ACHIEVEMENTS, TOTAL_DATA_POINTS } from '../constants';

const LEADERBOARD_KEY = 'tradelab-leaderboard';
const ROUND_LOGS_KEY = 'tradelab-round-logs';
const ACHIEVEMENTS_KEY = 'tradelab-achievements';
const DAILY_CHALLENGE_LEADERBOARD_KEY = 'tradelab-daily-leaderboard';
const PVP_GAMES_KEY = 'tradelab-pvp-games';

// Mock Auth Service
export const registerForMagicLink = async (email: string): Promise<{ok: boolean, verify_url: string}> => {
    console.log(`(Mock) Sending magic link to ${email}`);
    await new Promise(res => setTimeout(res, 500)); // simulate network delay
    const mockToken = `mock_token_${Date.now()}`;
    // In a real app, the backend would send an email. For the demo, we return the verification URL directly.
    const verify_url = `${window.location.origin}${window.location.pathname}?token=${mockToken}&email=${email}`;
    return { ok: true, verify_url };
}

// User Management (Original function kept for non-auth flows if needed)
export const registerUser = (email: string): User => {
  return { email };
};

// V2 Leaderboard
const MOCK_USERS = ['trader_pro@aistudio.com', 'crypto_king@aistudio.com', 'stock_wiz@example.com', 'forex_fanatic@example.com', 'newbie_trader@aistudio.com', 'profit_master@example.com', 'chart_master@aistudio.com', 'day_trader_dave@example.com', 'swing_sally@aistudio.com', 'investor_ida@example.com'];

const generateMockLeaderboard = (period: 'daily' | 'weekly', currentUserEmail?: string | null): LeaderboardEntryV2[] => {
    const periodMultiplier = period === 'daily' ? 1 : 7;
    let entries: LeaderboardEntryV2[] = MOCK_USERS.map((email, index) => ({
        rank: index + 1,
        email,
        trades: Math.floor(Math.random() * 50 * periodMultiplier) + 5,
        realizedPnl: (Math.random() * 2000 - 500) * periodMultiplier,
        bestTradeR: Math.random() * 5 + 0.5,
        winRate: Math.random() * 60 + 40,
    }));

    // If current user is provided and not in the top 10, add them at a random rank
    if (currentUserEmail && !MOCK_USERS.includes(currentUserEmail)) {
        entries.push({
            rank: Math.floor(Math.random() * 50) + 11,
            email: currentUserEmail,
            trades: Math.floor(Math.random() * 30 * periodMultiplier) + 2,
            realizedPnl: (Math.random() * 1000 - 400) * periodMultiplier,
            bestTradeR: Math.random() * 3 + 0.5,
            winRate: Math.random() * 50 + 30,
        });
    }

    return entries.sort((a, b) => b.realizedPnl - a.realizedPnl).map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export const getLeaderboardV2 = (period: 'daily' | 'weekly', user: User | null): Promise<LeaderboardEntryV2[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(generateMockLeaderboard(period, user?.email));
        }, 300);
    });
};

// Legacy Leaderboard (used by Daily Challenge)
export const getLeaderboard = (): LeaderboardEntry[] => {
  const data = localStorage.getItem(LEADERBOARD_KEY);
  return data ? JSON.parse(data) : [];
};

// Round Logging & Analytics
export const logRound = (round: GameRound) => {
    const logs = getRoundAnalytics();
    const newLog: RoundLog = {
        userEmail: round.user.email,
        performance: round.performance,
        decisions: round.decisions,
        timestamp: Date.now(),
        asset: round.asset,
    };
    logs.push(newLog);
    localStorage.setItem(ROUND_LOGS_KEY, JSON.stringify(logs));
    if(round.user.email !== 'guest') {
        checkAndUnlockAchievements(round);
    }
};

export const getRoundAnalytics = (): RoundLog[] => {
    const data = localStorage.getItem(ROUND_LOGS_KEY);
    return data ? JSON.parse(data) : [];
};

// Achievements
export const getUnlockedAchievements = (email: string): UnlockedAchievement[] => {
  const allAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (!allAchievements) return [];
  const parsed = JSON.parse(allAchievements);
  return parsed[email] || [];
};

export const checkAndUnlockAchievements = (round: GameRound) => {
  const unlocked = getUnlockedAchievements(round.user.email);
  const newUnlocks: UnlockedAchievement[] = [];
  
  const allUserRounds = getRoundAnalytics().filter(log => log.userEmail === round.user.email);

  ACHIEVEMENTS.forEach(ach => {
    if (!unlocked.find(u => u.name === ach.name)) {
      if (ach.isUnlocked(round, allUserRounds)) {
        newUnlocks.push({ name: ach.name, unlockedAt: Date.now() });
      }
    }
  });

  if (newUnlocks.length > 0) {
    const allAchievements = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
    if (!allAchievements[round.user.email]) {
      allAchievements[round.user.email] = [];
    }
    allAchievements[round.user.email].push(...newUnlocks);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(allAchievements));
    console.log(`Unlocked achievements for ${round.user.email}:`, newUnlocks.map(a => a.name));
    alert(`New achievement(s) unlocked: ${newUnlocks.map(a => a.name).join(', ')}`);
  }
};


// Daily Challenge
const getDailySeed = () => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export const getDailyChallenge = (): DailyChallenge => {
    const seed = getDailySeed();
    const assets = Object.values(Asset);
    const asset = assets[seed % assets.length];
    const startIndex = (seed * 31) % (TOTAL_DATA_POINTS - 100);

    return {
        id: String(seed),
        asset,
        startIndex
    };
};

export const getDailyChallengeLeaderboard = (): LeaderboardEntry[] => {
  const data = localStorage.getItem(DAILY_CHALLENGE_LEADERBOARD_KEY);
  const challenge = getDailyChallenge();
  if (data) {
    const parsed = JSON.parse(data);
    if (parsed.id === challenge.id) {
      return parsed.leaderboard;
    }
  }
  return [];
};

export const updateDailyChallengeLeaderboard = (round: GameRound) => {
    if (round.user.email === 'guest') return; // Don't save for guests
    const challenge = getDailyChallenge();
    const leaderboard = getDailyChallengeLeaderboard();
    const existingEntryIndex = leaderboard.findIndex(e => e.email === round.user.email);

    if (existingEntryIndex > -1) {
        if (round.performance > leaderboard[existingEntryIndex].bestPerformance) {
            leaderboard[existingEntryIndex].bestPerformance = round.performance;
        }
    } else {
        leaderboard.push({ email: round.user.email, bestPerformance: round.performance });
    }

    leaderboard.sort((a, b) => b.bestPerformance - a.bestPerformance);
    const dataToStore = {
        id: challenge.id,
        leaderboard: leaderboard.slice(0, 50)
    };
    localStorage.setItem(DAILY_CHALLENGE_LEADERBOARD_KEY, JSON.stringify(dataToStore));
};

// PvP
export const getPVPGames = (): PVPGame[] => {
    const data = localStorage.getItem(PVP_GAMES_KEY);
    return data ? JSON.parse(data) : [];
}

export const createPVPGame = (user: User): PVPGame => {
    const games = getPVPGames();
    const seed = Date.now();
    const assets = Object.values(Asset);
    const newGame: PVPGame = {
        id: `pvp_${Date.now()}`,
        player1: user,
        player2: null,
        status: 'waiting',
        asset: assets[seed % assets.length],
        startIndex: (seed * 17) % (TOTAL_DATA_POINTS - 100),
    };
    games.push(newGame);
    localStorage.setItem(PVP_GAMES_KEY, JSON.stringify(games));
    return newGame;
}

export const joinPVPGame = (gameId: string, user: User): PVPGame | null => {
    const games = getPVPGames();
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (gameIndex > -1 && games[gameIndex].status === 'waiting' && games[gameIndex].player1.email !== user.email) {
        games[gameIndex].player2 = user;
        games[gameIndex].status = 'active';
        localStorage.setItem(PVP_GAMES_KEY, JSON.stringify(games));
        return games[gameIndex];
    }
    return null;
}

export const updatePVPGameRound = (gameId: string, user: User, round: GameRound): PVPGame | null => {
    const games = getPVPGames();
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return null;

    if (games[gameIndex].player1.email === user.email) {
        games[gameIndex].player1Round = round;
    } else if (games[gameIndex].player2?.email === user.email) {
        games[gameIndex].player2Round = round;
    }

    if (games[gameIndex].player1Round && games[gameIndex].player2Round) {
        games[gameIndex].status = 'finished';
        if (games[gameIndex].player1Round!.performance > games[gameIndex].player2Round!.performance) {
            games[gameIndex].winner = games[gameIndex].player1.email;
        } else if (games[gameIndex].player2Round!.performance > games[gameIndex].player1Round!.performance) {
            games[gameIndex].winner = games[gameIndex].player2!.email;
        } else {
            games[gameIndex].winner = 'draw';
        }
    }
    
    localStorage.setItem(PVP_GAMES_KEY, JSON.stringify(games));
    return games[gameIndex];
}