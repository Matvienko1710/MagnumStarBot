import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ClickButton = ({ onBalanceUpdate }) => {
  const [webApp, setWebApp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setWebApp(window.Telegram.WebApp);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleClick = async () => {
    const now = Date.now();
    if (isLoading || cooldown > 0 || now - lastClickTime < 1000) return;

    setIsLoading(true);
    setLastClickTime(now);
    setCooldown(1);

    try {
      const userId = webApp?.initDataUnsafe?.user?.id;
      if (!userId) {
        console.warn('User ID not found');
        return;
      }

      const response = await fetch(`/api/click/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && onBalanceUpdate) {
          onBalanceUpdate();
        }
      }
    } catch (error) {
      console.error('Click error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!webApp) {
    return (
      <div className="w-full h-48 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
        <span className="text-red-300">Ошибка инициализации Telegram WebApp</span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading || cooldown > 0}
      className="w-full h-40 xs:h-44 sm:h-48 md:h-52 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/5 backdrop-blur-lg overflow-hidden border-2 border-yellow-500/50 shadow-xl flex items-center justify-center px-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 sm:mb-3 text-yellow-400"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
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
            💰
          </motion.div>
        </div>
        <span className="text-yellow-300 font-bold text-sm sm:text-base md:text-lg lg:text-xl mt-2 sm:mt-3 text-center leading-tight">
          {isLoading ? 'Загрузка...' : cooldown > 0 ? `Кулдаун: ${cooldown}с` : 'Нажми для заработка!'}
        </span>
        
        {/* Progress bar */}
        {cooldown > 0 && (
          <div className="w-full max-w-32 h-1 bg-yellow-500/20 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-yellow-400 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: cooldown, ease: "linear" }}
            />
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default ClickButton;
