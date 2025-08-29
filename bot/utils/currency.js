// Система управления валютой Magnum Coins и Stars

// Временное хранилище данных (в реальном проекте заменить на БД)
const userBalances = new Map();
const transactionHistory = new Map();

// Курсы обмена
const EXCHANGE_RATES = {
  STAR_TO_COIN: 10, // 1 Star = 10 Magnum Coins
  COIN_TO_STAR: 0.1 // 10 Magnum Coins = 1 Star
};

// Инициализация баланса пользователя
const initializeUserBalance = (userId) => {
  if (!userBalances.has(userId)) {
    userBalances.set(userId, {
      stars: 0,
      coins: 0,
      lastUpdated: new Date(),
      totalEarned: {
        stars: 0,
        coins: 0
      }
    });
  }
  return userBalances.get(userId);
};

// Получение баланса пользователя
const getUserBalance = (userId) => {
  return initializeUserBalance(userId);
};

// Обновление баланса Stars
const updateStars = (userId, amount, reason = 'transaction') => {
  const balance = initializeUserBalance(userId);
  const oldStars = balance.stars;
  balance.stars += amount;
  balance.lastUpdated = new Date();
  
  if (amount > 0) {
    balance.totalEarned.stars += amount;
  }
  
  // Записываем транзакцию
  addTransaction(userId, 'stars', amount, reason, oldStars, balance.stars);
  
  return balance.stars;
};

// Обновление баланса Magnum Coins
const updateCoins = (userId, amount, reason = 'transaction') => {
  const balance = initializeUserBalance(userId);
  const oldCoins = balance.coins;
  balance.coins += amount;
  balance.lastUpdated = new Date();
  
  if (amount > 0) {
    balance.totalEarned.coins += amount;
  }
  
  // Записываем транзакцию
  addTransaction(userId, 'coins', amount, reason, oldCoins, balance.coins);
  
  return balance.coins;
};

// Обмен Stars на Magnum Coins
const exchangeStarsToCoins = (userId, starsAmount) => {
  const balance = getUserBalance(userId);
  
  if (balance.stars < starsAmount) {
    throw new Error('Недостаточно Stars для обмена');
  }
  
  const coinsAmount = Math.floor(starsAmount * EXCHANGE_RATES.STAR_TO_COIN);
  
  updateStars(userId, -starsAmount, 'exchange_to_coins');
  updateCoins(userId, coinsAmount, 'exchange_from_stars');
  
  return {
    starsSpent: starsAmount,
    coinsReceived: coinsAmount,
    newStarsBalance: balance.stars - starsAmount,
    newCoinsBalance: balance.coins + coinsAmount
  };
};

// Обмен Magnum Coins на Stars
const exchangeCoinsToStars = (userId, coinsAmount) => {
  const balance = getUserBalance(userId);
  
  if (balance.coins < coinsAmount) {
    throw new Error('Недостаточно Magnum Coins для обмена');
  }
  
  const starsAmount = Math.floor(coinsAmount * EXCHANGE_RATES.COIN_TO_STAR);
  
  if (starsAmount < 1) {
    throw new Error('Минимальная сумма для обмена: 10 Magnum Coins = 1 Star');
  }
  
  updateCoins(userId, -coinsAmount, 'exchange_to_stars');
  updateStars(userId, starsAmount, 'exchange_from_coins');
  
  return {
    coinsSpent: coinsAmount,
    starsReceived: starsAmount,
    newCoinsBalance: balance.coins - coinsAmount,
    newStarsBalance: balance.stars + starsAmount
  };
};

// Добавление транзакции в историю
const addTransaction = (userId, currency, amount, reason, oldBalance, newBalance) => {
  if (!transactionHistory.has(userId)) {
    transactionHistory.set(userId, []);
  }
  
  const transaction = {
    id: Date.now() + Math.random(),
    currency: currency, // 'stars' или 'coins'
    amount: amount,
    reason: reason,
    oldBalance: oldBalance,
    newBalance: newBalance,
    timestamp: new Date()
  };
  
  transactionHistory.get(userId).push(transaction);
  
  // Ограничиваем историю последними 50 транзакциями
  if (transactionHistory.get(userId).length > 50) {
    transactionHistory.get(userId).shift();
  }
};

// Получение истории транзакций
const getTransactionHistory = (userId, limit = 10) => {
  if (!transactionHistory.has(userId)) {
    return [];
  }
  
  return transactionHistory.get(userId)
    .slice(-limit)
    .reverse();
};

// Получение статистики пользователя
const getUserStats = (userId) => {
  const balance = getUserBalance(userId);
  const transactions = getTransactionHistory(userId, 100);
  
  const stats = {
    currentBalance: {
      stars: balance.stars,
      coins: balance.coins
    },
    totalEarned: balance.totalEarned,
    totalTransactions: transactions.length,
    lastTransaction: transactions.length > 0 ? transactions[0] : null,
    exchangeRates: EXCHANGE_RATES
  };
  
  return stats;
};

module.exports = {
  // Основные функции баланса
  getUserBalance,
  updateStars,
  updateCoins,
  
  // Функции обмена
  exchangeStarsToCoins,
  exchangeCoinsToStars,
  
  // Функции истории и статистики
  getTransactionHistory,
  getUserStats,
  
  // Константы
  EXCHANGE_RATES
};
