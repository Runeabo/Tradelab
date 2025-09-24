import React, { useState, useEffect } from 'react';
import { User, GameRound } from './types';
import Header from './components/Header';
import GameArena from './components/GameArena';
import Leaderboard from './components/Leaderboard';
import DisclaimerModal from './components/Disclaimer';
import Analytics from './components/Analytics';
import Achievements from './components/Achievements';
import DailyChallengePage from './components/DailyChallengePage';
import PvPPage from './components/PvPPage';
import EmailCaptureModal from './components/EmailCaptureModal';
import { logRound } from './services/gameService';
import { LocalizationProvider, useLocalization } from './LocalizationContext';
import PaywallModal from './components/PaywallModal';
import AccountPage from './components/AccountPage';
import StrategyLabPage from './components/StrategyLabPage';

type Page = 'Home' | 'Leaderboard' | 'Achievements' | 'Analytics' | 'Daily Challenge' | 'PvP' | 'Account' | 'Strategy Lab';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('Home');
  const [gameKey, setGameKey] = useState(0);
  
  const [isDisclaimerRequired, setDisclaimerRequired] = useState(false);
  const [isDisclaimerVisible, setDisclaimerVisible] = useState(false);
  const [isEmailModalOpen, setEmailModalOpen] = useState(false);
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  
  const { t } = useLocalization();

  useEffect(() => {
    // Feature 2: Disclaimer Modal
    if (localStorage.getItem('disclaimerAccepted') !== 'true') {
      setDisclaimerRequired(true);
      setDisclaimerVisible(true);
    }

    // Feature 1: Magic-Link Token Check
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (token && email) {
      // In a real app, you'd verify the token with the backend to get user details including role.
      // For this demo, we'll assign a role. Let's make verified users 'pro' for testing.
      const loggedInUser: User = { email, token, role: 'pro', trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Ensure role exists, default to 'free'
        setUser({ ...parsedUser, role: parsedUser.role || 'free' });
      }
    }
  }, []);

  const handleDisclaimerAccept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setDisclaimerRequired(false);
    setDisclaimerVisible(false);
  };
  
  const handleFirstTrade = () => {
    if (!user) {
      setEmailModalOpen(true);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    // On magic link success, we get the user object which might have role info
    const userWithRole: User = { ...loggedInUser, role: loggedInUser.role || 'pro', trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
    setUser(userWithRole);
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setEmailModalOpen(false);
    alert('Verification successful! Your 7-day Pro trial has started.');
  };

  const handleRoundEnd = (round: GameRound) => {
    if (user) {
      logRound(round);
    }
    alert(`Round Finished! Your performance: ${round.performance.toFixed(2)}%`);
    setCurrentPage('Leaderboard');
    setGameKey(prev => prev + 1);
  };
  
  const renderPage = () => {
    const pageUser = user || { email: 'guest', role: 'free' };
    switch(currentPage) {
        case 'Home':
            return <GameArena key={gameKey} user={pageUser} onRoundEnd={handleRoundEnd} onFirstTrade={handleFirstTrade} isLocked={isDisclaimerRequired} onPaywallOpen={() => setPaywallOpen(true)} />;
        case 'Leaderboard':
            return <Leaderboard user={user} />;
        case 'Achievements':
            return <Achievements user={pageUser} />;
        case 'Analytics':
            return <Analytics user={pageUser} />;
        case 'Daily Challenge':
            return <DailyChallengePage user={pageUser} />;
        case 'PvP':
            return <PvPPage user={pageUser} />;
        case 'Account':
            return <AccountPage user={user} />;
        case 'Strategy Lab':
            return <StrategyLabPage user={pageUser} onPaywallOpen={() => setPaywallOpen(true)} />;
        default:
            return <GameArena key={gameKey} user={pageUser} onRoundEnd={handleRoundEnd} onFirstTrade={handleFirstTrade} isLocked={isDisclaimerRequired} onPaywallOpen={() => setPaywallOpen(true)} />;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="mt-8">
          {renderPage()}
        </div>
      </main>
      <DisclaimerModal 
        isOpen={isDisclaimerVisible} 
        onClose={() => setDisclaimerVisible(false)}
        isAcceptanceRequired={isDisclaimerRequired}
        onAccept={handleDisclaimerAccept}
      />
      <EmailCaptureModal
        isOpen={isEmailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setPaywallOpen(false)}
        user={user}
      />
      <footer className="text-center py-4 text-xs text-gray-500">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })} • {' '}
          <button onClick={() => setDisclaimerVisible(true)} className="underline hover:text-white transition-colors">
              {t('footer.disclaimer')}
          </button> • {' '}
          <a href="#" className="underline hover:text-white transition-colors">{t('footer.privacy')}</a>
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <AppContent />
    </LocalizationProvider>
  );
};

export default App;