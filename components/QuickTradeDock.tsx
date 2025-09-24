import React, { useState } from 'react';
import { Position } from '../types';
import { useLocalization } from '../LocalizationContext';

interface QuickTradeDockProps {
    position: Position | null;
    currentPrice: number;
    pnl: number;
    onTrade: (action: 'BUY' | 'SELL', amountUSD: number, autoBrackets: boolean) => void;
    onClose: () => void;
    disabled: boolean;
}

const QuickTradeDock: React.FC<QuickTradeDockProps> = ({ position, currentPrice, pnl, onTrade, onClose, disabled }) => {
    const { t } = useLocalization();
    const hasPosition = position && position.size > 0;
    const [amount, setAmount] = useState(50);
    const [autoBrackets, setAutoBrackets] = useState(true);
    const presets = [25, 50, 100];

    const handleTrade = (action: 'BUY' | 'SELL') => {
        if (!disabled) {
            onTrade(action, amount, autoBrackets);
        }
    };
    
    const pnlColor = pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-300';
    const pnlBg = pnl > 0 ? 'bg-green-500/10' : pnl < 0 ? 'bg-red-500/10' : 'bg-gray-700/50';

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 z-20">
            <div className="container mx-auto px-4 py-3">
                <div className={`grid ${hasPosition ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} gap-4 items-center`}>
                    
                    {/* Position Info View */}
                    {hasPosition ? (
                        <>
                            <div className="flex flex-col items-center justify-center">
                                 <div className={`text-center p-2 rounded-lg ${pnlBg} w-full`}>
                                    <div className="text-xs text-gray-400">{t('arena.quickDock.pnlLive')}</div>
                                    <div className={`text-lg font-bold font-mono ${pnlColor}`}>{pnl.toFixed(2)} USD</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {position.size.toFixed(4)} @ ${position.entryPrice.toFixed(2)}
                                </div>
                            </div>
                             <button
                                id="quick-trade-close"
                                onClick={onClose}
                                disabled={disabled}
                                className="w-full h-16 text-lg font-bold rounded-lg bg-gray-600 text-white hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                aria-label={t('buttons.closePosition')}
                            >
                                {t('arena.quickDock.close')}
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Trade Setup View */}
                            <div id="tutorial-step-2" className="flex flex-col items-center justify-center col-span-1 md:col-span-1">
                                <label htmlFor="trade-amount" className="text-sm text-gray-400 mb-1">{t('arena.quickDock.amount')}</label>
                                <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
                                    {presets.map(p => (
                                        <button key={p} onClick={() => setAmount(p)} className={`px-3 py-1 text-sm rounded-md ${amount === p ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                            ${p}
                                        </button>
                                    ))}
                                </div>
                                 <div className="flex items-center mt-2">
                                    <input type="checkbox" id="auto-brackets" checked={autoBrackets} onChange={e => setAutoBrackets(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                                    <label htmlFor="auto-brackets" className="ml-2 text-xs text-gray-400">{t('arena.quickDock.autoBrackets')}</label>
                                </div>
                            </div>

                            <div id="tutorial-step-3" className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                               <button
                                    id="quick-trade-buy"
                                    onClick={() => handleTrade('BUY')}
                                    disabled={disabled}
                                    className="w-full h-16 text-xl font-bold rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:bg-green-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                    aria-label={t('arena.quickDock.buyNow')}
                                >
                                    {t('arena.quickDock.buyNow')}
                                </button>
                                <button
                                    id="quick-trade-sell"
                                    onClick={() => handleTrade('SELL')}
                                    disabled={disabled || !hasPosition}
                                    className="w-full h-16 text-xl font-bold rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:bg-red-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                    aria-label={t('arena.quickDock.sellNow')}
                                >
                                    {t('arena.quickDock.sellNow')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                 <p className="text-center text-xs text-gray-600 mt-2 hidden md:block">{t('arena.quickDock.hotkeysHint')}</p>
            </div>
        </div>
    );
};

export default QuickTradeDock;