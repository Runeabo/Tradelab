import React, { useState } from 'react';
import { TradeSignal, TradeAction } from '../types';
import { BRAND_NAME } from '../constants';
import { BrainIcon, CalculatorIcon, ChevronDownIcon } from './icons';
import { useLocalization } from '../LocalizationContext';

interface TradeProposalCardProps {
  signal: TradeSignal;
  onAccept: (signal: TradeSignal) => void;
  disabled: boolean;
}

const TradeProposalCard: React.FC<TradeProposalCardProps> = ({ signal, onAccept, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLocalization();
  const isAI = signal.source === 'Gemini AI';
  
  const cardBg = isAI ? 'bg-gradient-to-br from-blue-900/50 to-gray-800' : 'bg-gray-800';
  const headerBg = isAI ? 'bg-blue-800/50' : 'bg-gray-700';
  const brandText = isAI ? BRAND_NAME : 'Baseline';
  
  const actionColor = {
    [TradeAction.BUY]: 'text-green-400',
    [TradeAction.SELL]: 'text-red-400',
    [TradeAction.HOLD]: 'text-gray-400',
  };
  
  const actionBg = {
    [TradeAction.BUY]: 'bg-green-500/10',
    [TradeAction.SELL]: 'bg-red-500/10',
    [TradeAction.HOLD]: 'bg-gray-500/10',
  }

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden border border-gray-700 ${cardBg} transition-all duration-300`}>
      <div className={`p-4 flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center space-x-3">
          {isAI ? <BrainIcon /> : <CalculatorIcon />}
          <h3 className="font-bold text-lg text-white">{signal.source.replace('Gemini', brandText)}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="text-center">
            <p className="text-sm text-gray-400">Proposed Action</p>
            <p className={`text-2xl font-bold ${actionColor[signal.action]}`}>
                {signal.action}
            </p>
        </div>

        <div className={`p-3 rounded-md text-center ${actionBg[signal.action]}`}>
            <p className="text-sm text-gray-400">Position Size</p>
            <p className="text-lg font-semibold text-white">
                {(signal.positionSize * 100).toFixed(1)}%
            </p>
        </div>

        <div>
            <p className="text-sm text-gray-400 mb-1">{t('ai.rationale')}</p>
            <p className="text-gray-300 text-sm h-16 overflow-y-auto p-2 bg-gray-900/50 rounded">
                {signal.rationale}
            </p>
        </div>

        {isAI && signal.features_snapshot && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1"
              aria-expanded={isExpanded}
            >
              <span>Why this proposal?</span>
              <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
              <div className="pt-2">
                <div className="bg-gray-900/70 p-3 rounded-md text-sm">
                  <h4 className="font-semibold text-gray-300 mb-2">{t('ai.snapshot')}</h4>
                  <ul className="space-y-1">
                    {Object.entries(signal.features_snapshot).map(([key, value]) => (
                      <li key={key} className="flex justify-between items-center text-gray-400">
                        <span className="capitalize">{key.replace(/([A-Z0-9])/g, ' $1').trim()}</span>
                        <span className="font-mono text-gray-200">{value !== null && typeof value !== 'undefined' ? Number(value).toFixed(4) : 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        
        <button
          onClick={() => onAccept(signal)}
          disabled={disabled}
          className="w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all transform hover:scale-105"
        >
          {t('buttons.applyIdea')}
        </button>
      </div>
    </div>
  );
};

export default TradeProposalCard;
