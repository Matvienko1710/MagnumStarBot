import React from 'react';
import { motion } from 'framer-motion';

const TaskCard = ({ title, description, reward, type }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center space-x-1">
            <span className="text-lg">{type === 'stars' ? '⭐' : '🪙'}</span>
            <span className="font-bold text-accent-gold">
              {reward.toLocaleString()}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-white/60">{description}</p>
        
        <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors">
          Start Task
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
