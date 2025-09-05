// Система управления валютой Magnum Coins и Stars
const dataManager = require('./dataManager');
const logger = require('./logger');

// Курсы обмена
const EXCHANGE_RATES = {
  STAR_TO_COIN: 10, // 1 Star = 10 Magnum Coins
  COIN_TO_STAR: 0.1 // 10 Magnum Coins = 1 Star
};

// Инициализация баланса пользователя
const initializeUserBalance = async (userId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.balance;
  } catch (error) {
    logger.error('Ошибка инициализации баланса пользователя', error, { userId });
    return {
      stars: 0,
      coins: 0,
      lastUpdated: new Date(),
      totalEarned: {
        stars: 0,
        coins: 0
      }
    };
  }
};

// Получение баланса пользователя
const getUserBalance = async (userId) => {
  try {
    return await dataManager.getUserBalance(userId);
  } catch (error) {
    logger.error('Ошибка получения баланса пользователя', error, { userId });
    return {
      stars: 0,
      coins: 0,
      totalEarned: { stars: 0, coins: 0 }
    };
  }
};

// Добавление монет через клик
const addCoinsForClick = async (userId) => {
  try {
    const lastClick = await dataManager.getLastAction(userId, 'click');
    const now = Date.now();
    const COOLDOWN_TIME = 1000; // 1 секунда между кликами

    if (lastClick && (now - lastClick < COOLDOWN_TIME)) {
      throw new Error('Слишком частые клики');
    }

    const COINS_PER_CLICK = 1;
    const newBalance = await dataManager.updateBalance(userId, 'coins', COINS_PER_CLICK, 'click-reward');
    await dataManager.updateLastAction(userId, 'click', now);

    logger.info('Монеты за клик добавлены', { userId, amount: COINS_PER_CLICK, newBalance });
    return newBalance;
  } catch (error) {
    logger.error('Ошибка добавления монет за клик', error, { userId });
    throw error;
  }
};

// Обновление баланса Stars
const updateStars = async (userId, amount, reason = 'transaction') => {
  try {
    const newBalance = await dataManager.updateBalance(userId, 'stars', amount, reason);
    logger.info('Баланс Stars обновлен', { userId, amount, reason, newBalance });
    return newBalance;
  } catch (error) {
    logger.error('Ошибка обновления баланса Stars', error, { userId, amount, reason });
    throw error;
  }
};

// Обновление баланса Magnum Coins
const updateCoins = async (userId, amount, reason = 'transaction') => {
  try {
    const newBalance = await dataManager.updateBalance(userId, 'coins', amount, reason);
    logger.info('Баланс Magnum Coins обновлен', { userId, amount, reason, newBalance });
    return newBalance;
  } catch (error) {
    logger.error('Ошибка обновления баланса Magnum Coins', error, { userId, amount, reason });
    throw error;
  }
};

// Обмен Stars на Magnum Coins
const exchangeStarsToCoins = async (userId, starsAmount) => {
  try {
    const balance = await getUserBalance(userId);
    
    if (balance.stars < starsAmount) {
      throw new Error('Недостаточно Stars для обмена');
    }
    
    const coinsAmount = Math.floor(starsAmount * EXCHANGE_RATES.STAR_TO_COIN);
    
    await updateStars(userId, -starsAmount, 'exchange_to_coins');
    await updateCoins(userId, coinsAmount, 'exchange_from_stars');
    
    const newBalance = await getUserBalance(userId);
    
    return {
      starsSpent: starsAmount,
      coinsReceived: coinsAmount,
      newStarsBalance: newBalance.stars,
      newCoinsBalance: newBalance.coins
    };
  } catch (error) {
    logger.error('Ошибка обмена Stars на Coins', error, { userId, starsAmount });
    throw error;
  }
};

// Обмен Magnum Coins на Stars
const exchangeCoinsToStars = async (userId, coinsAmount) => {
  try {
    const balance = await getUserBalance(userId);
    
    if (balance.coins < coinsAmount) {
      throw new Error('Недостаточно Magnum Coins для обмена');
    }
    
    const starsAmount = Math.floor(coinsAmount * EXCHANGE_RATES.COIN_TO_STAR);
    
    if (starsAmount < 1) {
      throw new Error('Минимальная сумма для обмена: 10 Magnum Coins = 1 Star');
    }
    
    await updateCoins(userId, -coinsAmount, 'exchange_to_stars');
    await updateStars(userId, starsAmount, 'exchange_from_coins');
    
    const newBalance = await getUserBalance(userId);
    
    return {
      coinsSpent: coinsAmount,
      starsReceived: starsAmount,
      newCoinsBalance: newBalance.coins,
      newStarsBalance: newBalance.stars
    };
  } catch (error) {
    logger.error('Ошибка обмена Coins на Stars', error, { userId, coinsAmount });
    throw error;
  }
};

// Получение истории транзакций пользователя
const getUserTransactionHistory = async (userId, limit = 50) => {
  try {
    // Здесь будет логика получения истории транзакций из MongoDB
    // Пока что возвращаем заглушку
    return [];
  } catch (error) {
    logger.error('Ошибка получения истории транзакций', error, { userId });
    return [];
  }
};

// Получение статистики по валютам
const getCurrencyStats = async () => {
  try {
    const botStats = await dataManager.getBotStats();
    return {
      totalUsers: botStats.totalUsers,
      totalStarsWithdrawn: botStats.totalStarsWithdrawn,
      totalCoinsEarned: botStats.totalCoinsEarned,
      exchangeRates: EXCHANGE_RATES
    };
  } catch (error) {
    logger.error('Ошибка получения статистики по валютам', error);
    return {
      totalUsers: 0,
      totalStarsWithdrawn: 0,
      totalCoinsEarned: 0,
      exchangeRates: EXCHANGE_RATES
    };
  }
};

module.exports = {
  // Основные функции
  getUserBalance,
  updateStars,
  updateCoins,
  addCoinsForClick,
  
  // Обмен валют
  exchangeStarsToCoins,
  exchangeCoinsToStars,
  
  // История и статистика
  getUserTransactionHistory,
  getCurrencyStats,
  
  // Утилиты
  initializeUserBalance
};
