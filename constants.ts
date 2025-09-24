import { Asset, AchievementDefinition } from './types';
import { FirstWinIcon, HighRollerIcon, DiversifiedIcon, MasterTraderIcon } from './components/icons';

export const BRAND_NAME = 'TradeLab';

export const MAX_POSITION_SIZE = 1.0; // 100% of portfolio value

export const TOTAL_DATA_POINTS = 5000;

export const INITIAL_CASH = 10000;
export const GAME_LENGTH = 50; // 50 steps/days per game

export const AssetTicker: { [key in Asset]: string } = {
  [Asset.SYNTH_CRYPTO]: 'GEM-CRY',
  [Asset.SYNTH_STOCK]: 'GEM-STK',
  [Asset.SYNTH_FOREX]: 'GEM-FX',
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
    {
        name: 'First Victory',
        description: 'Finish a round with a positive performance.',
        icon: FirstWinIcon,
        isUnlocked: (round) => round.performance > 0,
    },
    {
        name: 'High Roller',
        description: 'Achieve over 25% performance in a single round.',
        icon: HighRollerIcon,
        isUnlocked: (round) => round.performance > 25,
    },
    {
        name: 'Diversified Investor',
        description: 'Play a round with every available asset type.',
        icon: DiversifiedIcon,
        isUnlocked: (round, allUserRounds) => {
            const playedAssets = new Set(allUserRounds.map(r => r.asset));
            playedAssets.add(round.asset);
            return Object.values(Asset).every(asset => playedAssets.has(asset));
        }
    },
    {
        name: 'Master Trader',
        description: 'Complete 10 rounds with positive performance.',
        icon: MasterTraderIcon,
        isUnlocked: (round, allUserRounds) => {
            return allUserRounds.filter(r => r.performance > 0).length >= 10;
        }
    }
];