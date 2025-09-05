import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ClickButton = ({ onBalanceUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const webApp = window.Telegram.WebApp;

  const COOLDOWN_TIME = 1000; // 1 секунда между кликами
  const COINS_PER_CLICK = 1; // 1 монета за клик

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleClick = async () => {
    const now = Date.now();
    if (now - lastClickTime < COOLDOWN_TIME) {
      return;
    }

    setIsLoading(true);
    setLastClickTime(now);
    setCooldown(COOLDOWN_TIME);

    try {
      const userId = webApp.initDataUnsafe.user.id;
      const response = await fetch(`/api/click/${userId}`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        onBalanceUpdate();
        // Анимация получения монет можно добавить здесь
      }
    } catch (error) {
      console.error('Error clicking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((COOLDOWN_TIME - cooldown) / COOLDOWN_TIME) * 100;

  return (
    <motion.button
      className="relative w-full h-32 rounded-2xl bg-gradient-to-br from-accent-gold/30 to-accent-gold/5 backdrop-blur-lg overflow-hidden border border-accent-gold/20 shadow-lg"
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={isLoading || cooldown > 0}
    >
      {/* Прогресс бар */}
      <motion.div
        className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-accent-gold/50 to-accent-gold"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="text-6xl font-bold mb-2 text-accent-gold"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            МС
          </motion.div>
          <motion.div 
            className="absolute -top-1 -right-1 transform translate-x-full"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🪙
          </motion.div>
        </div>
        <span className="text-white/80 font-medium mt-2">
          {cooldown > 0 ? 
            `${(cooldown / 1000).toFixed(1)}s` : 
            `Получить ${COINS_PER_CLICK} монету`}
        </span>
      </div>

      {/* Эффект нажатия */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-accent-gold/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
};

export default ClickButton;
