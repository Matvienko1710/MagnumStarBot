import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';

const BottomNavBar = () => {
  const location = useLocation();

  // Навигационные элементы доступны всем пользователям
  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/cases', icon: '📦', label: 'Кейсы' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bg-dark/95 to-bg-dark2/95 backdrop-blur-lg border-t border-white/10 safe-bottom z-50">
      <div className="max-w-md mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
        <div className="flex justify-around items-center">
          {navItems.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className="relative touch-target tap-highlight-transparent group flex-1 max-w-[90px] xs:max-w-[100px] sm:max-w-none"
            >
              <motion.div
                className={`flex flex-col items-center justify-center space-y-1 xs:space-y-1.5 p-2 rounded-lg transition-colors duration-200
                  ${location.pathname === path 
                    ? 'text-accent-gold bg-white/10' 
                    : 'text-white/70 hover:text-white/90 active:bg-white/5'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-xl xs:text-2xl sm:text-2xl">{icon}</span>
                <span className="text-[10px] xs:text-xs sm:text-xs font-medium text-center leading-tight truncate w-full">
                  {label}
                </span>
                {location.pathname === path && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-0.5 left-1/2 w-6 xs:w-8 sm:w-10 h-1 bg-accent-gold rounded-full"
                    style={{ x: '-50%' }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
