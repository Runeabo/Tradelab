import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext';
import { createCheckoutSession } from '../services/billingService';
import { User } from '../types';
import Spinner from './Spinner';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const bullets: string[] = t('paywall.bullets');

  const handleUpgradeClick = async () => {
    if (!user?.token) {
        setError("You must be logged in to upgrade.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Defaulting to monthly plan for the trial CTA
      const checkoutUrl = await createCheckoutSession('pro_monthly', user.token);
      window.location.href = checkoutUrl;
    } catch (err) {
      setError("Could not connect to the billing service. Please try again later.");
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl text-gray-300 max-w-md w-full mx-4 p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 id="paywall-title" className="text-3xl font-bold text-center text-white mb-6">{t('paywall.title')}</h2>
        
        <ul className="space-y-3 my-8">
            {bullets.map((bullet, index) => (
                 <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{bullet}</span>
                </li>
            ))}
        </ul>

        {error && <p className="text-center text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
            <button
                onClick={handleUpgradeClick}
                disabled={isLoading}
                className="w-full py-3 px-4 text-lg font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-wait transition-all transform hover:scale-105"
            >
                {isLoading ? <Spinner /> : t('paywall.cta')}
            </button>
            <button
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
                {t('paywall.later')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
