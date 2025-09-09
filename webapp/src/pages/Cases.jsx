import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Утилиты для редкости
const getRarityConfig = (rarity) => {
  const configs = {
    common: {
      color: 'from-gray-400 to-gray-600',
      glow: 'shadow-gray-500/50',
      borderColor: 'border-gray-400/50',
      text: 'Обычный',
      dropChance: 60,
      emoji: '⚪'
    },
    rare: {
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-blue-500/50',
      borderColor: 'border-blue-400/50',
      text: 'Редкий',
      dropChance: 25,
      emoji: '🔵'
    },
    epic: {
      color: 'from-purple-400 to-purple-600',
      glow: 'shadow-purple-500/50',
      borderColor: 'border-purple-400/50',
      text: 'Эпический',
      dropChance: 12,
      emoji: '🟣'
    },
    legendary: {
      color: 'from-yellow-400 to-orange-500',
      glow: 'shadow-yellow-500/50',
      borderColor: 'border-yellow-400/50',
      text: 'Легендарный',
      dropChance: 3,
      emoji: '🟡'
    }
  };
  return configs[rarity] || configs.common;
};

// Компонент предмета в рулетке
const RouletteItem = ({ item, isSelected = false }) => {
  const rarityConfig = getRarityConfig(item.rarity);
  
  return (
    <motion.div 
      className={`
        relative min-w-[120px] h-[140px] mx-2 rounded-xl p-3 
        bg-gradient-to-br ${rarityConfig.color} 
        border-2 ${rarityConfig.borderColor}
        flex flex-col items-center justify-center text-center
        ${isSelected ? `ring-4 ring-white/50 scale-110 ${rarityConfig.glow}` : 'shadow-lg'}
      `}
      animate={isSelected ? { 
        scale: [1, 1.1, 1], 
        boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.5)', '0 0 0 rgba(255,255,255,0)']
      } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="text-3xl mb-2">{item.icon}</div>
      <div className="text-white font-bold text-sm mb-1">{item.name}</div>
      <div className="text-white/80 text-xs">{item.description}</div>
      <div className="absolute top-1 right-1 text-xs">{rarityConfig.emoji}</div>
    </motion.div>
  );
};

