import React, { useRef, useEffect, useState } from 'react';
import BalanceCard from '../components/BalanceCard';
import EarnButton from '../components/EarnButton';
import ClickButton from '../components/ClickButton';
import AdModal from '../components/AdModal';
import { isAdmin, getCurrentUser } from '../utils/admin';

const Home = () => {
  const balanceCardRef = useRef();
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  useEffect(() => {
    const webApp = window.Telegram.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, []);

  const handleEarnClick = () => {
    setIsAdModalOpen(true);
  };

  const handleAdComplete = (newBalance) => {
    if (balanceCardRef.current) {
      balanceCardRef.current.updateBalance();
    }
    setIsAdModalOpen(false);
  };

  const handleBalanceUpdate = () => {
    // Обновляем баланс через ref
    if (balanceCardRef.current) {
      balanceCardRef.current.updateBalance();
    }
  };

  const webApp = window.Telegram?.WebApp;
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();

  const debugInfo = {
    webAppInitialized: !!webApp,
    userId: currentUser?.id,
    username: currentUser?.username,
    firstName: currentUser?.first_name,
    platform: webApp?.platform,
    version: webApp?.version,
    isAdmin: userIsAdmin,
    adminInstructions: userIsAdmin
      ? '✅ У вас есть доступ ко всем функциям!'
      : '❌ Для доступа к Задачам, Бирже и Кейсам обратитесь к администратору'
  };

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6 p-2 xs:p-3 sm:p-4 min-h-screen-safe">
      {/* Временно скрыто для диагностики серой полоски */}
      {false && process.env.NODE_ENV === 'development' && (
        <div className="bg-black/50 p-3 xs:p-4 rounded-lg text-xs font-mono whitespace-pre overflow-auto max-h-40 overflow-y-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </div>
      )}

      <div className="safe-top">
        <BalanceCard ref={balanceCardRef} />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-4 xs:py-6">
        <ClickButton onBalanceUpdate={handleBalanceUpdate} />
      </div>
      
      <div className="safe-bottom">
        <EarnButton onClick={handleEarnClick} />
      </div>
      
      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onComplete={handleAdComplete}
      />
    </div>
  );
};

export default Home;
