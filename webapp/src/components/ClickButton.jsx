import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ClickButton = () => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    setWebApp(window.Telegram.WebApp);
  }, []);

  if (!webApp) {
    return (
      <div className="w-full h-48 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
        <span className="text-red-300">Ошибка инициализации Telegram WebApp</span>
      </div>
    );
  }

  return (
    <div className="w-full h-40 xs:h-44 sm:h-48 md:h-52 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/5 backdrop-blur-lg overflow-hidden border-2 border-yellow-500/50 shadow-xl flex items-center justify-center px-4">
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
          Magnum Coins
        </span>
      </div>
    </div>
  );
};

export default ClickButton;
