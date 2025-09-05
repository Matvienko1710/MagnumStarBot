import React from 'react';
import BalanceCard from '../components/BalanceCard';
import EarnButton from '../components/EarnButton';

const Home = () => {
  const handleEarnClick = () => {
    // Открываем бота при клике на кнопку
    const webApp = window.Telegram.WebApp;
    webApp.close();
  };

  return (
    <div className="space-y-6 p-4">
      <BalanceCard />
      <EarnButton onClick={handleEarnClick} />
    </div>
  );
};

export default Home;
