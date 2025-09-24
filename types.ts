import React from 'react';

export interface User {
  email: string;
  token?: string;
  role?: 'free' | 'pro';
  trial_ends_at?: string | null;
}

export enum TradeAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export enum Asset {
  SYNTH_CRYPTO = 'SYNTH_CRYPTO',
  SYNTH_STOCK = 'SYNTH_STOCK',
  SYNTH_FOREX = 'SYNTH_FOREX',
}

export enum DifficultyLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    PRO = 'PRO'
}

export interface Position {
    side: 'LONG'; // For simplicity, only long positions are tracked explicitly
    size: number; // in asset units
    entryPrice: number;
}

export interface PriceData {
  time: number;
  price: number;
  sma10?: number;
  sma20?: number;
  rsi?: number;
  atr?: number;
  volatility?: number;
}

export interface FeaturesSnapshot {
    SMA10?: number;
    SMA20?: number;
    RSI?: number;
    ATR?: number;
    volatility?: number;
}

export interface TradeSignal {
  source: 'Gemini AI' | 'Baseline Strategy' | 'Player' | 'Custom Strategy';
  action: TradeAction;
  positionSize: number; // as a fraction of portfolio value
  rationale: string;
  features_snapshot?: FeaturesSnapshot;
  confidence?: number;
}

export interface TradeExecution {
  time: number;
  action: TradeAction;
  price: number;
  amount: number; // units of asset
  rationale: string;
  source: 'Gemini AI' | 'Baseline Strategy' | 'Player' | 'Custom Strategy';
}

export interface GameRound {
  user: User;
  asset: Asset;
  performance: number; // percentage change in portfolio value
  decisions: TradeExecution[];
  difficulty: DifficultyLevel;
  startValue: number;
  endValue: number;
}

export interface LeaderboardEntry {
  email: string;
  bestPerformance: number;
}

export interface LeaderboardEntryV2 {
  rank: number;
  email: string;
  trades: number;
  realizedPnl: number;
  bestTradeR: number;
  winRate: number;
}

export interface RoundLog {
    userEmail: string;
    performance: number;
    decisions: TradeExecution[];
    timestamp: number;
    asset: Asset;
}


export interface UnlockedAchievement {
  name: string;
  unlockedAt: number;
}

export interface AchievementDefinition {
    name:string;
    description: string;
    icon: React.FC<any>;
    isUnlocked: (round: GameRound, allUserRounds: RoundLog[]) => boolean;
}

export interface DailyChallenge {
    id: string;
    asset: Asset;
    startIndex: number;
}

export interface PVPGame {
    id: string;
    player1: User;
    player2: User | null;
    status: 'waiting' | 'active' | 'finished';
    asset: Asset;
    startIndex: number;
    player1Round?: GameRound;
    player2Round?: GameRound;
    winner?: string; // email or 'draw'
}

// Types for Custom Strategy Builder
export enum Indicator {
  PRICE = 'PRICE',
  SMA10 = 'SMA10',
  SMA20 = 'SMA20',
  RSI = 'RSI',
}

export enum Operator {
  IS_ABOVE = 'IS_ABOVE',
  IS_BELOW = 'IS_BELOW',
  CROSSES_ABOVE = 'CROSSES_ABOVE',
  CROSSES_BELOW = 'CROSSES_BELOW',
}

export interface StrategyCondition {
  id: string;
  indicator1: Indicator;
  operator: Operator;
  compareTo: 'indicator' | 'value';
  indicator2: Indicator;
  value: number;
}

export interface CustomStrategy {
  id: string;
  userEmail: string;
  name: string;
  description: string;
  buyConditions: StrategyCondition[];
  sellConditions: StrategyCondition[];
}