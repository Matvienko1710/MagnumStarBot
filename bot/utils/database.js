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

            // Проверяем, подключена ли база данных
            if (!this.db) {
                logger.warn('База данных не подключена, пропускаем создание индексов');
                return;
            }

            // Вспомогательная функция для создания индекса с обработкой конфликтов
            const createIndexSafe = async (collection, keys, options = {}) => {
                try {
                    const indexName = Object.keys(keys).join('_') + '_' + Object.values(keys).join('_');
                    const existingIndexes = await collection.indexes();
                    const indexExists = existingIndexes.some(idx => idx.name === indexName);

                    if (indexExists) {
                        logger.info(`Индекс ${indexName} уже существует, пропускаем`);
                        return;
                    }

                    await collection.createIndex(keys, options);
                    logger.info(`Индекс ${indexName} создан`);
                } catch (error) {
                    if (error.code === 11000 || error.message.includes('already exists') || error.message.includes('index already exists')) {
                        logger.info(`Индекс для ${JSON.stringify(keys)} уже существует`);
                    } else {
                        logger.error(`Ошибка создания индекса для ${JSON.stringify(keys)}`, error);
                        // Не выбрасываем ошибку, продолжаем создание других индексов
                    }
                }
            };

            // Индекс для пользователей
            await createIndexSafe(this.db.collection('users'), { userId: 1 }, { unique: true });
            await createIndexSafe(this.db.collection('users'), { lastActivity: 1 });
            await createIndexSafe(this.db.collection('users'), { 'balance.stars': 1 });
            await createIndexSafe(this.db.collection('users'), { 'balance.coins': 1 });
            await createIndexSafe(this.db.collection('users'), { 'miners.0': 1 }); // Для поиска пользователей с майнерами

            // Индекс для транзакций
            await createIndexSafe(this.db.collection('transactions'), { userId: 1, timestamp: -1 });
            await createIndexSafe(this.db.collection('transactions'), { currency: 1, timestamp: -1 });
            await createIndexSafe(this.db.collection('transactions'), { reason: 1, timestamp: -1 });

            // Индекс для ключей
            await createIndexSafe(this.db.collection('keys'), { key: 1 }, { unique: true });

            // Индекс для активаций ключей
            await createIndexSafe(this.db.collection('key_activations'), { key: 1 });
            await createIndexSafe(this.db.collection('key_activations'), { userId: 1 });
            await createIndexSafe(this.db.collection('key_activations'), { activatedAt: 1 });

            // Индекс для рефералов (уникальный, чтобы предотвратить дублирование)
            await createIndexSafe(this.db.collection('referrals'), { userId: 1, referrerId: 1 }, { unique: true });

            // Индекс для заявок на вывод
            await createIndexSafe(this.db.collection('withdrawals'), { id: 1 }, { unique: true });
            await createIndexSafe(this.db.collection('withdrawals'), { userId: 1 });
            await createIndexSafe(this.db.collection('withdrawals'), { status: 1 });

            // Индекс для автоматического удаления сообщений
            await createIndexSafe(this.db.collection('message_deletions'), { deleteAt: 1 });
            await createIndexSafe(this.db.collection('message_deletions'), { messageId: 1 });
            await createIndexSafe(this.db.collection('message_deletions'), { isDeleted: 1 });

            // Индекс для поддержки
            await createIndexSafe(this.db.collection('support_tickets'), { userId: 1 });
            await createIndexSafe(this.db.collection('support_tickets'), { status: 1 });
            await createIndexSafe(this.db.collection('support_tickets'), { createdAt: -1 });
            await createIndexSafe(this.db.collection('support_tickets'), { id: 1 }, { unique: true });

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
