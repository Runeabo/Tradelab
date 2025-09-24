import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAcceptanceRequired?: boolean;
  onAccept?: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose, isAcceptanceRequired = false, onAccept }) => {
  const [isChecked, setIsChecked] = useState(false);
  const { t } = useLocalization();

  if (!isOpen) {
    return null;
  }

  const handleAccept = () => {
    if (isChecked && onAccept) {
      onAccept();
    }
  };
  
  const disclaimerBullets: string[] = t('disclaimer.bullets');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={!isAcceptanceRequired ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl text-gray-300 max-w-2xl w-full mx-4 p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {!isAcceptanceRequired && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Close disclaimer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <h2 id="disclaimer-title" className="text-3xl font-bold text-center text-white mb-6">{t('disclaimer.title')}</h2>
        <div className="space-y-3 text-sm prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none">
          {Array.isArray(disclaimerBullets) && disclaimerBullets.map((bullet, index) => (
            <p key={index}><strong>•</strong> {bullet}</p>
          ))}
        </div>

        {isAcceptanceRequired && (
          <div className="mt-6 p-4 bg-gray-900/60 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={() => setIsChecked(!isChecked)} 
                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-white select-none">{t('disclaimer.agree')}</span>
            </label>
          </div>
        )}

        <div className="mt-8 text-center">
          {isAcceptanceRequired ? (
            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className="px-8 py-3 w-full font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            >
              {t('buttons.continue')}
            </button>
          ) : (
            <button onClick={onClose} className="px-8 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {t('buttons.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
