import React from 'react';
import BalanceCard from '../components/BalanceCard';
import EarnButton from '../components/EarnButton';

const Home = () => {
  // Mock data - replace with real data
  const balance = {
    stars: 1234,
    coins: 5678
  };

  const handleEarnClick = () => {
    // Handle earn button click
    console.log('Earn button clicked');
  };

  return (
    <div className="space-y-6 p-4">
      <BalanceCard stars={balance.stars} coins={balance.coins} />
      <EarnButton onClick={handleEarnClick} />
    </div>
  );
};

export default Home;
