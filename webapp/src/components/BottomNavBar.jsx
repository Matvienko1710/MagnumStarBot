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
      console.log('🧭 NAV DEBUG: Проверка статуса админа в навигации...');
      const adminStatus = isAdmin();
      console.log('🎯 NAV DEBUG: Результат проверки админа в навигации:', adminStatus);
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
    { path: '/tasks', icon: '🚧', label: 'Coming Soon', disabled: true },
    { path: '/exchange', icon: '🚧', label: 'Coming Soon', disabled: true },
    { path: '/cases', icon: '🚧', label: 'Coming Soon', disabled: true }
  ];

  const navItems = userIsAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bg-dark/95 to-bg-dark2/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ path, icon, label, disabled }) => (
            disabled ? (
              <div
                key={path}
                className="relative py-2 px-4 group cursor-not-allowed opacity-50"
              >
                <motion.div
                  className="flex flex-col items-center space-y-1 text-white/40"
                  whileHover={{ scale: 1.0 }}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </motion.div>
              </div>
            ) : (
              <Link
                key={path}
                to={path}
                className="relative py-2 px-4 group"
              >
                <motion.div
                  className={`flex flex-col items-center space-y-1
                    ${location.pathname === path ? 'text-accent-gold' : 'text-white/60'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                  {location.pathname === path && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-2 left-1/2 w-12 h-1 bg-accent-gold rounded-full"
                      style={{ x: '-50%' }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
