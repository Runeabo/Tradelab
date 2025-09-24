import React, { useState } from 'react';
import { User } from '../types';
import { registerForMagicLink } from '../services/gameService';
import Spinner from './Spinner';
import { useLocalization } from '../LocalizationContext';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const { t } = useLocalization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }
    setIsLoading(true);
    setError('');
    
    const response = await registerForMagicLink(email);
    
    setIsLoading(false);
    if (response.ok) {
        setVerifyUrl(response.verify_url);
        setSubmitted(true);
    } else {
        setError(t('auth.errors.generic'));
    }
  };
  
  const handleClose = () => {
      // Reset state on close
      setEmail('');
      setError('');
      setIsLoading(false);
      setSubmitted(false);
      setVerifyUrl('');
      onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl text-gray-300 max-w-md w-full mx-4 p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSubmitted ? (
            <>
                <h2 className="text-2xl font-bold text-center text-white mb-2">{t('auth.saveProgressTitle')}</h2>
                <p className="text-center text-gray-400 mb-6">{t('auth.saveProgressSubtitle')}</p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email-capture" className="sr-only">{t('auth.emailLabel')}</label>
                        <input
                        id="email-capture"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={t('auth.emailPlaceholder')}
                        />
                        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                    >
                        {isLoading ? <Spinner /> : t('buttons.sendMagicLink')}
                    </button>
                </form>
                <p className="text-center text-xs text-gray-500 mt-4">{t('auth.privacyNote')}</p>
            </>
        ) : (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('auth.magicLinkSent')}</h2>
                <p className="text-gray-400 mb-4">A magic link has been sent to your email.</p>
                <p className="text-xs text-gray-500 mb-4">(For this demo, just click the link below to verify instantly)</p>
                <a 
                    href={verifyUrl}
                    className="block w-full text-center py-3 px-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                    {t('auth.verifyLinkCta')}
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default EmailCaptureModal;
