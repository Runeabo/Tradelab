import React from 'react';
import { useLocalization } from '../LocalizationContext';

type Page = 'Home' | 'Leaderboard' | 'Achievements' | 'Analytics' | 'Daily Challenge' | 'PvP' | 'Account' | 'Strategy Lab';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { t } = useLocalization();

  const NavItem: React.FC<{ page: Page, text?: string }> = ({ page, text }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentPage === page
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {text || page}
    </button>
  );

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <svg className="h-10 w-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8" />
            <path d="M12 15v6" />
            <path d="M10 3h4v4l-4 8h12v-8l-4-4Z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('brand.name')}</h1>
            <p className="text-xs text-gray-400 hidden sm:block">{t('brand.tagline')}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <NavItem page="Home" text={t('navbar.home')} />
          <NavItem page="Leaderboard" text={t('navbar.leaderboard')} />
          <NavItem page="Strategy Lab" text={t('navbar.strategyLab')} />
          <NavItem page="Daily Challenge" text={t('tournaments.title')} />
          <NavItem page="PvP" text="PvP" />
          <NavItem page="Account" text={t('navbar.account')} />
        </div>
      </nav>
    </header>
  );
};

export default Header;