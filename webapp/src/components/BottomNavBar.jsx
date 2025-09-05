import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/tasks', icon: '📋', label: 'Tasks' },
  { path: '/exchange', icon: '💱', label: 'Exchange' },
  { path: '/profile', icon: '👤', label: 'Profile' }
];

const BottomNavBar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-bg-dark/95 to-bg-dark2/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ path, icon, label }) => (
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
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
