import React from 'react';
import { motion } from 'framer-motion';

const ProfileCard = ({ userId, totalStars, totalCoins }) => {
  // Generate initials from userId
  const initials = `U${userId.toString().slice(-2)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10"
    >
      <div className="space-y-6">
        {/* Avatar and ID */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue to-accent-gold flex items-center justify-center text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">User Profile</h2>
            <p className="text-white/60">ID: {userId}</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60">Total Stars Earned</p>
            <p className="text-xl font-bold text-white flex items-center space-x-1">
              <span>⭐</span>
              <span>{totalStars.toLocaleString()}</span>
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60">Total Coins Earned</p>
            <p className="text-xl font-bold text-white flex items-center space-x-1">
              <span>🪙</span>
              <span>{totalCoins.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
