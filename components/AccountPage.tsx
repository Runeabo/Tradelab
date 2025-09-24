import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { useLocalization } from '../LocalizationContext';
import { createPortalSession } from '../services/billingService';
import Spinner from './Spinner';

interface AccountPageProps {
  user: User | null;
}

const AccountPage: React.FC<AccountPageProps> = ({ user }) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const trialDaysLeft = useMemo(() => {
    if (!user?.trial_ends_at) return null;
    const trialEndDate = new Date(user.trial_ends_at);
    const now = new Date();
    if (trialEndDate < now) return null;
    const diffTime = Math.abs(trialEndDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [user]);

  const handleManageBilling = async () => {
    if (!user?.token) {
        setError("Authentication token not found.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const portalUrl = await createPortalSession(user.token);
      window.location.href = portalUrl;
    } catch (err) {
      setError("Could not connect to billing portal. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    alert(t('account.exporting'));
    // In a real app, this would trigger a download from a backend endpoint.
    // e.g., window.location.href = 'http://localhost:8000/me/export';
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      alert(t('account.deleting'));
      // In a real app, this would send a POST request to a backend endpoint.
      // e.g., fetch('http://localhost:8000/me/delete', { method: 'POST', headers: { ... } });
    }
  };

  if (!user) {
    return <div className="text-center text-gray-400">Please log in to view your account.</div>;
  }
  
  const planName = user.role === 'pro' ? t('account.planPro') : t('account.planFree');
  const planColor = user.role === 'pro' ? 'text-blue-400' : 'text-gray-300';

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl space-y-8">
      <h2 className="text-3xl font-bold text-center text-white">{t('account.title')}</h2>
      
      {/* Plan Information */}
      <div className="bg-gray-900/50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">{t('account.role')}:</span>
          <span className={`text-xl font-bold ${planColor}`}>{planName}</span>
        </div>
        {trialDaysLeft !== null && user.role !== 'pro' && (
          <div className="flex justify-between items-center text-green-400">
            <span>{t('account.trial')}:</span>
            <span className="font-semibold">{trialDaysLeft} days</span>
          </div>
        )}
      </div>

      {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      
      {/* Actions */}
      <div className="space-y-4">
        {user.role === 'pro' ? (
            <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="w-full py-3 px-4 text-md font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
            >
              {isLoading ? <Spinner /> : t('account.manage')}
            </button>
        ) : (
            <button
                onClick={handleManageBilling} // Using the same handler to trigger checkout for a free user
                disabled={isLoading}
                className="w-full py-3 px-4 text-md font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 transition-colors"
            >
                 {isLoading ? <Spinner /> : "Upgrade to Pro"}
            </button>
        )}

        <button
          onClick={handleExportData}
          className="w-full py-3 px-4 text-md font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          {t('account.export')}
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full py-2 text-sm text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
        >
          {t('account.delete')}
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