// Компонент рулетки
const CaseRoulette = ({ items, isSpinning, onSpinComplete, selectedItem }) => {
  const containerRef = useRef(null);
  const [displayItems, setDisplayItems] = useState([]);

  useEffect(() => {
    // Создаем массив предметов для рулетки (много дубликатов для эффекта)
    const extendedItems = [];
    for (let i = 0; i < 50; i++) {
      extendedItems.push(...items.map((item, index) => ({ ...item, id: `${item.id}-${i}-${index}` })));
    }
    setDisplayItems(extendedItems);
  }, [items]);

  const scrollToWinner = (winnerIndex) => {
    if (containerRef.current) {
      const itemWidth = 144; // 120px + margins
      const containerWidth = containerRef.current.offsetWidth;
      const targetPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
      
      containerRef.current.style.transform = `translateX(-${targetPosition}px)`;
    }
  };

  useEffect(() => {
    if (isSpinning && selectedItem) {
      // Находим позицию выигрышного предмета
      const winnerIndex = displayItems.findIndex(item => item.id === selectedItem.id);
      if (winnerIndex !== -1) {
        setTimeout(() => {
          scrollToWinner(winnerIndex);
          setTimeout(() => {
            onSpinComplete(selectedItem);
          }, 3000);
        }, 500);
      }
    }
  }, [isSpinning, selectedItem, displayItems, onSpinComplete]);

  return (
    <div className="relative overflow-hidden bg-black/30 rounded-xl p-4 border border-white/20">
      {/* Указатель */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
      </div>
      
      {/* Рулетка */}
      <div className="overflow-hidden">
        <motion.div 
          ref={containerRef}
          className="flex"
          initial={{ x: 0 }}
          animate={isSpinning ? {
            x: [0, -200, -400, -600, -800]
          } : {}}
          transition={{
            duration: isSpinning ? 4 : 0,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {displayItems.map((item, index) => (
            <RouletteItem 
              key={item.id || index} 
              item={item}
              isSelected={selectedItem && item.id === selectedItem.id && !isSpinning}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Компонент кейса
const CaseCard = ({ caseData, onOpen, isDisabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className={`
        relative p-6 rounded-2xl border-2 border-white/20 backdrop-blur-lg
        bg-gradient-to-br from-white/10 to-white/5
        ${isHovered ? 'border-yellow-400/50 shadow-2xl shadow-yellow-400/20' : ''}
        transition-all duration-300
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}>
        {/* Блики и эффекты */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Иконка кейса */}
        <div className="text-center mb-4">
          <motion.div 
            className="text-6xl mx-auto mb-2 filter drop-shadow-lg"
            animate={isHovered ? { rotateY: [0, 180, 360] } : {}}
            transition={{ duration: 0.8 }}
          >
            📦
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-1">{caseData.title}</h3>
          <p className="text-sm text-white/70">{caseData.description}</p>
        </div>

        {/* Возможные предметы */}
        <div className="mb-4">
          <div className="text-xs text-white/60 mb-2">Возможные предметы:</div>
          <div className="flex justify-center space-x-1">
            {caseData.possibleItems.slice(0, 4).map((item, index) => {
              const rarityConfig = getRarityConfig(item.rarity);
              return (
                <div key={index} className={`w-8 h-8 rounded bg-gradient-to-br ${rarityConfig.color} flex items-center justify-center text-xs`}>
                  {item.icon}
                </div>
              );
            })}
            {caseData.possibleItems.length > 4 && (
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs text-white">
                +{caseData.possibleItems.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Цена и кнопка */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-bold text-yellow-400">
              {caseData.price.toLocaleString()}
            </span>
          </div>
          
          <motion.button
            className={`
              px-6 py-3 rounded-xl font-semibold text-black
              bg-gradient-to-r from-yellow-400 to-orange-500
              hover:from-yellow-500 hover:to-orange-600
              shadow-lg hover:shadow-xl transition-all duration-200
              ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onClick={() => !isDisabled && onOpen(caseData)}
          >
            Открыть
          </motion.button>
        </div>

        {/* Эффект частиц при наведении */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: Math.random() * 100 + '%',
                  opacity: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity 
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Модалка результата
const ResultModal = ({ isOpen, result, onClose, onPlayAgain }) => {
  const rarityConfig = getRarityConfig(result?.rarity);

  return (
    <AnimatePresence>
      {isOpen && result && (
        <motion.div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-white/20"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Поздравляем!</h2>
              <p className="text-white/70">Вы получили:</p>
            </div>

            {/* Предмет */}
            <motion.div 
              className={`
                relative p-6 rounded-xl mb-6 text-center
                bg-gradient-to-br ${rarityConfig.color}
                border-2 ${rarityConfig.borderColor}
                ${rarityConfig.glow}
              `}
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-4xl mb-2">{result.icon}</div>
              <div className="text-white font-bold text-lg mb-1">{result.name}</div>
              <div className="text-white/80 text-sm mb-2">{result.description}</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-black/30 text-white`}>
                {rarityConfig.text} {rarityConfig.emoji}
              </div>
            </motion.div>

            {/* Стоимость */}
            <div className="text-center mb-6">
              <div className="text-white/60 text-sm mb-1">Стоимость предмета:</div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🪙</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {result.value.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex space-x-3">
              <motion.button
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
              >
                Закрыть
              </motion.button>
              <motion.button
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-xl text-black font-medium transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPlayAgain}
              >
                Еще раз!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Cases = () => {
  const [balance, setBalance] = useState(5000); // Стартовый баланс
  const [isOpening, setIsOpening] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [inventory, setInventory] = useState([]);

  // Данные предметов
  const gameItems = [
    // Обычные предметы
    { id: 'coin_small', name: 'Монеты', description: '50 монет', icon: '🪙', rarity: 'common', value: 50 },
    { id: 'star_small', name: 'Звезды', description: '10 звезд', icon: '⭐', rarity: 'common', value: 100 },
    { id: 'gem_small', name: 'Кристалл', description: 'Маленький кристалл', icon: '💎', rarity: 'common', value: 75 },
    
    // Редкие предметы
    { id: 'coin_medium', name: 'Мешок монет', description: '200 монет', icon: '💰', rarity: 'rare', value: 200 },
    { id: 'star_medium', name: 'Звездный дождь', description: '50 звезд', icon: '🌟', rarity: 'rare', value: 500 },
    { id: 'key', name: 'Ключ', description: 'Открывает секреты', icon: '🗝️', rarity: 'rare', value: 300 },
    
    // Эпические предметы
    { id: 'treasure', name: 'Сокровище', description: 'Древний артефакт', icon: '🏺', rarity: 'epic', value: 800 },
    { id: 'crown', name: 'Корона', description: 'Королевская корона', icon: '👑', rarity: 'epic', value: 1000 },
    { id: 'ring', name: 'Волшебное кольцо', description: 'Кольцо силы', icon: '💍', rarity: 'epic', value: 1200 },
    
    // Легендарные предметы
    { id: 'dragon', name: 'Дракон', description: 'Легендарный дракон', icon: '🐉', rarity: 'legendary', value: 5000 },
    { id: 'unicorn', name: 'Единорог', description: 'Мифический единорог', icon: '🦄', rarity: 'legendary', value: 4000 },
    { id: 'phoenix', name: 'Феникс', description: 'Птица возрождения', icon: '🔥', rarity: 'legendary', value: 6000 }
  ];

  // Данные кейсов
  const cases = [
    {
      id: 'starter_case',
      title: 'Стартовый кейс',
      description: 'Идеальный выбор для начинающих',
      price: 100,
      possibleItems: gameItems.filter(item => ['common', 'rare'].includes(item.rarity))
    },
    {
      id: 'premium_case',
      title: 'Премиум кейс',
      description: 'Повышенные шансы на редкие предметы',
      price: 500,
      possibleItems: gameItems.filter(item => ['rare', 'epic'].includes(item.rarity))
    },
    {
      id: 'legendary_case',
      title: 'Легендарный кейс',
      description: 'Только самые ценные предметы',
      price: 1500,
      possibleItems: gameItems.filter(item => ['epic', 'legendary'].includes(item.rarity))
    },
    {
      id: 'mystery_case',
      title: 'Мистический кейс',
      description: 'Любой предмет может выпасть!',
      price: 750,
      possibleItems: gameItems
    }
  ];

  // Функция определения выигрыша
  const getRandomItem = (caseData) => {
    const items = caseData.possibleItems;
    const random = Math.random() * 100;
    
    let cumulativeChance = 0;
    for (const item of items) {
      const rarityConfig = getRarityConfig(item.rarity);
      cumulativeChance += rarityConfig.dropChance;
      
      if (random <= cumulativeChance) {
        return item;
      }
    }
    
    // Если ничего не выпало, возвращаем случайный предмет
    return items[Math.floor(Math.random() * items.length)];
  };

  // Открытие кейса
  const handleOpenCase = (caseData) => {
    if (balance < caseData.price || isOpening) return;
    
    setBalance(prev => prev - caseData.price);
    setSelectedCase(caseData);
    setIsOpening(true);
    setIsSpinning(true);
    
    // Выбираем выигрышный предмет
    const wonItem = getRandomItem(caseData);
    setSelectedItem(wonItem);
  };

  // Завершение анимации
  const handleSpinComplete = (item) => {
    setIsSpinning(false);
    setTimeout(() => {
      setIsOpening(false);
      setShowResult(true);
      setInventory(prev => [...prev, item]);
      setBalance(prev => prev + Math.floor(item.value * 0.1)); // Возвращаем 10% стоимости
    }, 1000);
  };

  // Закрытие результата
  const handleCloseResult = () => {
    setShowResult(false);
    setSelectedCase(null);
    setSelectedItem(null);
  };

  // Играть еще раз
  const handlePlayAgain = () => {
    setShowResult(false);
    setSelectedCase(null);
    setSelectedItem(null);
    // Можно добавить логику для автоматического открытия того же кейса
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      {/* Заголовок и баланс */}
      <div className="text-center mb-8">
        <motion.h1 
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎰 Магазин кейсов
        </motion.h1>
        
        <motion.div 
          className="inline-flex items-center space-x-3 bg-black/30 rounded-2xl px-6 py-3 border border-yellow-400/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-3xl">🪙</span>
          <span className="text-2xl font-bold text-yellow-400">
            {balance.toLocaleString()}
          </span>
        </motion.div>
      </div>

      {/* Рулетка (показывается при открытии кейса) */}
      {isOpening && selectedCase && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Открываем {selectedCase.title}...
          </h2>
          <CaseRoulette 
            items={selectedCase.possibleItems}
            isSpinning={isSpinning}
            selectedItem={selectedItem}
            onSpinComplete={handleSpinComplete}
          />
        </motion.div>
      )}

      {/* Сетка кейсов */}
      {!isOpening && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {cases.map((caseData, index) => (
            <motion.div
              key={caseData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <CaseCard 
                caseData={caseData}
                onOpen={handleOpenCase}
                isDisabled={balance < caseData.price}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Инвентарь */}
      {inventory.length > 0 && !isOpening && (
        <motion.div 
          className="mt-12 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            🎒 Ваш инвентарь ({inventory.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {inventory.slice(-12).map((item, index) => {
              const rarityConfig = getRarityConfig(item.rarity);
              return (
                <motion.div
                  key={index}
                  className={`
                    p-3 rounded-lg text-center
                    bg-gradient-to-br ${rarityConfig.color}
                    border ${rarityConfig.borderColor}
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-white text-xs font-medium">{item.name}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Модалка результата */}
      <ResultModal 
        isOpen={showResult}
        result={selectedItem}
        onClose={handleCloseResult}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};

export default Cases;
