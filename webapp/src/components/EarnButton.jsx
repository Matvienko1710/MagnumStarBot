import React from 'react';
import { motion } from 'framer-motion';

const EarnButton = ({ onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-full py-3 sm:py-4 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-accent-blue to-accent-gold rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/20 to-accent-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-center space-x-2">
        <span className="text-base sm:text-lg md:text-xl">Earn Stars</span>
        <span className="text-lg sm:text-xl md:text-2xl">⭐</span>
      </div>
    </motion.button>
  );
};

export default EarnButton;
