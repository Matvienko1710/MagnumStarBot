const { getUserBalance, addStars, addCoins } = require('./currency');

// Временное хранилище реферальных данных (в реальном проекте заменить на БД)
const referrals = new Map(); // userId -> referralData
const referralCodes = new Map(); // referralCode -> userId

// Структура реферальных данных
const createReferralData = (userId, referrerId = null) => ({
  userId,
  referrerId,
  referralCode: generateReferralCode(),
  referrals: [],
  totalEarned: { stars: 0, coins: 0 },
  level: 1,
  createdAt: new Date(),
  lastActivity: new Date()
});

// Генерация уникального реферального кода
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Проверяем уникальность
  while (referralCodes.has(code)) {
    code = generateReferralCode();
  }
  
  return code;
};

// Инициализация реферальных данных пользователя
const initializeUserReferral = (userId, referrerId = null) => {
  if (referrals.has(userId)) {
    return referrals.get(userId);
  }
  
  const referralData = createReferralData(userId, referrerId);
  referrals.set(userId, referralData);
  
  if (referralData.referralCode) {
    referralCodes.set(referralData.referralCode, userId);
  }
  
  // Если есть реферер, добавляем пользователя в его список рефералов
  if (referrerId && referrals.has(referrerId)) {
    const referrerData = referrals.get(referrerId);
    referrerData.referrals.push(userId);
    
    // Вычисляем награду для реферера
    calculateReferrerReward(referrerId, userId);
  }
  
  return referralData;
};

// Получение реферальных данных пользователя
const getUserReferralData = (userId) => {
  if (!referrals.has(userId)) {
    return initializeUserReferral(userId);
  }
  return referrals.get(userId);
};

// Получение реферального кода пользователя
const getUserReferralCode = (userId) => {
  const data = getUserReferralData(userId);
  return data.referralCode;
};

// Получение списка рефералов пользователя
const getUserReferrals = (userId) => {
  const data = getUserReferralData(userId);
  return data.referrals.map(refId => {
    const refData = referrals.get(refId);
    return {
      userId: refId,
      level: refData ? refData.level : 1,
      joinedAt: refData ? refData.createdAt : new Date(),
      totalEarned: refData ? refData.totalEarned : { stars: 0, coins: 0 }
    };
  });
};

// Получение статистики рефералов
const getReferralStats = (userId) => {
  const data = getUserReferralData(userId);
  const referralsList = getUserReferrals(userId);
  
  return {
    referralCode: data.referralCode,
    totalReferrals: referralsList.length,
    activeReferrals: referralsList.filter(ref => ref.totalEarned.stars > 0).length,
    totalEarned: data.totalEarned,
    level: data.level,
    referrals: referralsList
  };
};

// Вычисление награды для реферера
const calculateReferrerReward = (referrerId, newReferralId) => {
  const referrerData = referrals.get(referrerId);
  if (!referrerData) return;
  
  // Награда за первого уровня реферала (только Stars)
  const firstLevelReward = { stars: 50, coins: 0 };
  
  // Добавляем награду рефереру (только Stars)
  addStars(referrerId, firstLevelReward.stars);
  
  // Обновляем статистику реферера
  referrerData.totalEarned.stars += firstLevelReward.stars;
  
  // Проверяем повышение уровня
  checkLevelUpgrade(referrerId);
  
  // Если у реферера есть свой реферер, даем ему награду за второго уровня
  if (referrerData.referrerId) {
    const secondLevelReward = { stars: 25, coins: 0 };
    const grandReferrerData = referrals.get(referrerData.referrerId);
    
    if (grandReferrerData) {
      addStars(referrerData.referrerId, secondLevelReward.stars);
      
      grandReferrerData.totalEarned.stars += secondLevelReward.stars;
      
      checkLevelUpgrade(referrerData.referrerId);
    }
  }
};

// Проверка повышения уровня
const checkLevelUpgrade = (userId) => {
  const data = referrals.get(userId);
  if (!data) return;
  
  const newLevel = calculateLevel(data.totalEarned.stars);
  if (newLevel > data.level) {
    data.level = newLevel;
    
    // Бонус за повышение уровня (только Stars)
    const levelBonus = { stars: newLevel * 100, coins: 0 };
    addStars(userId, levelBonus.stars);
    
    data.totalEarned.stars += levelBonus.stars;
  }
};

