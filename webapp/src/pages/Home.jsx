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
    <div className="space-y-6 p-4">
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-black/50 p-4 rounded-lg text-xs font-mono whitespace-pre overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </div>
      )}

      {/* Информация для администраторов о доступе */}
      {!userIsAdmin && currentUser?.id && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <h3 className="text-yellow-300 font-semibold mb-2">🔑 Для доступа к полным функциям:</h3>
          <p className="text-white/80 text-sm mb-2">
            Ваш ID: <code className="bg-black/30 px-2 py-1 rounded text-yellow-300">{currentUser.id}</code>
          </p>
          <p className="text-white/60 text-xs">
            Добавьте этот ID в переменную <code className="bg-black/30 px-1 rounded">ADMIN_IDS</code> на сервере
          </p>
        </div>
      )}

      <BalanceCard ref={balanceCardRef} />
      <ClickButton onBalanceUpdate={handleBalanceUpdate} />
      <EarnButton onClick={handleEarnClick} />
      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onComplete={handleAdComplete}
      />
    </div>
  );
};

export default Home;
