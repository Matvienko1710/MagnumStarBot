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
const RouletteItem = ({ item, isSelected = false, isSpinning = false }) => {
  const rarityConfig = getRarityConfig(item.rarity);
  
  return (
    <motion.div 
      className={`
        relative min-w-[120px] h-[140px] mx-2 rounded-xl p-3 
        bg-gradient-to-br ${rarityConfig.color} 
        border-2 ${rarityConfig.borderColor}
        flex flex-col items-center justify-center text-center
        ${isSelected ? `ring-4 ring-white/50 scale-110 ${rarityConfig.glow}` : 'shadow-lg'}
        ${isSpinning ? 'transform-gpu' : ''}
      `}
      animate={isSelected ? { 
        scale: [1, 1.15, 1.1], 
        boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 30px rgba(255,255,255,0.5)', '0 0 0 rgba(255,255,255,0)'],
        rotateY: [0, 5, -5, 0]
      } : isSpinning ? {
        scale: [1, 0.95, 1],
        brightness: [1, 1.1, 1]
      } : {}}
      transition={{ 
        duration: isSelected ? 0.8 : 0.3,
        repeat: isSpinning ? Infinity : 0,
        ease: isSelected ? "easeInOut" : "linear"
      }}
    >
      <motion.div 
        className="text-3xl mb-2"
        animate={isSelected ? { 
          scale: [1, 1.2, 1],
          rotateZ: [0, 10, -10, 0]
        } : {}}
        transition={{ duration: 0.6, repeat: isSelected ? 3 : 0 }}
      >
        {item.icon}
      </motion.div>
      <div className="text-white font-bold text-sm mb-1">{item.name}</div>
      <div className="text-white/80 text-xs">{item.description}</div>
      <div className="absolute top-1 right-1 text-xs">{rarityConfig.emoji}</div>
      
      {/* Эффект сияния для выбранного предмета */}
      {isSelected && (
        <motion.div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(45deg, transparent, ${rarityConfig.color.replace('from-', '').replace('to-', '').split(' ')[0]}/20, transparent)`
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.div>
  );
};

// Компонент рулетки
const CaseRoulette = ({ items, isSpinning, onSpinComplete, selectedItem }) => {
  const containerRef = useRef(null);
  const [displayItems, setDisplayItems] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    // Создаем массив предметов для рулетки (больше элементов для лучшего эффекта)
    const extendedItems = [];
    for (let i = 0; i < 50; i++) {
      extendedItems.push(...items.map((item, index) => ({ ...item, id: `${item.id}-${i}-${index}` })));
    }
    setDisplayItems(extendedItems);
  }, [items]);

  useEffect(() => {
    if (isSpinning && selectedItem && containerRef.current) {
      // Параметры анимации
      const itemWidth = 144; // 120px + margins
      const containerWidth = containerRef.current.offsetWidth;
      
      // Находим позицию выигрышного предмета
      const winnerIndex = displayItems.length - Math.floor(Math.random() * 15) - 8;
      const finalPosition = (winnerIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
      
      // Сбрасываем позицию
      containerRef.current.style.transition = 'none';
      containerRef.current.style.transform = 'translateX(0px)';
      setCurrentPosition(0);
      
      // Многоэтапная анимация
      const animateRoulette = () => {
        let currentPos = 0;
        let animationId;
        
        // Звуковые эффекты (виртуальные)
        const playSpinSound = () => {
          // В реальном проекте здесь будет audio.play()
          console.log('🔊 Звук вращения рулетки');
        };
        
        const playSlowSound = () => {
          console.log('🔊 Звук замедления');
        };
        
        const playStopSound = () => {
          console.log('🔊 Звук остановки');
        };

        // Этап 1: Медленный старт (0.8 секунды)
        const startAnimation = () => {
          playSpinSound();
          const startTime = Date.now();
          const startDuration = 800;
          const startDistance = finalPosition * 0.15;
          
          const animate1 = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / startDuration, 1);
            
            // Плавное ускорение
            const easeProgress = progress * progress;
            currentPos = startDistance * easeProgress;
            
            containerRef.current.style.transform = `translateX(-${currentPos}px)`;
            setCurrentPosition(currentPos);
            
            if (progress < 1) {
              animationId = requestAnimationFrame(animate1);
            } else {
              mediumAnimation();
            }
          };
          animate1();
        };
        
        // Этап 2: Быстрое вращение (1.5 секунды)
        const mediumAnimation = () => {
          const mediumTime = Date.now();
          const mediumDuration = 1500;
          const mediumDistance = finalPosition * 0.7;
          
          const animate2 = () => {
            const elapsed = Date.now() - mediumTime;
            const progress = Math.min(elapsed / mediumDuration, 1);
            
            // Линейная скорость на пике
            const startPos = finalPosition * 0.15;
            currentPos = startPos + (mediumDistance * progress);
            
            containerRef.current.style.transform = `translateX(-${currentPos}px)`;
            setCurrentPosition(currentPos);
            
            if (progress < 1) {
              animationId = requestAnimationFrame(animate2);
            } else {
              endAnimation();
            }
          };
          animate2();
        };
        
        // Этап 3: Замедление до остановки (2.5 секунды)
        const endAnimation = () => {
          playSlowSound();
          const endTime = Date.now();
          const endDuration = 2500;
          const startPos = finalPosition * 0.85;
          const remainingDistance = finalPosition - startPos;
          
          const animate3 = () => {
            const elapsed = Date.now() - endTime;
            const progress = Math.min(elapsed / endDuration, 1);
            
            // Плавное замедление (обратная квадратичная функция)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            currentPos = startPos + (remainingDistance * easeProgress);
            
            // Добавляем небольшую вибрацию к концу анимации
            let vibration = 0;
            if (progress > 0.8) {
              const vibrateIntensity = (1 - progress) * 5; // Уменьшается к концу
              vibration = Math.sin(elapsed * 0.03) * vibrateIntensity;
            }
            
            containerRef.current.style.transform = `translateX(-${currentPos + vibration}px)`;
            setCurrentPosition(currentPos);
            
            if (progress < 1) {
              animationId = requestAnimationFrame(animate3);
            } else {
              // Анимация завершена
              playStopSound();
              setTimeout(() => {
                onSpinComplete(selectedItem);
              }, 500);
            }
          };
          animate3();
        };
        
        startAnimation();
        
        // Очистка анимации при размонтировании
        return () => {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
        };
      };
      
      // Начинаем анимацию через небольшую задержку
      const timeoutId = setTimeout(animateRoulette, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isSpinning, selectedItem, displayItems, onSpinComplete]);

  return (
    <div className="relative overflow-hidden bg-black/30 rounded-xl p-4 border border-white/20">
      {/* Указатель с эффектами */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div 
          className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg"
          animate={isSpinning ? { 
            scale: [1, 1.3, 1], 
            rotateZ: [0, 5, -5, 0],
            filter: ['drop-shadow(0 0 5px rgba(255,255,0,0.3))', 'drop-shadow(0 0 15px rgba(255,255,0,0.8))', 'drop-shadow(0 0 5px rgba(255,255,0,0.3))']
          } : {}}
          transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
        />
      </div>
      
      {/* Боковые градиенты для эффекта скорости */}
      {isSpinning && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/80 to-transparent z-5 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/80 to-transparent z-5 pointer-events-none" />
        </>
      )}
      
      {/* Эффект движения (полосы) */}
      {isSpinning && (
        <div className="absolute inset-0 z-5 pointer-events-none">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
      )}
      
      {/* Рулетка */}
      <div className="overflow-hidden rounded-lg relative">
        <div 
          ref={containerRef}
          className={`flex will-change-transform ${isSpinning ? 'blur-[1px]' : ''}`}
          style={{ 
            transition: 'none',
            filter: isSpinning ? 'blur(0.5px)' : 'none'
          }}
        >
          {displayItems.map((item, index) => (
            <RouletteItem 
              key={item.id || index} 
              item={item}
              isSelected={selectedItem && item.id === selectedItem.id && !isSpinning}
              isSpinning={isSpinning}
            />
          ))}
        </div>
      </div>
      
      {/* Центральная линия */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-400/50 transform -translate-x-0.5 z-5 pointer-events-none" />
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
              px-6 py-3 rounded-xl font-semibold
              shadow-lg transition-all duration-200
              ${isDisabled 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black hover:shadow-xl'
              }
            `}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onClick={() => !isDisabled && onOpen(caseData)}
          >
            {isDisabled ? 'Недостаточно монет' : 'Открыть'}
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
  const [recentWins, setRecentWins] = useState([]); // Последние выигрыши

  // Получение баланса и последних выигрышей из API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const webApp = window.Telegram?.WebApp;
        const userId = webApp?.initDataUnsafe?.user?.id;
        
        // Загружаем баланс
        if (userId) {
          try {
            const balanceResponse = await fetch(`/api/balance/${userId}`);
            if (balanceResponse.ok) {
              const data = await balanceResponse.json();
              if (data.success) {
                setBalance(data.coins || 0);
                setStarBalance(data.stars || 0);
                console.log('✅ Баланс загружен:', data);
              } else {
                console.warn('⚠️ API вернул ошибку:', data.error);
                setBalance(1000);
                setStarBalance(10);
              }
            } else {
              console.warn('⚠️ API баланса недоступен, используем дефолтные значения');
              setBalance(1000);
              setStarBalance(10);
            }
          } catch (balanceError) {
            console.warn('⚠️ Ошибка загрузки баланса:', balanceError);
            setBalance(1000);
            setStarBalance(10);
          }
        } else {
          console.warn('⚠️ UserId не найден, используем дефолтные значения');
          setBalance(1000);
          setStarBalance(10);
        }

        // Загружаем последние выигрыши из бота
        const winsResponse = await fetch('/api/recent-wins');
        if (winsResponse.ok) {
          const winsData = await winsResponse.json();
          setRecentWins(winsData.wins || []);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Устанавливаем дефолтные значения при ошибке
        setBalance(1000);
        setStarBalance(10);
        // Добавляем тестовые данные выигрышей
        setRecentWins([
          { id: 1, username: 'Player1', item: 'ДЖЕКПОТ Звезд!', amount: 50, type: 'stars', timestamp: Date.now() - 1000 },
          { id: 2, username: 'Player2', item: '25 Звезд', amount: 25, type: 'stars', timestamp: Date.now() - 5000 },
          { id: 3, username: 'Player3', item: '1000 Монет', amount: 1000, type: 'coins', timestamp: Date.now() - 10000 },
          { id: 4, username: 'Player4', item: '10 Звезд', amount: 10, type: 'stars', timestamp: Date.now() - 15000 },
          { id: 5, username: 'Player5', item: '500 Монет', amount: 500, type: 'coins', timestamp: Date.now() - 20000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
      // Сначала списываем монеты через API
      const deductResponse = await fetch(`/api/balance/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'coins',
          amount: -caseData.price, // Отрицательное значение для списания
          reason: 'case_purchase'
        })
      });

      if (!deductResponse.ok) {
        console.error('❌ Ошибка списания средств');
        alert('Ошибка при списании средств');
        return;
      }

      const deductData = await deductResponse.json();
      if (!deductData.success) {
        console.error('❌ Не удалось списать средства:', deductData.error);
        alert('Недостаточно средств');
        return;
      }

      // Обновляем локальный баланс
      setBalance(deductData.coins);
      setStarBalance(deductData.stars);
      
      console.log('💰 Средства списаны, новый баланс:', deductData);

      setSelectedCase(caseData);
      setIsOpening(true);
      setIsSpinning(true);
      
      // Выбираем выигрышный предмет
      const wonItem = getRandomItem(caseData);
      setSelectedItem(wonItem);
      
    } catch (error) {
      console.error('❌ Ошибка открытия кейса:', error);
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
            type: item.type, // 'stars' или 'coins'
            amount: item.amount,
            item: item.name,
            rarity: item.rarity
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Обновляем баланс из ответа сервера
            setBalance(data.coins || balance);
            setStarBalance(data.stars || starBalance);
            console.log('🎁 Награда получена, обновлен баланс:', data);
          } else {
            console.error('❌ Ошибка при получении награды:', data.error);
          }
        } else {
          console.error('❌ Ошибка API награды');
        }

        // Добавляем свой выигрыш в ленту активности
        const webApp = window.Telegram?.WebApp;
        const currentUser = webApp?.initDataUnsafe?.user;
        const newWin = {
          id: Date.now(),
          username: currentUser?.username || currentUser?.first_name || 'Игрок',
          item: item.name,
          amount: item.amount,
          type: item.type,
          timestamp: Date.now(),
          isOwn: true // Помечаем как собственный выигрыш
        };
        
        setRecentWins(prev => [newWin, ...prev.slice(0, 9)]); // Добавляем в начало, оставляем только 10 последних
        
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

  // Сбор всех предметов из инвентаря
  const handleCollectAll = async () => {
    if (inventory.length === 0) return;

    const webApp = window.Telegram?.WebApp;
    const userId = webApp?.initDataUnsafe?.user?.id;

    if (!userId) {
      console.error('❌ User ID не найден');
      return;
    }

    try {
      // Считаем общую сумму монет и звезд
      const totalCoins = inventory.filter(item => item.type === 'coins')
        .reduce((sum, item) => sum + item.amount, 0);
      const totalStars = inventory.filter(item => item.type === 'stars')
        .reduce((sum, item) => sum + item.amount, 0);

      console.log('💰 Собираем из инвентаря:', { totalCoins, totalStars, items: inventory.length });

      // Обновляем баланс монет
      if (totalCoins > 0) {
        const coinsResponse = await fetch(`/api/balance/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'coins',
            amount: totalCoins,
            reason: 'inventory_collect_all'
          })
        });

        if (coinsResponse.ok) {
          const coinsData = await coinsResponse.json();
          if (coinsData.success) {
            setBalance(coinsData.coins);
          }
        }
      }

      // Обновляем баланс звезд
      if (totalStars > 0) {
        const starsResponse = await fetch(`/api/balance/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'stars',
            amount: totalStars,
            reason: 'inventory_collect_all'
          })
        });

        if (starsResponse.ok) {
          const starsData = await starsResponse.json();
          if (starsData.success) {
            setStarBalance(starsData.stars);
          }
        }
      }

      // Очищаем инвентарь с анимацией
      setInventory([]);
      
      console.log('✅ Всё собрано! Монет:', totalCoins, 'Звезд:', totalStars);

      // Показываем уведомление о сборе
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(
          `Собрано: ${totalCoins > 0 ? `${totalCoins} монет` : ''}${totalCoins > 0 && totalStars > 0 ? ', ' : ''}${totalStars > 0 ? `${totalStars} звезд` : ''}!`
        );
      }

    } catch (error) {
      console.error('❌ Ошибка сбора предметов:', error);
    }
  };

  // Сбор отдельного предмета
  const handleCollectSingle = async (itemIndex) => {
    const actualIndex = inventory.length > 12 ? inventory.length - 12 + itemIndex : itemIndex;
    
    if (actualIndex >= inventory.length) return;

    const item = inventory[actualIndex];
    const webApp = window.Telegram?.WebApp;
    const userId = webApp?.initDataUnsafe?.user?.id;

    if (!userId) {
      console.error('❌ User ID не найден');
      return;
    }

    try {
      console.log('💰 Собираем предмет:', item);

      // Обновляем баланс через API
      const response = await fetch(`/api/balance/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          amount: item.amount,
          reason: `inventory_collect_${item.name}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обновляем баланс
          if (item.type === 'coins') {
            setBalance(data.coins);
          } else {
            setStarBalance(data.stars);
          }

          // Удаляем предмет из инвентаря
          setInventory(prev => prev.filter((_, index) => index !== actualIndex));
          
          console.log('✅ Предмет собран:', item.name, '+' + item.amount, item.type);
        }
      }

    } catch (error) {
      console.error('❌ Ошибка сбора предмета:', error);
    }
  };

  // Компонент ленты последних выигрышей
  const RecentWinsMarquee = () => {
    if (recentWins.length === 0) return null;

    const formatTimeAgo = (timestamp) => {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'только что';
      if (minutes < 60) return `${minutes}м назад`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}ч назад`;
      return 'давно';
    };

  return (
      <div className="mb-6 overflow-hidden bg-black/20 rounded-xl border border-white/10">
        <div className="px-4 py-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center">
            🔥 Последние выигрыши
            <motion.div
              className="ml-2 w-2 h-2 bg-green-400 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </h3>
        </div>
        
        <div className="relative h-16 overflow-hidden">
          <motion.div
            className="flex absolute items-center h-full"
            animate={{ x: [0, -100 * recentWins.length] }}
            transition={{
              duration: recentWins.length * 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* Дублируем элементы для бесконечного скролла */}
            {[...recentWins, ...recentWins].map((win, index) => (
              <motion.div
                key={`${win.id}-${index}`}
                className={`
                  flex items-center space-x-3 px-4 py-2 mx-2 rounded-lg min-w-[280px]
                  ${win.isOwn 
                    ? 'bg-yellow-500/20 border border-yellow-400/30' 
                    : 'bg-white/5 border border-white/10'
                  }
                `}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Иконка */}
                <div className="text-xl">
                  {win.type === 'stars' ? '⭐' : '🪙'}
                </div>
                
                {/* Информация */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold text-sm truncate ${win.isOwn ? 'text-yellow-300' : 'text-white'}`}>
                      {win.isOwn ? 'Вы' : win.username}
                    </span>
                    <span className="text-white/60 text-xs">
                      {formatTimeAgo(win.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-white/80">выиграл</span>
                    <span className={`font-bold text-xs ${
                      win.type === 'stars' ? 'text-blue-400' : 'text-yellow-400'
                    }`}>
                      {win.amount} {win.type === 'stars' ? 'звезд' : 'монет'}
                    </span>
                  </div>
                </div>

                {/* Редкость */}
                {(win.amount >= 1000 || (win.type === 'stars' && win.amount >= 25)) && (
                  <motion.div
                    className="text-xs px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {win.amount >= 2000 || (win.type === 'stars' && win.amount >= 50) ? '🏆' : '💎'}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
      </div>
      </div>
    );
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

      {/* Лента последних выигрышей */}
      <RecentWinsMarquee />

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
            
            {/* Уведомление о недостатке средств */}
            {balance !== null && balance < cases[0].price && (
              <motion.div
                className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-red-300 text-sm">
                  💸 Недостаточно монет для открытия кейса
                </div>
                <div className="text-white/60 text-xs mt-1">
                  Нужно: {cases[0].price} монет, у вас: {balance} монет
                </div>
                <div className="text-white/60 text-xs mt-1">
                  💡 Заработайте монеты на главной странице!
                </div>
                <motion.button
                  className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setBalance(prev => prev + 500);
                    console.log('🎁 Добавлено 500 монет для тестирования');
                  }}
                >
                  🎁 Получить 500 монет (тест)
                </motion.button>
              </motion.div>
            )}
            
            {/* Отладочная информация */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-black/50 rounded-lg text-xs text-white">
                <div>🔍 Отладка кейса:</div>
                <div>Баланс: {balance}</div>
                <div>Цена кейса: {cases[0].price}</div>
                <div>Заблокирован: {balance === null || balance < cases[0].price ? 'ДА' : 'НЕТ'}</div>
                <div>Баланс загружен: {balance !== null ? 'ДА' : 'НЕТ'}</div>
                <div>User ID: {window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'не найден'}</div>
              </div>
            )}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              🎒 Ваш инвентарь ({inventory.length})
            </h2>
            
            {/* Кнопка "Забрать всё" */}
            <motion.button
              className="relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 overflow-hidden"
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCollectAll}
            >
              {/* Фоновый эффект */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              <motion.span
                animate={{ rotateZ: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                💰
              </motion.span>
              <span>Забрать всё</span>
              
              {/* Показываем отдельно монеты и звезды */}
              <div className="flex items-center space-x-1">
                {inventory.filter(item => item.type === 'coins').length > 0 && (
                  <motion.span
                    className="text-xs bg-yellow-500/30 px-2 py-1 rounded-full flex items-center space-x-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <span>🪙</span>
                    <span>{inventory.filter(item => item.type === 'coins').reduce((sum, item) => sum + item.amount, 0)}</span>
                  </motion.span>
                )}
                {inventory.filter(item => item.type === 'stars').length > 0 && (
                  <motion.span
                    className="text-xs bg-blue-500/30 px-2 py-1 rounded-full flex items-center space-x-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <span>⭐</span>
                    <span>{inventory.filter(item => item.type === 'stars').reduce((sum, item) => sum + item.amount, 0)}</span>
                  </motion.span>
                )}
              </div>
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {inventory.slice(-12).map((item, index) => {
              const rarityConfig = getRarityConfig(item.rarity);
              return (
                <motion.div
                  key={index}
                  className={`
                    relative p-3 rounded-lg text-center
                    bg-gradient-to-br ${rarityConfig.color}
                    border ${rarityConfig.borderColor}
                    group hover:scale-105 transition-transform cursor-pointer
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleCollectSingle(index)}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-white text-xs font-medium mb-1">{item.name}</div>
                  <div className={`text-xs font-bold ${
                    item.type === 'stars' ? 'text-blue-200' : 'text-yellow-200'
                  }`}>
                    +{item.amount}
                  </div>
                  
                  {/* Эффект при наведении */}
                  <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {/* Кнопка сбора отдельного предмета */}
                  <motion.div 
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.2 }}
                  >
                    ✓
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          
          {inventory.length > 12 && (
            <div className="text-center mt-4">
              <div className="text-white/60 text-sm">
                ... и ещё {inventory.length - 12} предметов
              </div>
            </div>
          )}
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
