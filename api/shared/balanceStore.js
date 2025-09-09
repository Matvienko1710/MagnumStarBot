const { MongoClient } = require('mongodb');

let client;
let db;

// Инициализация подключения к MongoDB
async function initializeDatabase() {
  if (client) return;
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/magnumstar';
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('magnumstar');
    console.log('✅ Подключение к MongoDB установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    throw error;
  }
}

// Инициализация баланса пользователя
async function initializeUserBalance(userId) {
  await initializeDatabase();
  
  const users = db.collection('users');
  const existingUser = await users.findOne({ userId });
  
  if (!existingUser) {
    const newUser = {
      userId,
      balance: {
        stars: 0,
        coins: 1000, // Стартовые монеты
        totalEarned: {
          stars: 0,
          coins: 1000
        }
      },
      lastActivity: new Date(),
      createdAt: new Date()
    };
    
    await users.insertOne(newUser);
    console.log(`✅ Создан новый пользователь: ${userId}`);
    return newUser.balance;
  }
  
  return existingUser.balance;
}

// Получение баланса пользователя
async function getUserBalance(userId) {
  await initializeDatabase();
  
  const users = db.collection('users');
  const user = await users.findOne({ userId });
  
  if (!user) {
    return await initializeUserBalance(userId);
  }
  
  return {
    stars: user.balance.stars || 0,
    coins: user.balance.coins || 0,
    totalEarned: user.balance.totalEarned || { stars: 0, coins: 0 },
    lastUpdate: user.lastActivity || new Date()
  };
}

// Обновление баланса пользователя
async function updateUserBalance(userId, currency, amount, reason) {
  await initializeDatabase();
  
  const users = db.collection('users');
  
  // Получаем текущий баланс
  const currentBalance = await getUserBalance(userId);
  
  // Проверяем достаточность средств для списания
  if (amount < 0 && currentBalance[currency] < Math.abs(amount)) {
    throw new Error(`Недостаточно средств: требуется ${Math.abs(amount)} ${currency}, доступно ${currentBalance[currency]}`);
  }
  
  // Обновляем баланс
  const updateObj = {
    $set: {
      lastActivity: new Date()
    },
    $inc: {
      [`balance.${currency}`]: amount
    }
  };
  
  // Если это увеличение, также увеличиваем totalEarned
  if (amount > 0) {
    updateObj.$inc[`balance.totalEarned.${currency}`] = amount;
  }
  
  const result = await users.updateOne(
    { userId },
    updateObj
  );
  
  if (result.matchedCount === 0) {
    throw new Error('Пользователь не найден');
  }
  
  // Получаем обновленный баланс
  const updatedBalance = await getUserBalance(userId);
  
  // Логируем транзакцию
  const transactions = db.collection('transactions');
  await transactions.insertOne({
    userId,
    type: currency,
    amount,
    reason,
    timestamp: new Date(),
    balanceAfter: updatedBalance
  });
  
  return updatedBalance;
}

// Получение истории транзакций
async function getTransactionHistory(limit = 50) {
  await initializeDatabase();
  
  const transactions = db.collection('transactions');
  const recentTransactions = await transactions
    .find({ amount: { $gt: 0 } }) // Только положительные транзакции (выигрыши)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return recentTransactions.map(tx => ({
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    reason: tx.reason,
    timestamp: tx.timestamp
  }));
}

// Проверка достаточности средств
async function canAfford(userId, currency, amount) {
  const balance = await getUserBalance(userId);
  return balance[currency] >= amount;
}

// Списание средств
async function deductBalance(userId, currency, amount, reason) {
  return await updateUserBalance(userId, currency, -Math.abs(amount), reason);
}

// Добавление средств
async function addBalance(userId, currency, amount, reason) {
  return await updateUserBalance(userId, currency, Math.abs(amount), reason);
}

// Очистка данных пользователя
async function clearUserData(userId) {
  await initializeDatabase();
  
  const users = db.collection('users');
  const transactions = db.collection('transactions');
  
  await users.deleteOne({ userId });
  await transactions.deleteMany({ userId });
}

// Получение всех пользователей
async function getAllUsers() {
  await initializeDatabase();
  
  const users = db.collection('users');
  return await users.find({}).toArray();
}

module.exports = {
  initializeUserBalance,
  getUserBalance,
  updateUserBalance,
  canAfford,
  deductBalance,
  addBalance,
  getTransactionHistory,
  clearUserData,
  getAllUsers
};
