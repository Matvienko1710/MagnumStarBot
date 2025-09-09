// Общее хранилище баланса для всех API endpoints

// Временное хранилище баланса (в реальном проекте - база данных)
const usersBalance = new Map();

// Инициализация дефолтного баланса
export function initializeUserBalance(userId) {
  if (!usersBalance.has(userId)) {
    usersBalance.set(userId, {
      stars: 10,
      coins: 1000, // Стартовый баланс
      totalEarned: { stars: 0, coins: 0 },
      lastUpdate: Date.now(),
      history: [] // История транзакций
    });
  }
  return usersBalance.get(userId);
}

// Получение баланса пользователя
export function getUserBalance(userId) {
  return initializeUserBalance(userId);
}

// Обновление баланса пользователя
export function updateUserBalance(userId, type, amount, reason = 'transaction') {
  const balance = getUserBalance(userId);
  
  const transaction = {
    type,
    amount,
    reason,
    timestamp: Date.now(),
    balanceBefore: {
      stars: balance.stars,
      coins: balance.coins
    }
  };
  
  if (type === 'coins') {
    balance.coins += amount;
    if (amount > 0) balance.totalEarned.coins += amount;
  } else if (type === 'stars') {
    balance.stars += amount;
    if (amount > 0) balance.totalEarned.stars += amount;
  }
  
  // Не позволяем балансу уйти в минус
  balance.coins = Math.max(0, balance.coins);
  balance.stars = Math.max(0, balance.stars);
  
  transaction.balanceAfter = {
    stars: balance.stars,
    coins: balance.coins
  };
  
  // Сохраняем транзакцию в историю
  balance.history.push(transaction);
  
  // Ограничиваем историю последними 100 транзакциями
  if (balance.history.length > 100) {
    balance.history = balance.history.slice(-100);
  }
  
  balance.lastUpdate = Date.now();
  usersBalance.set(userId, balance);
  
  console.log(`💰 Баланс пользователя ${userId} обновлен:`, {
    type,
    amount,
    reason,
    newBalance: {
      stars: balance.stars,
      coins: balance.coins
    }
  });
  
  return balance;
}

// Проверка достаточности средств
export function canAfford(userId, type, amount) {
  const balance = getUserBalance(userId);
  
  if (type === 'coins') {
    return balance.coins >= amount;
  } else if (type === 'stars') {
    return balance.stars >= amount;
  }
  
  return false;
}

// Списание средств с проверкой
export function deductBalance(userId, type, amount, reason = 'purchase') {
  if (!canAfford(userId, type, amount)) {
    throw new Error(`Недостаточно средств: требуется ${amount} ${type}`);
  }
  
  return updateUserBalance(userId, type, -amount, reason);
}

// Добавление средств
export function addBalance(userId, type, amount, reason = 'reward') {
  return updateUserBalance(userId, type, amount, reason);
}

// Получение истории транзакций
export function getTransactionHistory(userId, limit = 20) {
  const balance = getUserBalance(userId);
  return balance.history.slice(-limit).reverse(); // Последние транзакции первыми
}

// Очистка данных (для тестирования)
export function clearUserData(userId) {
  usersBalance.delete(userId);
  console.log(`🗑️ Данные пользователя ${userId} очищены`);
}

// Получение всех пользователей (для админки)
export function getAllUsers() {
  const users = [];
  for (const [userId, balance] of usersBalance.entries()) {
    users.push({
      userId,
      balance: {
        stars: balance.stars,
        coins: balance.coins,
        totalEarned: balance.totalEarned,
        lastUpdate: balance.lastUpdate
      }
    });
  }
  return users;
}
