import React, { useRef, useEffect, useState } from 'react';
import BalanceCard from '../components/BalanceCard';
import EarnButton from '../components/EarnButton';
import ClickButton from '../components/ClickButton';
import AdModal from '../components/AdModal';

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
      <AdModal 
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onComplete={handleAdComplete}
      />
    </div>
  );
};

export default Home;
