const { MongoClient } = require('mongodb');
const logger = require('./logger');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  // Подключение к MongoDB Atlas
  async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI не установлена в переменных окружения');
      }

      logger.info('Подключение к MongoDB Atlas...', { uri: uri.substring(0, 20) + '...' });

      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;

      logger.info('Успешно подключен к MongoDB Atlas', { 
        database: this.db.databaseName,
        collections: await this.db.listCollections().toArray().then(cols => cols.map(c => c.name))
      });

      // Проверяем соединение
      await this.db.admin().ping();
      logger.info('Соединение с MongoDB Atlas активно');

      return this.db;
    } catch (error) {
      logger.error('Ошибка подключения к MongoDB Atlas', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Получение базы данных
  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('База данных не подключена');
    }
    return this.db;
  }

  // Получение коллекции
  getCollection(collectionName) {
    const db = this.getDatabase();
    return db.collection(collectionName);
  }

  // Проверка соединения
  async ping() {
    try {
      if (!this.isConnected || !this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('Ошибка ping MongoDB', error);
      return false;
    }
  }

  // Закрытие соединения
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        this.db = null;
        this.client = null;
        logger.info('Соединение с MongoDB Atlas закрыто');
      }
    } catch (error) {
      logger.error('Ошибка закрытия соединения с MongoDB', error);
    }
  }

  // Инициализация коллекций и индексов
  async initializeCollections() {
    try {
      logger.info('Инициализация коллекций и индексов...');

      // Коллекция пользователей
      const usersCollection = this.getCollection('users');
      await usersCollection.createIndex({ userId: 1 }, { unique: true });
      await usersCollection.createIndex({ username: 1 }, { sparse: true });
      await usersCollection.createIndex({ referralCode: 1 }, { unique: true, sparse: true });

      // Коллекция ключей
      const keysCollection = this.getCollection('keys');
      await keysCollection.createIndex({ key: 1 }, { unique: true });
      await keysCollection.createIndex({ isActive: 1 });
      await keysCollection.createIndex({ createdAt: 1 });

      // Коллекция майнеров
      const minersCollection = this.getCollection('miners');
      await minersCollection.createIndex({ userId: 1 });
      await minersCollection.createIndex({ minerType: 1 });
      await minersCollection.createIndex({ isActive: 1 });

      // Коллекция транзакций
      const transactionsCollection = this.getCollection('transactions');
      await transactionsCollection.createIndex({ userId: 1 });
      await transactionsCollection.createIndex({ type: 1 });
      await transactionsCollection.createIndex({ createdAt: 1 });

      // Коллекция рефералов
      const referralsCollection = this.getCollection('referrals');
      await referralsCollection.createIndex({ userId: 1 }, { unique: true });
      await referralsCollection.createIndex({ referrerId: 1 });
      await referralsCollection.createIndex({ referralCode: 1 }, { unique: true });

      // Коллекция титулов пользователей
      const userTitlesCollection = this.getCollection('userTitles');
      await userTitlesCollection.createIndex({ userId: 1 }, { unique: true });
      await userTitlesCollection.createIndex({ currentTitle: 1 });

      logger.info('Коллекции и индексы успешно инициализированы');
    } catch (error) {
      logger.error('Ошибка инициализации коллекций', error);
      throw error;
    }
  }

  // Создание базовых документов
  async createDefaultData() {
    try {
      logger.info('Создание базовых данных...');

      // Создаем базовые титулы
      const titlesCollection = this.getCollection('titles');
      const existingTitles = await titlesCollection.countDocuments();
      
      if (existingTitles === 0) {
        const defaultTitles = [
          {
            id: 'novice',
            name: 'Новичок',
            description: 'Начинающий пользователь платформы',
            color: '🟢',
            rarity: 'common',
            requirements: { stars: 0, coins: 0 }
          },
          {
            id: 'owner',
            name: 'Владелец',
            description: 'Опытный пользователь с высоким статусом',
            color: '🟡',
            rarity: 'rare',
            requirements: { stars: 1000, coins: 500 }
          }
        ];

        await titlesCollection.insertMany(defaultTitles);
        logger.info('Базовые титулы созданы', { count: defaultTitles.length });
      }

      // Создаем базовые типы майнеров
      const minerTypesCollection = this.getCollection('minerTypes');
      const existingMinerTypes = await minerTypesCollection.countDocuments();
      
      if (existingMinerTypes === 0) {
        const defaultMinerTypes = [
          {
            id: 'NOVICE',
            name: 'Новичок',
            description: 'Базовый майнер для начинающих',
            price: 100,
            priceType: 'coins',
            priceSymbol: '🪙',
            rewardType: 'coins',
            rewardSymbol: '🪙',
            rewardPerMinute: 0.25,
            maxReward: 1000,
            rarity: 'common',
            serverLimit: 100,
            availableOnServer: 100
          },
          {
            id: 'STAR_PATH',
            name: 'Путь к звездам',
            description: 'Продвинутый майнер для опытных пользователей',
            price: 100,
            priceType: 'stars',
            priceSymbol: '⭐',
            rewardType: 'stars',
            rewardSymbol: '⭐',
            rewardPerMinute: 0.01,
            maxReward: 100,
            rarity: 'rare',
            serverLimit: 100,
            availableOnServer: 100
          }
        ];

        await minerTypesCollection.insertMany(defaultMinerTypes);
        logger.info('Базовые типы майнеров созданы', { count: defaultMinerTypes.length });
      }

      logger.info('Базовые данные успешно созданы');
    } catch (error) {
      logger.error('Ошибка создания базовых данных', error);
      throw error;
    }
  }

  // Получение статистики базы данных
  async getDatabaseStats() {
    try {
      const stats = {
        collections: {},
        totalDocuments: 0,
        totalSize: 0
      };

      const collections = await this.db.listCollections().toArray();
      
      for (const collection of collections) {
        const collectionStats = await this.db.collection(collection.name).stats();
        stats.collections[collection.name] = {
          count: collectionStats.count,
          size: collectionStats.size,
          avgObjSize: collectionStats.avgObjSize
        };
        stats.totalDocuments += collectionStats.count;
        stats.totalSize += collectionStats.size;
      }

      return stats;
    } catch (error) {
      logger.error('Ошибка получения статистики БД', error);
      throw error;
    }
  }
}

// Создаем единственный экземпляр
const database = new Database();

module.exports = database;
