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
    for (let i = 0; i < 30; i++) {
      extendedItems.push(...items.map((item, index) => ({ ...item, id: `${item.id}-${i}-${index}` })));
    }
    setDisplayItems(extendedItems);
  }, [items]);

  useEffect(() => {
    if (isSpinning && selectedItem) {
      // Находим позицию выигрышного предмета (ближе к концу)
      const winnerIndex = displayItems.length - Math.floor(Math.random() * 20) - 10;
      
      if (containerRef.current) {
        const itemWidth = 144; // 120px + margins
        const containerWidth = containerRef.current.offsetWidth;
        const targetPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
        
        // Применяем плавную анимацию
        containerRef.current.style.transition = 'transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        containerRef.current.style.transform = `translateX(-${targetPosition}px)`;
        
        setTimeout(() => {
          onSpinComplete(selectedItem);
        }, 3500);
      }
    }
  }, [isSpinning, selectedItem, displayItems, onSpinComplete]);

  return (
    <div className="relative overflow-hidden bg-black/30 rounded-xl p-4 border border-white/20">
      {/* Указатель */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div 
          className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-yellow-400"
          animate={isSpinning ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>
      
      {/* Рулетка */}
      <div className="overflow-hidden rounded-lg">
        <div 
          ref={containerRef}
          className="flex will-change-transform"
          style={{ transition: 'none' }}
        >
          {displayItems.map((item, index) => (
            <RouletteItem 
              key={item.id || index} 
              item={item}
              isSelected={selectedItem && item.id === selectedItem.id && !isSpinning}
            />
          ))}
        </div>
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

            {/* Награда */}
            <div className="text-center mb-6">
              <div className="text-white/60 text-sm mb-1">Вы получили:</div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">{result.type === 'stars' ? '⭐' : '🪙'}</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {result.amount} {result.type === 'stars' ? 'звезд' : 'монет'}
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
  const [balance, setBalance] = useState(null); // Баланс из API
  const [starBalance, setStarBalance] = useState(null); // Баланс звезд
  const [isOpening, setIsOpening] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Получение баланса из API
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const webApp = window.Telegram?.WebApp;
        const userId = webApp?.initDataUnsafe?.user?.id;
        
        if (userId) {
          const response = await fetch(`/api/balance/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setBalance(data.coins || 0);
            setStarBalance(data.stars || 0);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
        // Устанавливаем дефолтные значения при ошибке
        setBalance(1000);
        setStarBalance(10);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, []);

  // Данные предметов для Кейса Новичка
  const gameItems = [
    // Обычные предметы - звезды
    { id: 'stars_1', name: '1 Звезда', description: '⭐ x1', icon: '⭐', rarity: 'common', value: 100, type: 'stars', amount: 1 },
    { id: 'stars_2', name: '2 Звезды', description: '⭐ x2', icon: '⭐', rarity: 'common', value: 200, type: 'stars', amount: 2 },
    { id: 'stars_3', name: '3 Звезды', description: '⭐ x3', icon: '⭐', rarity: 'common', value: 300, type: 'stars', amount: 3 },
    
    // Редкие предметы - больше звезд
    { id: 'stars_5', name: '5 Звезд', description: '⭐ x5', icon: '🌟', rarity: 'rare', value: 500, type: 'stars', amount: 5 },
    { id: 'stars_10', name: '10 Звезд', description: '⭐ x10', icon: '🌟', rarity: 'rare', value: 1000, type: 'stars', amount: 10 },
    
    // Обычные предметы - монеты
    { id: 'coins_50', name: '50 Монет', description: '🪙 x50', icon: '🪙', rarity: 'common', value: 50, type: 'coins', amount: 50 },
    { id: 'coins_100', name: '100 Монет', description: '🪙 x100', icon: '🪙', rarity: 'common', value: 100, type: 'coins', amount: 100 },
    
    // Редкие предметы - больше монет
    { id: 'coins_250', name: '250 Монет', description: '🪙 x250', icon: '💰', rarity: 'rare', value: 250, type: 'coins', amount: 250 },
    { id: 'coins_500', name: '500 Монет', description: '🪙 x500', icon: '💰', rarity: 'rare', value: 500, type: 'coins', amount: 500 },
    
    // Эпические предметы
    { id: 'stars_25', name: '25 Звезд', description: '⭐ x25', icon: '✨', rarity: 'epic', value: 2500, type: 'stars', amount: 25 },
    { id: 'coins_1000', name: '1000 Монет', description: '🪙 x1000', icon: '💎', rarity: 'epic', value: 1000, type: 'coins', amount: 1000 },
    
    // Легендарные предметы
    { id: 'jackpot_stars', name: 'ДЖЕКПОТ Звезд!', description: '⭐ x50', icon: '🎯', rarity: 'legendary', value: 5000, type: 'stars', amount: 50 },
    { id: 'jackpot_coins', name: 'ДЖЕКПОТ Монет!', description: '🪙 x2500', icon: '🏆', rarity: 'legendary', value: 2500, type: 'coins', amount: 2500 }
  ];

  // Данные кейсов - только один Кейс Новичка
  const cases = [
    {
      id: 'newbie_case',
      title: 'Кейс Новичка',
      description: 'Получи звезды и магнум коины для старта!',
      price: 100,
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
  const handleOpenCase = async (caseData) => {
    if (balance < caseData.price || isOpening) return;
    
    const webApp = window.Telegram?.WebApp;
    const userId = webApp?.initDataUnsafe?.user?.id;
    
    if (!userId) {
      alert('Ошибка: не удалось получить данные пользователя');
      return;
    }

    try {
      // Списываем монеты за открытие кейса
      setBalance(prev => prev - caseData.price);
      setSelectedCase(caseData);
      setIsOpening(true);
      setIsSpinning(true);
      
      // Выбираем выигрышный предмет
      const wonItem = getRandomItem(caseData);
      setSelectedItem(wonItem);
      
    } catch (error) {
      console.error('Ошибка открытия кейса:', error);
      setIsOpening(false);
      setIsSpinning(false);
      alert('Ошибка при открытии кейса');
    }
  };

  // Завершение анимации
  const handleSpinComplete = async (item) => {
    setIsSpinning(false);
    
    const webApp = window.Telegram?.WebApp;
    const userId = webApp?.initDataUnsafe?.user?.id;
    
    setTimeout(async () => {
      try {
        // Отправляем награду на сервер
        const response = await fetch(`/api/reward/${userId}/case-reward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemType: item.type, // 'stars' или 'coins'
            amount: item.amount,
            itemName: item.name
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Обновляем баланс из ответа сервера
          setBalance(data.coins || balance);
          setStarBalance(data.stars || starBalance);
        }
        
        setIsOpening(false);
        setShowResult(true);
        setInventory(prev => [...prev, item]);
        
      } catch (error) {
        console.error('Ошибка при получении награды:', error);
        // Все равно показываем результат, но не обновляем баланс
        setIsOpening(false);
        setShowResult(true);
        setInventory(prev => [...prev, item]);
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎰</div>
          <div className="text-white text-xl">Загрузка кейсов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      {/* Заголовок и баланс */}
      <div className="text-center mb-8">
        <motion.h1 
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎰 Кейс Новичка
        </motion.h1>
        
        {/* Баланс */}
        <div className="flex justify-center space-x-4 mb-4">
          <motion.div 
            className="flex items-center space-x-2 bg-black/30 rounded-2xl px-4 py-2 border border-yellow-400/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-2xl">🪙</span>
            <span className="text-lg font-bold text-yellow-400">
              {balance !== null ? balance.toLocaleString() : '---'}
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2 bg-black/30 rounded-2xl px-4 py-2 border border-blue-400/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-bold text-blue-400">
              {starBalance !== null ? starBalance.toFixed(1) : '---'}
            </span>
          </motion.div>
        </div>
        
        <p className="text-center text-blue-300 mb-2">Открывай кейсы и получай звезды и магнум коины!</p>
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

      {/* Кейс Новичка */}
      {!isOpening && (
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CaseCard 
              caseData={cases[0]}
              onOpen={handleOpenCase}
              isDisabled={balance === null || balance < cases[0].price}
            />
          </motion.div>
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
