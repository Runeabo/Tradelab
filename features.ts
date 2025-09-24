import { User } from './types';

export interface FeatureFlags {
  canUseReplay: boolean;
  hasFastAI: boolean;
  canUseAdvancedOrders: boolean;
  canAccessStrategyLab: boolean;
  canAccessTradeJournal: boolean;
}

const defaultFlags: FeatureFlags = {
  canUseReplay: false,
  hasFastAI: false,
  canUseAdvancedOrders: false,
  canAccessStrategyLab: false,
  canAccessTradeJournal: false,
};

export const useFeatures = (user: User | null): FeatureFlags => {
  if (!user || user.role !== 'pro') {
    return defaultFlags;
  }

  // Check if trial is active
  const isTrialActive = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();

  if (user.role === 'pro' || isTrialActive) {
    return {
      canUseReplay: true,
      hasFastAI: true,
      canUseAdvancedOrders: true,
      canAccessStrategyLab: true,
      canAccessTradeJournal: true,
    };
  }
  
  return defaultFlags;
};
