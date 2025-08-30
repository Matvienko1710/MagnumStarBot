// Временное хранилище майнеров пользователей (в реальном проекте заменить на БД)
const userMiners = new Map();

// Глобальное хранилище количества майнеров на сервере
const serverMinerCounts = {
  NOVICE: 100,  // Новичок
  STAR_PATH: 100  // Путь к звездам
};

// Типы майнеров
const MINER_TYPES = {
  NOVICE: {
    id: 'novice',
    name: 'Новичок',
    price: 100,
    priceType: 'coins', // тип валюты для покупки
    rewardPerMinute: 0.25,
    rewardType: 'coins', // тип валюты для добычи
    maxReward: 1000, // максимальная добыча
    rarity: 'common', // редкость: common, rare, epic, legendary
    description: 'Первый шаг в мире майнинга Magnum Coins',
    serverLimit: 100 // лимит на сервере
  },
  STAR_PATH: {
    id: 'star_path',
    name: 'Путь к звездам',
    price: 100,
    priceType: 'stars', // тип валюты для покупки
    rewardPerMinute: 0.01,
    rewardType: 'stars', // тип валюты для добычи
    maxReward: 100, // максимальная добыча
    rarity: 'rare', // редкость: common, rare, epic, legendary
    description: 'Дорога к звездам начинается здесь',
    serverLimit: 100 // лимит на сервере
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
  const minutesDiff = timeDiff / (1000 * 60); // минуты
  
  let totalRewardStars = 0;
  let totalRewardCoins = 0;
  
  userData.miners.forEach(miner => {
    const minerType = MINER_TYPES[miner.type];
    const reward = Math.min(
      minerType.rewardPerMinute * minutesDiff,
      minerType.maxReward - miner.totalEarned
    );
    
    if (minerType.rewardType === 'stars') {
      totalRewardStars += reward;
    } else if (minerType.rewardType === 'coins') {
      totalRewardCoins += reward;
    }
  });
  
  return {
    stars: Math.floor(totalRewardStars * 100) / 100, // округляем до 2 знаков
    coins: Math.floor(totalRewardCoins * 100) / 100
  };
};

// Купить майнер
const buyMiner = (userId, minerType) => {
  const { getUserBalance, updateBalance } = require('./currency');
  
  if (!MINER_TYPES[minerType]) {
    throw new Error('Неверный тип майнера');
  }
  
  const minerInfo = MINER_TYPES[minerType];
  const userBalance = getUserBalance(userId);
  
  // Проверяем лимит на сервере
  if (serverMinerCounts[minerType] <= 0) {
    throw new Error(`Майнер "${minerInfo.name}" больше недоступен на сервере!`);
  }
  
  // Проверяем баланс в зависимости от типа валюты
  if (minerInfo.priceType === 'stars' && userBalance.stars < minerInfo.price) {
    throw new Error(`Недостаточно Stars! Нужно: ${minerInfo.price}, у вас: ${userBalance.stars}`);
  } else if (minerInfo.priceType === 'coins' && userBalance.coins < minerInfo.price) {
    throw new Error(`Недостаточно Magnum Coins! Нужно: ${minerInfo.price}, у вас: ${userBalance.coins}`);
  }
  
  // Списываем валюту
  if (minerInfo.priceType === 'stars') {
    updateBalance(userId, { stars: -minerInfo.price });
  } else if (minerInfo.priceType === 'coins') {
    updateBalance(userId, { coins: -minerInfo.price });
  }
  
  // Уменьшаем количество доступных майнеров на сервере
  serverMinerCounts[minerType]--;
  
  // Добавляем майнер пользователю
  const userData = initializeUserMiners(userId);
  const newMiner = {
    id: `${minerType}_${Date.now()}`,
    type: minerType,
    name: minerInfo.name,
    rarity: minerInfo.rarity,
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
    priceType: minerInfo.priceType,
    newBalance: getUserBalance(userId)
  };
};

// Забрать награды
const collectRewards = (userId) => {
  const { updateBalance } = require('./currency');
  const userData = initializeUserMiners(userId);
  
  const availableRewards = getAvailableRewards(userId);
  
  if (availableRewards.stars <= 0 && availableRewards.coins <= 0) {
    throw new Error('Нет доступных наград для сбора');
  }
  
  // Обновляем время последнего сбора
  userData.lastCollection = Date.now();
  
  // Обновляем баланс пользователя
  if (availableRewards.stars > 0) {
    updateBalance(userId, { stars: availableRewards.stars });
  }
  if (availableRewards.coins > 0) {
    updateBalance(userId, { coins: availableRewards.coins });
  }
  
  // Обновляем статистику майнеров
  const now = Date.now();
  const timeDiff = now - userData.lastCollection;
  const minutesDiff = timeDiff / (1000 * 60);
  
  userData.miners.forEach(miner => {
    const minerType = MINER_TYPES[miner.type];
    const reward = Math.min(
      minerType.rewardPerMinute * minutesDiff,
      minerType.maxReward - miner.totalEarned
    );
    miner.totalEarned += reward;
  });
  
  // Обновляем общую статистику
  userData.totalEarned.stars += availableRewards.stars;
  userData.totalEarned.coins += availableRewards.coins;
  
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
        rewardPerMinute: minerType.rewardPerMinute,
        rewardType: minerType.rewardType,
        maxReward: minerType.maxReward,
        remainingReward: minerType.maxReward - miner.totalEarned
      };
    })
  };
  
  return stats;
};

// Получить информацию о типах майнеров
const getMinerTypes = () => {
  return Object.values(MINER_TYPES).map(type => ({
    ...type,
    availableOnServer: serverMinerCounts[type.id.toUpperCase()]
  }));
};

// Получить конкретный тип майнера
const getMinerType = (type) => {
  const minerType = MINER_TYPES[type];
  if (minerType) {
    return {
      ...minerType,
      availableOnServer: serverMinerCounts[type.toUpperCase()]
    };
  }
  return null;
};

// Получить количество доступных майнеров на сервере
const getServerMinerCounts = () => {
  return { ...serverMinerCounts };
};

// Получить информацию о редкости майнера
const getRarityInfo = (rarity) => {
  const rarityInfo = {
    common: { name: 'Обычный', color: '⚪', bonus: 1.0 },
    rare: { name: 'Редкий', color: '🔵', bonus: 1.2 },
    epic: { name: 'Эпический', color: '🟣', bonus: 1.5 },
    legendary: { name: 'Легендарный', color: '🟡', bonus: 2.0 }
  };
  return rarityInfo[rarity] || rarityInfo.common;
};

module.exports = {
  getUserMiners,
  getAvailableRewards,
  buyMiner,
  collectRewards,
  getMinersStats,
  getMinerTypes,
  getMinerType,
  getServerMinerCounts,
  getRarityInfo,
  MINER_TYPES
};
