import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CaseCard = ({ title, description, price, rarity }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-500';
      case 'rare': return 'from-blue-400 to-blue-500';
      case 'epic': return 'from-purple-400 to-purple-500';
      case 'legendary': return 'from-yellow-400 to-yellow-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'common': return 'Обычный';
      case 'rare': return 'Редкий';
      case 'epic': return 'Эпический';
      case 'legendary': return 'Легендарный';
      default: return 'Обычный';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(rarity)} text-white`}>
            {getRarityText(rarity)}
          </div>
        </div>

        <p className="text-sm text-white/60">{description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-accent-gold">
              {price.toLocaleString()}
            </span>
          </div>
          <button className="py-2 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-sm font-medium text-black transition-colors">
            Открыть
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Cases = () => {
  const [balance, setBalance] = useState(null);

  const cases = [
    {
      id: 'case1',
      title: 'Стандартный кейс',
      description: 'Содержит обычные награды и ресурсы',
      price: 100,
      rarity: 'common'
    },
    {
      id: 'case2',
      title: 'Редкий кейс',
      description: 'Шанс получить ценные предметы и бонусы',
      price: 250,
      rarity: 'rare'
    },
    {
      id: 'case3',
      title: 'Эпический кейс',
      description: 'Высокий шанс на получение редких наград',
      price: 500,
      rarity: 'epic'
    },
    {
      id: 'case4',
      title: 'Легендарный кейс',
      description: 'Максимальные награды и уникальные предметы',
      price: 1000,
      rarity: 'legendary'
    }
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center text-white mb-2">Кейсы</h1>
      <p className="text-center text-blue-300 mb-6">Открывайте кейсы и получайте награды!</p>

      <div className="grid gap-4">
        {cases.map(caseItem => (
          <CaseCard
            key={caseItem.id}
            title={caseItem.title}
            description={caseItem.description}
            price={caseItem.price}
            rarity={caseItem.rarity}
          />
        ))}
      </div>
    </div>
  );
};

export default Cases;
