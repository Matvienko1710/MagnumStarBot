const dataManager = require('./dataManager');
const logger = require('./logger');

// Получение реферальных данных пользователя
const getUserReferralData = async (userId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.referral;
  } catch (error) {
    logger.error('Ошибка получения реферальных данных', error, { userId });
    return {
      code: null,
      referrerId: null,
      referrals: [],
      totalEarned: { stars: 0, coins: 0 },
      level: 1
    };
  }
};

// Получение реферального кода пользователя
const getUserReferralCode = async (userId) => {
  try {
    const data = await getUserReferralData(userId);
    return data.code;
  } catch (error) {
    logger.error('Ошибка получения реферального кода', error, { userId });
    return null;
  }
};

// Получение списка рефералов пользователя
const getUserReferrals = async (userId) => {
  try {
    const data = await getUserReferralData(userId);
    return data.referrals.map(refId => ({
      userId: refId,
      level: 1,
      joinedAt: new Date(),
      totalEarned: { stars: 0, coins: 0 }
    }));
  } catch (error) {
    logger.error('Ошибка получения списка рефералов', error, { userId });
    return [];
  }
};

// Получение статистики рефералов
const getReferralStats = async (userId) => {
  try {
    const data = await getUserReferralData(userId);
    const referralsList = await getUserReferrals(userId);
    
    return {
      referralCode: data.code,
      totalReferrals: referralsList.length,
      activeReferrals: referralsList.length, // Пока упрощенно
      totalEarned: data.totalEarned,
      level: data.level,
      referrals: referralsList
    };
  } catch (error) {
    logger.error('Ошибка получения реферальной статистики', error, { userId });
    return {
      referralCode: null,
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarned: { stars: 0, coins: 0 },
      level: 1,
      referrals: []
    };
  }
};

// Настройка реферальной системы для нового пользователя
const setupReferral = async (userId, referrerId = null) => {
  try {
    const referralData = await dataManager.setupReferral(userId, referrerId);
    logger.info('Реферальная система настроена', { userId, referrerId, referralData });
    return referralData;
  } catch (error) {
    logger.error('Ошибка настройки реферальной системы', error, { userId, referrerId });
    throw error;
  }
};

// Получение награды за активность реферала
const getReferralActivityReward = (referrerId, newUserId, activityType) => {
  try {
    // Награды за разные типы активности
    const rewards = {
      'referral_invite': { stars: 5, coins: 1000 }, // Награда за приглашение нового пользователя
      'key_activation': { stars: 2, coins: 0 },
      'miner_purchase': { stars: 1, coins: 0 },
      'daily_login': { stars: 1, coins: 0 }
    };

    const reward = rewards[activityType] || { stars: 0, coins: 0 };

    if (reward.stars > 0 || reward.coins > 0) {
      logger.info('Реферальная награда', { referrerId, newUserId, activityType, reward });
      return reward;
    }

    return null;
  } catch (error) {
    logger.error('Ошибка расчета реферальной награды', error, { referrerId, newUserId, activityType });
    return null;
  }
};

// Получение топ рефералов
const getTopReferrers = async (limit = 10) => {
  try {
    // Здесь будет логика получения топ рефералов из MongoDB
    // Пока что возвращаем заглушку
    return [];
  } catch (error) {
    logger.error('Ошибка получения топ рефералов', error);
    return [];
  }
};

// Обработка реферального приглашения
const processReferralInvite = async (userId, referrerCode) => {
  try {
    // Находим пользователя по реферальному коду
    const referrer = await dataManager.getUserByReferralCode(referrerCode);
    
    if (!referrer) {
      throw new Error('Неверный реферальный код');
    }
    
    if (referrer.userId === userId) {
      throw new Error('Нельзя пригласить самого себя');
    }
    
    // Настраиваем реферальную систему
    await setupReferral(userId, referrer.userId);
    
    // Даем награду рефереру
    const reward = getReferralActivityReward(referrer.userId, userId, 'referral_invite');
    if (reward) {
      // Здесь будет логика начисления награды
      logger.info('Реферальная награда начислена', { referrerId: referrer.userId, userId, reward });
    }
    
    return {
      success: true,
      referrerId: referrer.userId,
      reward
    };
    
  } catch (error) {
    logger.error('Ошибка обработки реферального приглашения', error, { userId, referrerCode });
    throw error;
  }
};

module.exports = {
  // Основные функции
  getUserReferralData,
  getUserReferralCode,
  getUserReferrals,
  getReferralStats,
  
  // Настройка и управление
  setupReferral,
  processReferralInvite,
  
  // Награды и статистика
  getReferralActivityReward,
  getTopReferrers
};
