const database = require('./database');
const logger = require('./logger');

async function migrateDataToMongoDB() {
  try {
    logger.info('Начало миграции данных в MongoDB...');
    const db = database.getDatabase();
    
    // Миграция пользователей
    await migrateUsers(db);
    
    // Миграция ключей
    await migrateKeys(db);
    
    logger.info('Миграция данных завершена успешно');
  } catch (error) {
    logger.error('Ошибка миграции данных', error);
    throw error;
  }
}

async function migrateUsers(db) {
  try {
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.countDocuments();
    
    if (existingUsers === 0) {
      logger.info('Создание базового пользователя-админа...');
      
      const adminUser = {
        userId: 123456789,
        username: 'admin',
        firstName: 'Администратор',
        isAdmin: true,
        createdAt: new Date(),
        balance: { stars: 10000, coins: 10000 },
        stats: { totalTransactions: 0, totalEarned: { stars: 0, coins: 0 } }
      };
      
      await usersCollection.insertOne(adminUser);
      logger.info('Базовый пользователь-админ создан');
    }
  } catch (error) {
    logger.error('Ошибка миграции пользователей', error);
    throw error;
  }
}

async function migrateKeys(db) {
  try {
    const keysCollection = db.collection('keys');
    const existingKeys = await keysCollection.countDocuments();
    
    if (existingKeys === 0) {
      logger.info('Создание тестовых ключей...');
      
      const testKeys = [
        {
          key: 'TEST123456789',
          description: 'Тестовый ключ',
          reward: { stars: 100, coins: 50 },
          maxUses: 10,
          currentUses: 0,
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      await keysCollection.insertMany(testKeys);
      logger.info('Тестовые ключи созданы');
    }
  } catch (error) {
    logger.error('Ошибка миграции ключей', error);
    throw error;
  }
}

module.exports = { migrateDataToMongoDB };
