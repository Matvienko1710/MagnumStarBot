import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ExchangeForm = () => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('stars');

  const handleExchange = (e) => {
    e.preventDefault();
    // Handle exchange logic
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10"
    >
      <form onSubmit={handleExchange} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-accent-blue"
              placeholder="Enter amount"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-white/60">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="stars">⭐ Stars</option>
                <option value="coins">💰 Magnum Coins</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFromCurrency(fromCurrency === 'stars' ? 'coins' : 'stars')}
              className="self-end p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              🔄
            </button>

            <div className="flex-1 space-y-2">
              <label className="text-sm text-white/60">To</label>
              <select
                value={fromCurrency === 'stars' ? 'coins' : 'stars'}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="coins">💰 Magnum Coins</option>
                <option value="stars">⭐ Stars</option>
              </select>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-accent-blue to-accent-gold rounded-xl font-semibold text-white shadow-lg"
        >
          Exchange
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ExchangeForm;
