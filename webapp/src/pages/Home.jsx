import React, { useRef, useEffect } from 'react';
import BalanceCard from '../components/BalanceCard';
import EarnButton from '../components/EarnButton';
import ClickButton from '../components/ClickButton';

const Home = () => {
  const balanceCardRef = useRef();

  useEffect(() => {
    const webApp = window.Telegram.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, []);

  const handleEarnClick = () => {
    // Открываем бота при клике на кнопку
    const webApp = window.Telegram.WebApp;
    webApp.close();
  };

  const handleBalanceUpdate = () => {
    // Обновляем баланс через ref
    if (balanceCardRef.current) {
      balanceCardRef.current.updateBalance();
    }
  };

  const webApp = window.Telegram?.WebApp;
  const debugInfo = {
    webAppInitialized: !!webApp,
    userId: webApp?.initDataUnsafe?.user?.id,
    platform: webApp?.platform,
    version: webApp?.version,
  };

  return (
    <div className="space-y-6 p-4">
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-black/50 p-4 rounded-lg text-xs font-mono whitespace-pre overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </div>
      )}
      <BalanceCard ref={balanceCardRef} />
      <ClickButton onBalanceUpdate={handleBalanceUpdate} />
      <EarnButton onClick={handleEarnClick} />
    </div>
  );
};

export default Home;
