import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdTask = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleWatchAd = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const webApp = window.Telegram.WebApp;
      const userId = webApp.initDataUnsafe.user.id;

      // Показываем рекламу
      await window.show_9830844();
      
      // После успешного просмотра рекламы отправляем запрос на сервер
      const response = await fetch(`/api/reward/${userId}/ad-watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rewardType: 'ad-watch',
          amount: 0.05
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (webApp.HapticFeedback) {
          webApp.HapticFeedback.impactOccurred('medium');
        }
        onComplete(data.balance);
      } else {
        throw new Error(data.message || 'Ошибка получения награды');
      }
    } catch (error) {
      console.error('Error watching ad:', error);
      setError(error.message || 'Произошла ошибка при просмотре рекламы');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="p-4 bg-gradient-to-br from-blue-500/30 to-blue-600/5 rounded-2xl backdrop-blur-lg border-2 border-blue-500/50 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-blue-400 mb-2">Смотреть рекламу</h3>
          <p className="text-blue-300">Награда: 0.05 ⭐</p>
        </div>
        
        <motion.button
          className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
          onClick={handleWatchAd}
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : '👁️ Смотреть рекламу'}
        </motion.button>

        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdTask;
