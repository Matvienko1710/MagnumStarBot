import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BalanceCard = () => {
  const [balance, setBalance] = useState({ stars: 0, coins: 0 });
  const [error, setError] = useState(null);
  const webApp = window.Telegram.WebApp;

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const userId = webApp.initDataUnsafe.user.id;
        const response = await fetch(`/api/balance/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setBalance({
            stars: data.balance.stars || 0,
            coins: data.balance.coins || 0
          });
        } else {
          setError(data.message || 'Failed to fetch balance');
        }
      } catch (err) {
        setError('Error fetching balance');
        console.error('Error:', err);
      }
    };

    // Получаем баланс сразу при монтировании
    fetchBalance();

    // Обновляем баланс каждые 30 секунд
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60">Stars Balance</span>
            <motion.span
              key={balance.stars}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white"
            >
              ⭐ {balance.stars.toLocaleString()}
            </motion.span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60">Magnum Coins</span>
            <motion.span
              key={balance.coins}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white"
            >
              🪙 {balance.coins.toLocaleString()}
            </motion.span>
          </motion.div>
        </div>
        
        <div className="pt-4 border-t border-white/10">
          <span className="text-sm text-white/40">
            Your digital assets are growing! 🚀
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