// Вычисление уровня на основе заработанных звезд
const calculateLevel = (totalStars) => {
  if (totalStars >= 10000) return 10;
  if (totalStars >= 5000) return 9;
  if (totalStars >= 2500) return 8;
  if (totalStars >= 1000) return 7;
  if (totalStars >= 500) return 6;
  if (totalStars >= 250) return 5;
  if (totalStars >= 100) return 4;
  if (totalStars >= 50) return 3;
  if (totalStars >= 25) return 2;
  return 1;
};

// Активация реферального кода
const activateReferralCode = (referralCode, userId) => {
  const referrerId = referralCodes.get(referralCode);
  
  if (!referrerId) {
    throw new Error('Неверный реферальный код');
  }
  
  if (referrerId === userId) {
    throw new Error('Нельзя использовать свой реферальный код');
  }
  
  const userData = getUserReferralData(userId);
  if (userData.referrerId) {
    throw new Error('У вас уже есть реферер');
  }
  
  // Устанавливаем реферера
  userData.referrerId = referrerId;
  
  // Добавляем пользователя в список рефералов реферера
  const referrerData = referrals.get(referrerId);
  if (referrerData) {
    referrerData.referrals.push(userId);
    
    // Вычисляем награду для реферера
    calculateReferrerReward(referrerId, userId);
  }
  
  return {
    referrerId,
    referralCode,
    message: 'Реферальный код успешно активирован!'
  };
};

// Получение наград за активность реферала
const getReferralActivityReward = (referrerId, referralId, activityType) => {
  const referrerData = referrals.get(referrerId);
  if (!referrerData || !referrerData.referrals.includes(referralId)) {
    return null;
  }
  
  const rewards = {
    'miner_purchase': { stars: 10, coins: 0 },
    'key_activation': { stars: 5, coins: 0 },
    'daily_login': { stars: 2, coins: 0 },
    'miner_collection': { stars: 3, coins: 0 }
  };
  
  const reward = rewards[activityType];
  if (!reward) return null;
  
  // Добавляем награду рефереру (только Stars)
  addStars(referrerId, reward.stars);
  
  // Обновляем статистику
  referrerData.totalEarned.stars += reward.stars;
  
  // Проверяем повышение уровня
  checkLevelUpgrade(referrerId);
  
  return reward;
};

// Получение топ рефералов
const getTopReferrers = (limit = 10) => {
  const allReferrers = Array.from(referrals.values())
    .filter(data => data.referrals.length > 0)
    .sort((a, b) => b.totalEarned.stars - a.totalEarned.stars)
    .slice(0, limit);
  
  return allReferrers.map(data => ({
    userId: data.userId,
    totalReferrals: data.referrals.length,
    totalEarned: data.totalEarned,
    level: data.level
  }));
};

// Получение информации об уровне
const getLevelInfo = (level) => {
  const levels = {
    1: { name: 'Новичок', requirement: 0, bonus: { stars: 0, coins: 0 } },
    2: { name: 'Активист', requirement: 25, bonus: { stars: 100, coins: 0 } },
    3: { name: 'Партнер', requirement: 50, bonus: { stars: 200, coins: 0 } },
    4: { name: 'Эксперт', requirement: 100, bonus: { stars: 300, coins: 0 } },
    5: { name: 'Мастер', requirement: 250, bonus: { stars: 400, coins: 0 } },
    6: { name: 'Гуру', requirement: 500, bonus: { stars: 500, coins: 0 } },
    7: { name: 'Легенда', requirement: 1000, bonus: { stars: 600, coins: 0 } },
    8: { name: 'Миф', requirement: 2500, bonus: { stars: 700, coins: 0 } },
    9: { name: 'Бог', requirement: 5000, bonus: { stars: 800, coins: 0 } },
    10: { name: 'Титан', requirement: 10000, bonus: { stars: 1000, coins: 0 } }
  };
  
  return levels[level] || levels[1];
};

// Получение следующего уровня
const getNextLevel = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  if (nextLevel > 10) return null;
  
  return {
    level: nextLevel,
    ...getLevelInfo(nextLevel)
  };
};

module.exports = {
  initializeUserReferral,
  getUserReferralData,
  getUserReferralCode,
  getUserReferrals,
  getReferralStats,
  activateReferralCode,
  getReferralActivityReward,
  getTopReferrers,
  getLevelInfo,
  getNextLevel,
  calculateLevel
};
