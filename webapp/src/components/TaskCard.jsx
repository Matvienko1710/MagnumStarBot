import React from 'react';
import { motion } from 'framer-motion';

const TaskCard = ({ title, description, reward, type }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-white leading-tight">{title}</h3>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <span className="text-base sm:text-lg">{type === 'stars' ? '⭐' : '🪙'}</span>
            <span className="font-bold text-accent-gold text-sm sm:text-base">
              {reward.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{description}</p>

        <button className="w-full py-2 px-3 sm:px-4 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm font-medium text-white transition-colors">
          Start Task
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
