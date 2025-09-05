import React, { useState } from 'react';
import TaskCard from '../components/TaskCard';
import AdTask from '../components/AdTask';

const Tasks = () => {
  const [balance, setBalance] = useState(null);

  const handleTaskComplete = (newBalance) => {
    setBalance(newBalance);
    const webApp = window.Telegram.WebApp;
    if (webApp.MainButton) {
      webApp.MainButton.show();
      webApp.MainButton.setParams({
        text: `Баланс: ${newBalance.stars.toFixed(2)} ⭐ | ${newBalance.coins} 🪙`
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center text-white mb-2">Задания</h1>
      <p className="text-center text-blue-300 mb-6">Выполняйте задания и получайте звезды!</p>
      
      <AdTask onComplete={handleTaskComplete} />
    </div>
  );
};

export default Tasks;
