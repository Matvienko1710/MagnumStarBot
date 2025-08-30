// Временное хранилище майнеров пользователей (в реальном проекте заменить на БД)
const userMiners = new Map();

// Типы майнеров
const MINER_TYPES = {
  BASIC: {
    id: 'basic',
    name: 'Базовый майнер',
    price: 100,
    rewardPerHour: 1,
    maxReward: 24,
    description: 'Простой майнер для начинающих'
  },
  ADVANCED: {
    id: 'advanced',
    name: 'Продвинутый майнер',
    price: 500,
    rewardPerHour: 5,
    maxReward: 120,
    description: 'Мощный майнер для опытных пользователей'
  },
  PRO: {
    id: 'pro',
    name: 'Профессиональный майнер',
    price: 1000,
    rewardPerHour: 12,
    maxReward: 288,
    description: 'Профессиональный майнер с максимальной эффективностью'
  }
};

// Инициализация майнеров пользователя
const initializeUserMiners = (userId) => {
  if (!userMiners.has(userId)) {
    userMiners.set(userId, {
      miners: [],
      lastCollection: Date.now(),
      totalEarned: { stars: 0, coins: 0 }
    });
  }
  return userMiners.get(userId);
};

// Получить майнеры пользователя
const getUserMiners = (userId) => {
  const userData = initializeUserMiners(userId);
  return userData.miners;
};

// Получить доступные награды
const getAvailableRewards = (userId) => {
  const userData = initializeUserMiners(userId);
  const now = Date.now();
  const timeDiff = now - userData.lastCollection;
  const hoursDiff = timeDiff / (1000 * 60 * 60); // часы
  
  let totalReward = 0;
  
  userData.miners.forEach(miner => {
    const minerType = MINER_TYPES[miner.type];
    const reward = Math.min(
      minerType.rewardPerHour * hoursDiff,
      minerType.maxReward - miner.totalEarned
    );
    totalReward += reward;
  });
  
  return Math.floor(totalReward);
};

// Купить майнер
const buyMiner = (userId, minerType) => {
  const { getUserBalance, updateBalance } = require('./currency');
  
  if (!MINER_TYPES[minerType]) {
    throw new Error('Неверный тип майнера');
  }
  
  const minerInfo = MINER_TYPES[minerType];
  const userBalance = getUserBalance(userId);
  
  if (userBalance.stars < minerInfo.price) {
    throw new Error(`Недостаточно Stars! Нужно: ${minerInfo.price}, у вас: ${userBalance.stars}`);
  }
  
  // Списываем Stars
  updateBalance(userId, { stars: -minerInfo.price });
  
  // Добавляем майнер пользователю
  const userData = initializeUserMiners(userId);
  const newMiner = {
    id: `${minerType}_${Date.now()}`,
    type: minerType,
    name: minerInfo.name,
    purchaseDate: Date.now(),
    totalEarned: 0,
    isActive: true
  };
  
  userData.miners.push(newMiner);
  
  // Проверяем реферальную систему
  try {
    const { getReferralActivityReward } = require('./referral');
    const referralData = require('./referral').getUserReferralData(userId);
    
    if (referralData.referrerId) {
      // Даем награду рефереру за покупку майнера
      const reward = getReferralActivityReward(referralData.referrerId, userId, 'miner_purchase');
      if (reward) {
        console.log(`Реферальная награда: ${referralData.referrerId} получил ${reward.stars} ⭐ ${reward.coins} 🪙 за покупку майнера ${userId}`);
      }
    }
  } catch (error) {
    console.log('Ошибка при начислении реферальной награды:', error.message);
  }
  
  return {
    miner: newMiner,
    price: minerInfo.price,
    newBalance: getUserBalance(userId)
  };
};

// Забрать награды
const collectRewards = (userId) => {
  const { updateBalance } = require('./currency');
  const userData = initializeUserMiners(userId);
  
  const availableRewards = getAvailableRewards(userId);
  
  if (availableRewards <= 0) {
    throw new Error('Нет доступных наград для сбора');
  }
  
  // Обновляем время последнего сбора
  userData.lastCollection = Date.now();
  
  // Обновляем баланс пользователя
  updateBalance(userId, { stars: availableRewards });
  
  // Обновляем статистику майнеров
  const now = Date.now();
  const timeDiff = now - userData.lastCollection;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  userData.miners.forEach(miner => {
    const minerType = MINER_TYPES[miner.type];
    const reward = Math.min(
      minerType.rewardPerHour * hoursDiff,
      minerType.maxReward - miner.totalEarned
    );
    miner.totalEarned += reward;
  });
  
  // Обновляем общую статистику
  userData.totalEarned.stars += availableRewards;
  
  // Проверяем реферальную систему
  try {
    const { getReferralActivityReward } = require('./referral');
    const referralData = require('./referral').getUserReferralData(userId);
    
    if (referralData.referrerId) {
      // Даем награду рефереру за сбор наград
      const reward = getReferralActivityReward(referralData.referrerId, userId, 'miner_collection');
      if (reward) {
        console.log(`Реферальная награда: ${referralData.referrerId} получил ${reward.stars} ⭐ ${reward.coins} 🪙 за сбор наград ${userId}`);
      }
    }
  } catch (error) {
    console.log('Ошибка при начислении реферальной награды:', error.message);
  }
  
  return {
    collected: availableRewards,
    newBalance: require('./currency').getUserBalance(userId)
  };
};

// Получить статистику майнеров
const getMinersStats = (userId) => {
  const userData = initializeUserMiners(userId);
  const availableRewards = getAvailableRewards(userId);
  
  const stats = {
    totalMiners: userData.miners.length,
    activeMiners: userData.miners.filter(m => m.isActive).length,
    totalEarned: userData.totalEarned,
    availableRewards,
    lastCollection: userData.lastCollection,
    miners: userData.miners.map(miner => {
      const minerType = MINER_TYPES[miner.type];
      return {
        ...miner,
        rewardPerHour: minerType.rewardPerHour,
        maxReward: minerType.maxReward,
        remainingReward: minerType.maxReward - miner.totalEarned
      };
    })
  };
  
  return stats;
};

// Получить информацию о типах майнеров
const getMinerTypes = () => {
  return Object.values(MINER_TYPES);
};

// Получить конкретный тип майнера
const getMinerType = (type) => {
  return MINER_TYPES[type];
};

module.exports = {
  getUserMiners,
  getAvailableRewards,
  buyMiner,
  collectRewards,
  getMinersStats,
  getMinerTypes,
  getMinerType,
  MINER_TYPES
};
