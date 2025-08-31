const { MongoClient } = require('mongodb');
const logger = require('./logger');

class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            
            if (!mongoUri) {
                throw new Error('MONGODB_URI не установлена в переменных окружения');
            }

            logger.info('Подключение к MongoDB Atlas...', { mongoUri: mongoUri.substring(0, 20) + '...' });

            // Простое подключение без дополнительных опций
            this.client = new MongoClient(mongoUri);
            await this.client.connect();

            this.db = this.client.db();
            this.isConnected = true;

            logger.info('✅ Успешно подключились к MongoDB Atlas');
            
            // Инициализируем коллекции
            await this.initializeCollections();
            
            return true;

        } catch (error) {
            logger.error('❌ Ошибка подключения к MongoDB Atlas', error);
            throw error;
        }
    }

    async initializeCollections() {
        try {
            logger.info('Инициализация коллекций...');

            // Список необходимых коллекций
            const collections = [
                'users',
                'miners', 
                'titles',
                'keys',
                'key_activations',
                'referrals',
                'transactions',
                'withdrawals',
                'message_deletions'
            ];

            for (const collectionName of collections) {
                try {
                    // Проверяем существование коллекции
                    const collections = await this.db.listCollections({ name: collectionName }).toArray();
                    
                    if (collections.length === 0) {
                        // Создаем коллекцию, вставляя и сразу удаляя документ
                        const collection = this.db.collection(collectionName);
                        const tempDoc = { _temp: true, createdAt: new Date() };
                        await collection.insertOne(tempDoc);
                        await collection.deleteOne(tempDoc);
                        
                        logger.info(`✅ Коллекция ${collectionName} создана`);
                    } else {
                        logger.info(`✅ Коллекция ${collectionName} уже существует`);
                    }
                } catch (error) {
                    logger.error(`❌ Ошибка при создании коллекции ${collectionName}`, error);
                }
            }

            // Создаем индексы
            await this.createIndexes();
            
            // Создаем начальные данные
            await this.createDefaultData();

            logger.info('✅ Все коллекции инициализированы');

        } catch (error) {
            logger.error('❌ Ошибка инициализации коллекций', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            logger.info('Создание индексов...');

            // Индекс для пользователей
            await this.db.collection('users').createIndex({ userId: 1 }, { unique: true });
            await this.db.collection('users').createIndex({ lastActivity: 1 });
            await this.db.collection('users').createIndex({ 'balance.stars': 1 });
            await this.db.collection('users').createIndex({ 'balance.coins': 1 });
            await this.db.collection('users').createIndex({ 'miners.0': 1 }); // Для поиска пользователей с майнерами

            // Индекс для транзакций
            await this.db.collection('transactions').createIndex({ userId: 1, timestamp: -1 });
            await this.db.collection('transactions').createIndex({ currency: 1, timestamp: -1 });
            await this.db.collection('transactions').createIndex({ reason: 1, timestamp: -1 });

            // Индекс для ключей
            await this.db.collection('keys').createIndex({ key: 1 }, { unique: true });
            
            // Индекс для активаций ключей
            await this.db.collection('key_activations').createIndex({ key: 1 });
            await this.db.collection('key_activations').createIndex({ userId: 1 });
            await this.db.collection('key_activations').createIndex({ activatedAt: 1 });
            
            // Индекс для рефералов
            await this.db.collection('referrals').createIndex({ userId: 1, referrerId: 1 });
            
            // Индекс для заявок на вывод
            await this.db.collection('withdrawals').createIndex({ id: 1 }, { unique: true });
            await this.db.collection('withdrawals').createIndex({ userId: 1 });
            await this.db.collection('withdrawals').createIndex({ status: 1 });
            
            // Индекс для автоматического удаления сообщений
            await this.db.collection('message_deletions').createIndex({ deleteAt: 1 });
            await this.db.collection('message_deletions').createIndex({ messageId: 1 });
            await this.db.collection('message_deletions').createIndex({ isDeleted: 1 });

            logger.info('✅ Индексы созданы');

        } catch (error) {
            logger.error('❌ Ошибка создания индексов', error);
        }
    }

    async createDefaultData() {
        try {
            logger.info('Создание начальных данных...');

            // Проверяем, есть ли уже данные
            const usersCount = await this.db.collection('users').countDocuments();
            if (usersCount === 0) {
                logger.info('Создание начальных данных...');
                
                // Здесь можно добавить создание начальных данных если нужно
                logger.info('✅ Начальные данные созданы');
            } else {
                logger.info('Начальные данные уже существуют');
            }

        } catch (error) {
            logger.error('❌ Ошибка создания начальных данных', error);
        }
    }

    getDb() {
        if (!this.isConnected) {
            throw new Error('База данных не подключена');
        }
        return this.db;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            logger.info('Отключились от MongoDB Atlas');
        }
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'База данных не подключена' };
            }
            
            await this.db.admin().ping();
            return { status: 'connected', message: 'База данных работает' };
            
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

// Создаем и экспортируем экземпляр
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
