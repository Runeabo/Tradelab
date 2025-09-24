import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, PriceData, TradeSignal, TradeExecution, TradeAction, Asset, DifficultyLevel, GameRound, Position } from '../types';
import { getAITradeSignal } from '../services/geminiService';
import { getDataSlice } from '../services/dataService';
import { INITIAL_CASH, GAME_LENGTH, AssetTicker } from '../constants';
import PriceChart from './PriceChart';
import TradeProposalCard from './TradeProposalCard';
import Spinner from './Spinner';
import Tutorial from './Tutorial';
import QuickTradeDock from './QuickTradeDock';
import Toast from './Toast';
import InactivityNudge from './InactivityNudge';
import { useLocalization } from '../LocalizationContext';
import { useFeatures } from '../features';
import ProBadge from './ProBadge';

interface GameArenaProps {
  user: User;
  onRoundEnd: (round: GameRound) => void;
  challengeConfig?: { asset: Asset, startIndex: number };
  onFirstTrade: () => void;
  isLocked: boolean;
  onPaywallOpen: () => void;
}

const GameArena: React.FC<GameArenaProps> = ({ user, onRoundEnd, challengeConfig, onFirstTrade, isLocked, onPaywallOpen }) => {
    const { t } = useLocalization();
    const [isTourActive, setTourActive] = useState(false);
    const features = useFeatures(user);
    
    // Game Setup State
    const [asset, setAsset] = useState<Asset>(challengeConfig?.asset || Asset.SYNTH_CRYPTO);
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.BEGINNER);
    const [startIndex] = useState(challengeConfig?.startIndex || Math.floor(Math.random() * 4000));
    const [isReplayMode, setReplayMode] = useState(false);

    // Game Progression State
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
    const [currentStep, setCurrentStep] = useState(0);
    const [fullPriceData, setFullPriceData] = useState<PriceData[]>([]);
    const [visiblePriceData, setVisiblePriceData] = useState<PriceData[]>([]);
    
    // Portfolio State
    const [cash, setCash] = useState(INITIAL_CASH);
    const [position, setPosition] = useState<Position | null>(null);
    const [portfolioValue, setPortfolioValue] = useState(INITIAL_CASH);
    const [stopLoss, setStopLoss] = useState<number | null>(null);
    const [takeProfit, setTakeProfit] = useState<number | null>(null);
    
    // UI/UX State
    const [tradeHistory, setTradeHistory] = useState<TradeExecution[]>([]);
    const [aiSignals, setAiSignals] = useState<TradeSignal[]>([]);
    const [isLoadingSignal, setIsLoadingSignal] = useState(false);
    const [toast, setToast] = useState<{ id: number; message: string; onUndo?: () => void } | null>(null);
    const [showNudge, setShowNudge] = useState(false);
    const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Effects ---

    useEffect(() => {
        if (localStorage.getItem('tourDone') !== 'true' && !challengeConfig) {
            setTourActive(true);
        }
        // Load game data on mount
        const data = getDataSlice(asset, startIndex, GAME_LENGTH + 20);
        setFullPriceData(data);
        setVisiblePriceData(data.slice(0, 20));
        setGameState('playing');
    }, [asset, startIndex, challengeConfig]);

    const currentPrice = visiblePriceData[visiblePriceData.length - 1]?.price || 0;
    const currentAtr = visiblePriceData[visiblePriceData.length - 1]?.atr || 0;
    const currentVolatility = visiblePriceData[visiblePriceData.length - 1]?.volatility || 0;

    useEffect(() => {
        if(currentPrice > 0){
            setPortfolioValue(cash + (position?.size || 0) * currentPrice);
        }
    }, [cash, position, currentPrice]);

    const fetchSignals = useCallback(async () => {
        if (!visiblePriceData.length || isLocked || currentStep >= GAME_LENGTH) return;
        setIsLoadingSignal(true);
        const signals = await getAITradeSignal(visiblePriceData, cash, position?.size || 0, asset, difficulty);
        setAiSignals(signals);
        setIsLoadingSignal(false);
    }, [visiblePriceData, cash, position, asset, difficulty, isLocked, currentStep]);

    useEffect(() => {
        if (gameState === 'playing' && currentStep > 0 && currentStep < GAME_LENGTH && !position) {
            fetchSignals();
        }
    }, [currentStep, gameState, fetchSignals, position]);

    // Inactivity Nudge Effect
    useEffect(() => {
        if (gameState === 'playing' && tradeHistory.length === 0 && !isTourActive && !isLocked) {
            const timer = setTimeout(() => {
                if (sessionStorage.getItem('nudgeShown') !== 'true') {
                    setShowNudge(true);
                    sessionStorage.setItem('nudgeShown', 'true');
                }
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [gameState, tradeHistory, isTourActive, isLocked]);

    // Hotkeys Effect
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (isLocked) return;
            if (e.key.toLowerCase() === 'b') document.getElementById('quick-trade-buy')?.click();
            if (e.key.toLowerCase() === 's') document.getElementById('quick-trade-sell')?.click();
            if (e.key.toLowerCase() === 'x') document.getElementById('quick-trade-close')?.click();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isLocked]);

    // --- Core Game Logic ---

    const advanceStep = (executedTrade: TradeExecution) => {
        const newHistory = [...tradeHistory, executedTrade];
        setTradeHistory(newHistory);

        if (tradeHistory.length === 0) {
            onFirstTrade();
        }

        const nextStep = currentStep + 1;
        
        if (nextStep >= GAME_LENGTH) {
            endRound(newHistory);
            return;
        }

        const nextPriceData = fullPriceData.slice(0, 20 + nextStep);
        const nextPrice = nextPriceData[nextPriceData.length - 1].price;
        
        // Check for SL/TP hit
        if (position) {
            if (stopLoss && nextPrice <= stopLoss) {
                handleClosePosition('Stop-Loss hit');
                return; // Closing will trigger the next step
            }
            if (takeProfit && nextPrice >= takeProfit) {
                handleClosePosition('Take-Profit hit');
                return; // Closing will trigger the next step
            }
        }
        
        setCurrentStep(nextStep);
        setVisiblePriceData(nextPriceData);
        setAiSignals([]);
    }

    const endRound = (finalTradeHistory: TradeExecution[]) => {
        const finalPrice = fullPriceData[20 + currentStep]?.price || currentPrice;
        const finalValue = cash + (position?.size || 0) * finalPrice;
        const round: GameRound = {
            user, asset, difficulty, startValue: INITIAL_CASH, endValue: finalValue,
            performance: ((finalValue - INITIAL_CASH) / INITIAL_CASH) * 100,
            decisions: finalTradeHistory,
        };
        onRoundEnd(round);
        setGameState('finished');
    };

    // --- Player Actions ---
    
    const executeTrade = (signal: TradeSignal, autoBrackets: boolean = false) => {
        if (currentStep >= GAME_LENGTH || currentPrice <= 0 || isLocked) return;

        let amountInAsset = (portfolioValue * signal.positionSize) / currentPrice;
        let execution: TradeExecution | null = null;
        
        if (signal.action === TradeAction.BUY && cash >= amountInAsset * currentPrice) {
            const newHoldings = (position?.size || 0) + amountInAsset;
            const newCash = cash - amountInAsset * currentPrice;
            const newEntryPrice = position ? (position.entryPrice * position.size + currentPrice * amountInAsset) / newHoldings : currentPrice;
            
            setPosition({ side: 'LONG', size: newHoldings, entryPrice: newEntryPrice });
            setCash(newCash);
            
            if (autoBrackets && currentAtr > 0) {
                setStopLoss(currentPrice - 1.5 * currentAtr);
                setTakeProfit(currentPrice + 2.0 * currentAtr);
            }
            execution = { time: visiblePriceData.length - 1, ...signal, price: currentPrice, amount: amountInAsset };
        
        } else if (signal.action === TradeAction.SELL && position && position.size > 0) {
            amountInAsset = Math.min(amountInAsset, position.size);
            const newHoldings = position.size - amountInAsset;
            setCash(cash + amountInAsset * currentPrice);

            if (newHoldings < 0.0001) { // Closing position fully
                setPosition(null);
                setStopLoss(null);
                setTakeProfit(null);
            } else {
                setPosition({ ...position, size: newHoldings });
            }
            execution = { time: visiblePriceData.length - 1, ...signal, price: currentPrice, amount: amountInAsset };
        } else {
             execution = { time: visiblePriceData.length - 1, ...signal, action: TradeAction.HOLD, price: currentPrice, amount: 0 };
        }

        if (execution) {
            advanceStep(execution);
        }
    };

    const handlePlayerTrade = (action: 'BUY' | 'SELL', amountUSD: number, autoBrackets: boolean) => {
        setShowNudge(false);
        const positionSize = amountUSD / portfolioValue;
        
        const prevState = { cash, position, stopLoss, takeProfit, tradeHistory, currentStep, visiblePriceData, portfolioValue };
        
        const signal: TradeSignal = {
            source: 'Player',
            action: action as TradeAction,
            positionSize,
            rationale: `Player ${action} ${amountUSD.toFixed(2)} USD`,
        };
        executeTrade(signal, autoBrackets);
        
        // Undo logic
        const undo = () => {
            setCash(prevState.cash);
            setPosition(prevState.position);
            setStopLoss(prevState.stopLoss);
            setTakeProfit(prevState.takeProfit);
            setTradeHistory(prevState.tradeHistory);
            setCurrentStep(prevState.currentStep);
            setVisiblePriceData(prevState.visiblePriceData);
            setPortfolioValue(prevState.portfolioValue);
            setToast(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        };

        setToast({ id: Date.now(), message: t('toasts.undo'), onUndo: undo });
        
        undoTimeoutRef.current = setTimeout(() => {
            setToast(currentToast => currentToast && currentToast.onUndo ? { ...currentToast, onUndo: undefined, message: t('toasts.filled') } : null);
        }, 3000);
    };

    const handleClosePosition = (rationale: string = 'Player closed position') => {
        if (!position) return;
        const signal: TradeSignal = {
            source: 'Player',
            action: TradeAction.SELL,
            positionSize: 1.0, // Close 100%
            rationale,
        };
        executeTrade(signal);
        setToast({ id: Date.now(), message: t('toasts.closed') });
    };
    
    const getVolatilityInfo = useCallback((vol: number) => {
        if (vol < 0.01) return { label: t('arena.volatility.low'), color: 'text-green-400' };
        if (vol < 0.02) return { label: t('arena.volatility.moderate'), color: 'text-yellow-400' };
        if (vol < 0.03) return { label: t('arena.volatility.high'), color: 'text-orange-400' };
        return { label: t('arena.volatility.extreme'), color: 'text-red-500' };
    }, [t]);

    const volatilityInfo = useMemo(() => getVolatilityInfo(currentVolatility), [currentVolatility, getVolatilityInfo]);


    const handleReplayToggle = () => {
        if (features.canUseReplay) {
            setReplayMode(!isReplayMode);
            // Add actual replay logic here
        } else {
            onPaywallOpen();
        }
    };
    
    // --- Render Logic ---

    if (gameState === 'loading' || !fullPriceData.length || visiblePriceData.length < 20) {
        return <div className="flex justify-center items-center h-96"><Spinner /></div>;
    }
    
    return (
        <div className="space-y-6 relative pb-28">
             {isLocked && <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20 rounded-xl"><p className="text-xl font-bold">Please accept the disclaimer to continue.</p></div>}
             {isTourActive && <Tutorial onDone={() => setTourActive(false)} />}

            {/* Top Info Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
                    {/* Portfolio Section */}
                    <div>
                        <h3 className="text-xl font-bold border-b border-gray-600 pb-2">Portfolio</h3>
                        <div className="mt-3 space-y-1">
                            <div><span className="text-gray-400">Cash:</span> <span className="font-mono float-right">${cash.toFixed(2)}</span></div>
                            <div><span className="text-gray-400">Position:</span> <span className="font-mono float-right">${(position ? position.size * currentPrice : 0).toFixed(2)}</span></div>
                            <div className="pt-2 border-t border-gray-600"><span className="font-bold">Total:</span> <span className="font-mono float-right font-bold">${portfolioValue.toFixed(2)}</span></div>
                            <div className="pt-2"><span className="font-bold">P/L:</span> <span className={`font-mono float-right font-bold ${portfolioValue >= INITIAL_CASH ? 'text-green-400' : 'text-red-400'}`}>{(((portfolioValue - INITIAL_CASH)/INITIAL_CASH)*100).toFixed(2)}%</span></div>
                        </div>
                    </div>

                    {/* Market Info Section */}
                    <div id="tutorial-step-1" className="pt-4 border-t border-gray-700">
                        <h3 className="text-xl font-bold border-b border-gray-600 pb-2">Market</h3>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Asset</label>
                                <select value={asset} onChange={e => setAsset(e.target.value as Asset)} disabled={!!challengeConfig || currentStep > 0} className="bg-gray-700 p-2 rounded w-full text-sm disabled:opacity-50">
                                    {Object.values(Asset).map(a => <option key={a} value={a}>{AssetTicker[a]}</option>)}
                                </select>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">{t('arena.volatility.label')}</span>
                                <span className={`float-right font-semibold ${volatilityInfo.color}`}>
                                    {volatilityInfo.label}
                                </span>
                            </div>
                             <div 
                                className={`flex items-center justify-between p-2 rounded-lg ${!features.canUseReplay ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
                                onClick={handleReplayToggle}
                                title={!features.canUseReplay ? 'Upgrade to Pro to use Replay Mode' : ''}
                            >
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="replay-toggle" className="text-sm text-gray-300">Replay Mode</label>
                                    {!features.canUseReplay && <ProBadge />}
                                </div>
                                <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isReplayMode && features.canUseReplay ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isReplayMode && features.canUseReplay ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="lg:col-span-3 bg-gray-800 p-4 rounded-lg shadow-lg h-96">
                    <PriceChart data={visiblePriceData} trades={tradeHistory} position={position} sl={stopLoss} tp={takeProfit} />
                </div>
            </div>

            {/* AI Proposals Section */}
            <div id="ai-proposals" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[12rem] content-start">
                {isLoadingSignal ? <div className="col-span-full flex justify-center items-center"><Spinner /></div> : 
                    aiSignals.length > 0 ? aiSignals.map((signal, index) => (
                        <TradeProposalCard key={index} signal={signal} onAccept={executeTrade} disabled={currentStep >= GAME_LENGTH || isLocked} />
                    ))
                    : (currentStep < GAME_LENGTH && !position &&
                        <div className="col-span-full flex justify-center items-center">
                            <button onClick={fetchSignals} disabled={isLocked} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-lg font-bold">
                                Get AI Trade Proposals
                            </button>
                        </div>
                    )
                }
            </div>

            {/* Floating UI Elements */}
            <QuickTradeDock 
                position={position}
                currentPrice={currentPrice}
                pnl={(position ? (currentPrice - position.entryPrice) * position.size : 0)}
                onTrade={handlePlayerTrade}
                onClose={handleClosePosition}
                disabled={isLocked || currentStep >= GAME_LENGTH}
            />
            <Toast toast={toast} onClose={() => setToast(null)} />
            <InactivityNudge isVisible={showNudge} onClose={() => setShowNudge(false)} />
        </div>
    );
};

export default GameArena;