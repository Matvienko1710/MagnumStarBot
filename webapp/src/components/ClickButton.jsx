import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ClickButton = ({ onBalanceUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    setWebApp(window.Telegram.WebApp);
  }, []);

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
      console.log('Sending click request for user:', userId); // Добавляем лог
      const response = await fetch(`/api/click/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Click response:', response); // Добавляем лог
      const data = await response.json();
      console.log('Click data:', data); // Добавляем лог

      if (data.success) {
        onBalanceUpdate();
        // Анимация получения монет
        if (webApp && webApp.HapticFeedback) {
          webApp.HapticFeedback.impactOccurred('medium');
        }
      }
    } catch (error) {
      console.error('Error clicking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((COOLDOWN_TIME - cooldown) / COOLDOWN_TIME) * 100;

  if (!webApp) {
    return (
      <div className="w-full h-48 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
        <span className="text-red-300">Ошибка инициализации Telegram WebApp</span>
      </div>
    );
  }

  return (
    <motion.button
      className="relative w-full h-40 xs:h-44 sm:h-48 md:h-52 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/5 backdrop-blur-lg overflow-hidden border-2 border-yellow-500/50 shadow-xl touch-target tap-highlight-transparent select-none-mobile"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      disabled={isLoading || cooldown > 0}
      style={{
        boxShadow: '0 0 20px rgba(234, 179, 8, 0.2)',
        touchAction: 'manipulation'
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Прогресс бар */}
      <motion.div
        className="absolute bottom-0 left-0 h-1.5 sm:h-2 bg-gradient-to-r from-yellow-500/70 to-yellow-400"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="relative">
          <motion.div
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 sm:mb-3 text-yellow-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            МС
          </motion.div>
          <motion.div
            className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 transform translate-x-full text-2xl sm:text-3xl md:text-4xl"
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
        <span className="text-yellow-300 font-bold text-sm sm:text-base md:text-lg lg:text-xl mt-2 sm:mt-3 text-center leading-tight">
          {cooldown > 0 ?
            `⏳ ${(cooldown / 1000).toFixed(1)}s` :
            `✨ Получить ${COINS_PER_CLICK} монету ✨`}
        </span>
      </div>

      {/* Эффект нажатия */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
};

export default ClickButton;
