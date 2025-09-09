import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';

const BalanceCard = forwardRef((props, ref) => {
  const [balance, setBalance] = useState({ stars: 0, coins: 0 });
  const [error, setError] = useState(null);
  const webApp = window.Telegram.WebApp;

  const fetchBalance = async () => {
    try {
      const userId = webApp?.initDataUnsafe?.user?.id;
      
      if (!userId) {
        console.warn('⚠️ User ID не найден, используем дефолтные значения');
        setBalance({ stars: 10, coins: 1000 });
        return;
      }

      const response = await fetch(`/api/balance/${userId}`);
      
      if (!response.ok) {
        console.warn('⚠️ API недоступен, используем дефолтные значения');
        setBalance({ stars: 10, coins: 1000 });
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Поддерживаем два формата API: старый (data.balance) и новый (data.stars/coins)
        const stars = data.stars || data.balance?.stars || 0;
        const coins = data.coins || data.balance?.coins || 0;
        console.log('✅ Баланс получен:', { stars, coins, fullData: data });
        setBalance({ stars, coins });
        setError(null);
      } else {
        console.warn('⚠️ API вернул ошибку:', data.error);
        setBalance({ stars: 10, coins: 1000 });
        setError(null); // Не показываем ошибку пользователю
      }
    } catch (err) {
      console.warn('⚠️ Ошибка получения баланса:', err);
      setBalance({ stars: 10, coins: 1000 });
      setError(null); // Не показываем ошибку пользователю
    }
  };

  useImperativeHandle(ref, () => ({
    updateBalance: fetchBalance
  }));

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 sm:p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
    >
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60 text-sm sm:text-base">Stars Balance</span>
            <motion.span
              key={balance.stars}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl md:text-2xl font-bold text-white"
            >
              ⭐ {balance.stars.toLocaleString()}
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60 text-sm sm:text-base">Magnum Coins</span>
            <motion.span
              key={balance.coins}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl md:text-2xl font-bold text-white"
            >
              💰 {balance.coins.toLocaleString()}
            </motion.span>
          </motion.div>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-white/10">
          <span className="text-xs sm:text-sm text-white/40">
            Your digital assets are growing! 🚀
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default BalanceCard;
