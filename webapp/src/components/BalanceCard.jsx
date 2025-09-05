import React from 'react';
import { motion } from 'framer-motion';

const BalanceCard = ({ stars, coins }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg shadow-xl border border-white/10"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60">Stars Balance</span>
            <motion.span
              key={stars}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white"
            >
              ⭐ {stars.toLocaleString()}
            </motion.span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <span className="text-white/60">Magnum Coins</span>
            <motion.span
              key={coins}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white"
            >
              🪙 {coins.toLocaleString()}
            </motion.span>
          </motion.div>
        </div>
        
        <div className="pt-4 border-t border-white/10">
          <span className="text-sm text-white/40">
            Your digital assets are growing! 🚀
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
