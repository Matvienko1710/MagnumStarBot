import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { isAdmin } from '../utils/admin';

const BottomNavBar = () => {
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Проверяем статус админа при загрузке компонента
    const checkAdminStatus = async () => {
      const adminStatus = isAdmin();
      setUserIsAdmin(adminStatus);
    };

    checkAdminStatus();
  }, []);

  // Навигационные элементы для админов
  const adminNavItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/exchange', icon: '💱', label: 'Exchange' },
    { path: '/cases', icon: '📦', label: 'Кейсы' }
  ];

  // Навигационные элементы для обычных пользователей
  const userNavItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/tasks', icon: '📋', label: 'Tasks' },
    { path: '/exchange', icon: '💱', label: 'Exchange' },
    { path: '/cases', icon: '📦', label: 'Кейсы' }
  ];

  const navItems = userIsAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bg-dark/95 to-bg-dark2/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-md mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className="relative py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 group flex-1 max-w-[80px] sm:max-w-none"
            >
              <motion.div
                className={`flex flex-col items-center space-y-0.5 sm:space-y-1
                  ${location.pathname === path ? 'text-accent-gold' : 'text-white/60'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg sm:text-xl">{icon}</span>
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{label}</span>
                {location.pathname === path && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 sm:-bottom-2 left-1/2 w-8 sm:w-12 h-0.5 sm:h-1 bg-accent-gold rounded-full"
                    style={{ x: '-50%' }}
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
