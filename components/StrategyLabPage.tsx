import React, { useState, useEffect } from 'react';
import { User, CustomStrategy, StrategyCondition, Indicator, Operator } from '../types';
import { useLocalization } from '../LocalizationContext';
import { useFeatures } from '../features';
import { getCustomStrategies, saveCustomStrategy, deleteCustomStrategy } from '../services/strategyService';
import ProBadge from './ProBadge';

interface StrategyLabPageProps {
  user: User;
  onPaywallOpen: () => void;
}

// --- Sub-components ---

const ConditionEditor: React.FC<{
  condition: StrategyCondition;
  updateCondition: (updatedCondition: StrategyCondition) => void;
  removeCondition: () => void;
}> = ({ condition, updateCondition, removeCondition }) => {
  const handleIndicatorChange = (field: 'indicator1' | 'indicator2', value: Indicator) => {
    updateCondition({ ...condition, [field]: value });
  };
  const handleOperatorChange = (value: Operator) => {
    updateCondition({ ...condition, operator: value });
  };
  const handleCompareToChange = (value: 'indicator' | 'value') => {
    updateCondition({ ...condition, compareTo: value });
  };
  const handleValueChange = (value: string) => {
    updateCondition({ ...condition, value: parseFloat(value) || 0 });
  };

  const indicatorOptions = Object.values(Indicator).map(i => <option key={i} value={i}>{i}</option>);
  
  return (
    <div className="flex items-center space-x-2 bg-gray-900 p-2 rounded-md">
      <select value={condition.indicator1} onChange={e => handleIndicatorChange('indicator1', e.target.value as Indicator)} className="bg-gray-700 p-1 rounded w-full text-xs">
        {indicatorOptions}
      </select>
      <select value={condition.operator} onChange={e => handleOperatorChange(e.target.value as Operator)} className="bg-gray-700 p-1 rounded w-full text-xs">
        {Object.values(Operator).map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
      <select value={condition.compareTo} onChange={e => handleCompareToChange(e.target.value as 'indicator' | 'value')} className="bg-gray-700 p-1 rounded text-xs">
        <option value="value">Value</option>
        <option value="indicator">Indicator</option>
      </select>
      {condition.compareTo === 'value' ? (
        <input type="number" value={condition.value} onChange={e => handleValueChange(e.target.value)} className="bg-gray-700 p-1 rounded w-full text-xs" />
      ) : (
        <select value={condition.indicator2} onChange={e => handleIndicatorChange('indicator2', e.target.value as Indicator)} className="bg-gray-700 p-1 rounded w-full text-xs">
          {indicatorOptions}
        </select>
      )}
      <button onClick={removeCondition} className="text-red-500 hover:text-red-400 font-bold p-1">&times;</button>
    </div>
  );
};


const StrategyEditorModal: React.FC<{
  strategy: CustomStrategy | null;
  user: User;
  onClose: () => void;
  onSave: () => void;
}> = ({ strategy, user, onClose, onSave }) => {
  const { t } = useLocalization();
  const [editedStrategy, setEditedStrategy] = useState<CustomStrategy>(
    strategy || {
      id: `strat_${Date.now()}`,
      userEmail: user.email,
      name: '',
      description: '',
      buyConditions: [],
      sellConditions: [],
    }
  );

  const updateField = (field: keyof CustomStrategy, value: any) => {
    setEditedStrategy(prev => ({ ...prev, [field]: value }));
  };

  const addCondition = (type: 'buy' | 'sell') => {
    const newCondition: StrategyCondition = {
      id: `cond_${Date.now()}`,
      indicator1: Indicator.PRICE,
      operator: Operator.IS_ABOVE,
      compareTo: 'indicator',
      indicator2: Indicator.SMA20,
      value: 0,
    };
    if (type === 'buy') {
      updateField('buyConditions', [...editedStrategy.buyConditions, newCondition]);
    } else {
      updateField('sellConditions', [...editedStrategy.sellConditions, newCondition]);
    }
  };

  const updateCondition = (type: 'buy' | 'sell', index: number, updatedCondition: StrategyCondition) => {
    const conditions = type === 'buy' ? [...editedStrategy.buyConditions] : [...editedStrategy.sellConditions];
    conditions[index] = updatedCondition;
    updateField(type === 'buy' ? 'buyConditions' : 'sellConditions', conditions);
  };
  
  const removeCondition = (type: 'buy' | 'sell', index: number) => {
      const conditions = type === 'buy' ? [...editedStrategy.buyConditions] : [...editedStrategy.sellConditions];
      conditions.splice(index, 1);
      updateField(type === 'buy' ? 'buyConditions' : 'sellConditions', conditions);
  }

  const handleSave = () => {
    if (!editedStrategy.name) {
        alert("Strategy name is required.");
        return;
    }
    saveCustomStrategy(editedStrategy);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold">{t('strategyLab.editorTitle')}</h3>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" placeholder={t('strategyLab.strategyNamePlaceholder')} value={editedStrategy.name} onChange={e => updateField('name', e.target.value)} className="w-full p-2 bg-gray-700 rounded"/>
          <textarea placeholder={t('strategyLab.strategyDescPlaceholder')} value={editedStrategy.description} onChange={e => updateField('description', e.target.value)} className="w-full p-2 bg-gray-700 rounded h-20"/>

          {/* Buy Conditions */}
          <div className="space-y-2 p-3 bg-gray-900/50 rounded-lg">
            <h4 className="font-semibold">{t('strategyLab.buyConditions')}</h4>
            <p className="text-xs text-gray-400">{t('strategyLab.conditionHelp')}</p>
            {editedStrategy.buyConditions.map((cond, i) => (
              <ConditionEditor key={cond.id} condition={cond} updateCondition={c => updateCondition('buy', i, c)} removeCondition={() => removeCondition('buy', i)} />
            ))}
            <button onClick={() => addCondition('buy')} className="text-sm text-green-400 hover:text-green-300">+ {t('strategyLab.addCondition')}</button>
          </div>
          
          {/* Sell Conditions */}
          <div className="space-y-2 p-3 bg-gray-900/50 rounded-lg">
            <h4 className="font-semibold">{t('strategyLab.sellConditions')}</h4>
            <p className="text-xs text-gray-400">{t('strategyLab.conditionHelp')}</p>
            {editedStrategy.sellConditions.map((cond, i) => (
              <ConditionEditor key={cond.id} condition={cond} updateCondition={c => updateCondition('sell', i, c)} removeCondition={() => removeCondition('sell', i)} />
            ))}
            <button onClick={() => addCondition('sell')} className="text-sm text-red-400 hover:text-red-300">+ {t('strategyLab.addCondition')}</button>
          </div>

        </div>
        <div className="p-4 bg-gray-900 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">{t('buttons.cancel')}</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded">{t('strategyLab.saveStrategy')}</button>
        </div>
      </div>
    </div>
  );
};


// --- Main Page ---

const StrategyLabPage: React.FC<StrategyLabPageProps> = ({ user, onPaywallOpen }) => {
  const { t } = useLocalization();
  const features = useFeatures(user);
  const [strategies, setStrategies] = useState<CustomStrategy[]>([]);
  const [editingStrategy, setEditingStrategy] = useState<CustomStrategy | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadStrategies = () => {
    if (user.email !== 'guest') {
      setStrategies(getCustomStrategies(user.email));
    }
  };

  useEffect(() => {
    loadStrategies();
  }, [user.email]);

  const handleDelete = (strategyId: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
        deleteCustomStrategy(strategyId, user.email);
        loadStrategies();
    }
  }

  if (!features.canAccessStrategyLab) {
    return (
      <div className="text-center p-10 bg-gray-800 rounded-lg max-w-2xl mx-auto">
        <div className="flex justify-center mb-4"><ProBadge /></div>
        <h2 className="text-2xl font-bold mb-2">{t('strategyLab.proFeatureTitle')}</h2>
        <p className="text-gray-400 mb-6">The Strategy Lab allows you to build, backtest, and deploy your own custom trading algorithms in the Game Arena.</p>
        <button onClick={onPaywallOpen} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold">
          {t('paywall.cta')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {(isCreating || editingStrategy) && 
        <StrategyEditorModal 
            strategy={editingStrategy} 
            user={user}
            onClose={() => { setIsCreating(false); setEditingStrategy(null); }}
            onSave={loadStrategies}
        />
      }

      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white">{t('strategyLab.title')}</h2>
            <p className="text-gray-400">{t('strategyLab.description')}</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold">
          {t('strategyLab.newStrategy')}
        </button>
      </div>
      
      <div className="space-y-4">
        {strategies.length > 0 ? strategies.map(strat => (
          <div key={strat.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">{strat.name}</h3>
              <p className="text-sm text-gray-400">{strat.description}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => setEditingStrategy(strat)} className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600">Edit</button>
              <button onClick={() => handleDelete(strat.id)} className="px-3 py-1 text-sm bg-red-800 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-500">{t('strategyLab.noStrategies')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyLabPage;