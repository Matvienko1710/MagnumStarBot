const { MongoClient } = require('mongodb');
const logger = require('./logger');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            let uri = process.env.MONGODB_URI;
            if (!uri) {
                throw new Error('MONGODB_URI не установлена в переменных окружения');
            }

            console.log('🔧 Подключение к MongoDB Atlas кластеру...');
            console.log('📊 Оригинальный URI:', uri.substring(0, 30) + '...');

            // Создаем альтернативные URI для тестирования
            const alternativeUris = [
                uri, // Оригинальный URI
                uri.split('?')[0], // Без параметров вообще
                uri.split('?')[0] + '?retryWrites=false', // Только retryWrites
                uri.replace('mongodb+srv://', 'mongodb://'), // Попробуем обычный MongoDB протокол
            ];

            // Специальные настройки для Render и решения SSL проблем
            const connectionConfigs = [
                // Конфигурация 1: Специально для Render (без SSL)
                {
                    serverApi: { 
                        version: '1', 
                        strict: true, 
                        deprecationErrors: true 
                    },
                    ssl: false,
                    tls: false,
                    maxPoolSize: 5,
                    minPoolSize: 1,
                    connectTimeoutMS: 60000,
                    socketTimeoutMS: 60000,
                    serverSelectionTimeoutMS: 60000,
                    heartbeatFrequencyMS: 30000,
                    maxStalenessSeconds: 90,
                    // Специальные настройки для Render
                    directConnection: false,
                    compressors: [],
                    zlibCompressionLevel: 0,
                },
                // Конфигурация 2: С минимальными SSL настройками
                {
                    serverApi: { 
                        version: '1', 
                        strict: true, 
                        deprecationErrors: true 
                    },
                    ssl: true,
                    tls: true,
                    tlsAllowInvalidCertificates: true,
                    tlsAllowInvalidHostnames: true,
                    maxPoolSize: 5,
                    connectTimeoutMS: 60000,
                    socketTimeoutMS: 60000,
                    serverSelectionTimeoutMS: 60000,
                },
                // Конфигурация 3: Стандартная MongoDB Atlas
                {
                    serverApi: { 
                        version: '1', 
                        strict: true, 
                        deprecationErrors: true 
                    },
                    maxPoolSize: 5,
                    connectTimeoutMS: 60000,
                    socketTimeoutMS: 60000,
                    serverSelectionTimeoutMS: 60000,
                },
                // Конфигурация 4: Экстремально простая (для Render)
                {
                    serverApi: { 
                        version: '1', 
                        strict: false, 
                        deprecationErrors: false 
                    },
                    maxPoolSize: 1,
                    connectTimeoutMS: 60000,
                    socketTimeoutMS: 60000,
                    serverSelectionTimeoutMS: 60000,
                }
            ];

            let lastError = null;

            // Пробуем разные URI и конфигурации
            for (let uriIndex = 0; uriIndex < alternativeUris.length; uriIndex++) {
                const currentUri = alternativeUris[uriIndex];
                console.log(`🔧 Тестирование URI ${uriIndex + 1}:`, currentUri.substring(0, 30) + '...');

                for (let configIndex = 0; configIndex < connectionConfigs.length; configIndex++) {
                    const config = connectionConfigs[configIndex];
                    try {
                        console.log(`🔧 Попытка подключения с URI ${uriIndex + 1} и конфигурацией ${configIndex + 1}:`, {
                            ssl: config.ssl,
                            tls: config.tls,
                            tlsAllowInvalidCertificates: config.tlsAllowInvalidCertificates,
                            maxPoolSize: config.maxPoolSize,
                            connectTimeoutMS: config.connectTimeoutMS,
                            retryWrites: config.retryWrites
                        });

                        this.client = new MongoClient(currentUri, config);
                        await this.client.connect();
                        this.db = this.client.db();
                        this.isConnected = true;
                        
                        console.log(`✅ Успешно подключено с URI ${uriIndex + 1} и конфигурацией ${configIndex + 1}`);
                        console.log(`📊 База данных: ${this.db.databaseName}`);
                        
                        // Тестируем подключение
                        await this.ping();
                        return;
                        
                    } catch (error) {
                        console.error(`❌ Ошибка с URI ${uriIndex + 1} и конфигурацией ${configIndex + 1}:`, error.message);
                        console.error(`🔍 Детали ошибки:`, {
                            code: error.code,
                            name: error.name,
                            stack: error.stack?.split('\n')[0]
                        });
                        lastError = error;
                        
                        // Закрываем клиент если он был создан
                        if (this.client) {
                            try {
                                await this.client.close();
                            } catch (closeError) {
                                console.error('Ошибка закрытия клиента:', closeError.message);
                            }
                            this.client = null;
                            this.db = null;
                            this.isConnected = false;
                        }
                        
                        // Небольшая пауза между попытками
                        if (configIndex < connectionConfigs.length - 1) {
                            console.log(`⏳ Пауза 3 секунды перед следующей конфигурацией...`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                    }
                }
                
                // Пауза между URI
                if (uriIndex < alternativeUris.length - 1) {
                    console.log(`⏳ Пауза 5 секунд перед следующим URI...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            // Если все комбинации не сработали
            throw lastError || new Error('Не удалось подключиться ни с одной комбинацией URI и конфигурации');
            
        } catch (error) {
            console.error('❌ Критическая ошибка подключения к MongoDB Atlas:', error.message);
            console.error('🔍 Полная ошибка:', error);
            this.isConnected = false;
            throw error;
        }
    }

    getDatabase() {
        return this.db;
    }

    getCollection(collectionName) {
        if (!this.db) {
            throw new Error('База данных не подключена');
        }
        return this.db.collection(collectionName);
    }

    async ping() {
        try {
            if (!this.client) {
                throw new Error('Клиент MongoDB не инициализирован');
            }
            
            const result = await this.client.db('admin').command({ ping: 1 });
            console.log('✅ Ping к MongoDB успешен:', result);
            return true;
        } catch (error) {
            console.error('❌ Ошибка ping к MongoDB:', error.message);
            throw error;
        }
    }

    async close() {
        try {
            if (this.client) {
                await this.client.close();
                this.isConnected = false;
                console.log('✅ Соединение с MongoDB закрыто');
            }
        } catch (error) {
            console.error('❌ Ошибка при закрытии соединения с MongoDB:', error.message);
        }
    }

    async initializeCollections() {
        try {
            if (!this.db) {
                throw new Error('База данных не подключена');
            }

            console.log('🔧 Инициализация коллекций...');
            console.log('✅ Версия кода: 3.0 - полностью переписана функция инициализации');

            // Список коллекций для создания
            const collections = [
                'users',
                'keys', 
                'miners',
                'transactions',
                'referrals',
                'userTitles',
                'titles',
                'minerTypes'
            ];

            console.log(`📋 Создание ${collections.length} коллекций...`);

            for (const collectionName of collections) {
                try {
                    console.log(`🔍 Обработка коллекции: ${collectionName}`);
                    
                    const collection = this.db.collection(collectionName);
                    
                    // Проверяем, существует ли коллекция
                    const collectionExists = await this.db.listCollections({ name: collectionName }).hasNext();
                    
                    if (!collectionExists) {
                        console.log(`📝 Коллекция ${collectionName} не существует, создаем...`);
                        
                        // Создаем коллекцию через временный документ
                        const tempDoc = { 
                            _temp: true, 
                            createdAt: new Date(),
                            collectionName: collectionName 
                        };
                        
                        await collection.insertOne(tempDoc);
                        console.log(`✅ Временный документ вставлен в ${collectionName}`);
                        
                        await collection.deleteOne(tempDoc);
                        console.log(`✅ Временный документ удален из ${collectionName}`);
                        
                        console.log(`✅ Коллекция ${collectionName} успешно создана`);
                    } else {
                        console.log(`✅ Коллекция ${collectionName} уже существует`);
                    }
                    
                } catch (collectionError) {
                    console.error(`❌ Ошибка при работе с коллекцией ${collectionName}:`, collectionError.message);
                    // Продолжаем с другими коллекциями
                }
            }

            console.log('🔧 Создание индексов...');
            
            // Создаем специальные индексы
            await this.createIndexes();
            
            console.log('✅ Все коллекции инициализированы');
            
        } catch (error) {
            console.error('❌ Критическая ошибка инициализации коллекций:', error.message);
            console.error('🔍 Детали ошибки:', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            console.log('🔧 Начинаем создание индексов...');
            
            // Индексы для users
            console.log('📊 Создание индексов для users...');
            const usersCollection = this.db.collection('users');
            await usersCollection.createIndex({ userId: 1 }, { unique: true, background: true });
            await usersCollection.createIndex({ username: 1 }, { sparse: true, background: true });
            console.log('✅ Индексы для users созданы');

            // Индексы для keys
            console.log('📊 Создание индексов для keys...');
            const keysCollection = this.db.collection('keys');
            await keysCollection.createIndex({ key: 1 }, { unique: true, background: true });
            await keysCollection.createIndex({ isUsed: 1 }, { background: true });
            console.log('✅ Индексы для keys созданы');

            // Индексы для miners
            console.log('📊 Создание индексов для miners...');
            const minersCollection = this.db.collection('miners');
            await minersCollection.createIndex({ userId: 1 }, { background: true });
            await minersCollection.createIndex({ type: 1 }, { background: true });
            console.log('✅ Индексы для miners созданы');

            // Индексы для transactions
            console.log('📊 Создание индексов для transactions...');
            const transactionsCollection = this.db.collection('transactions');
            await transactionsCollection.createIndex({ userId: 1 }, { background: true });
            await transactionsCollection.createIndex({ timestamp: 1 }, { background: true });
            console.log('✅ Индексы для transactions созданы');

            // Индексы для referrals
            console.log('📊 Создание индексов для referrals...');
            const referralsCollection = this.db.collection('referrals');
            await referralsCollection.createIndex({ userId: 1 }, { unique: true, background: true });
            await referralsCollection.createIndex({ referrerId: 1 }, { background: true });
            console.log('✅ Индексы для referrals созданы');

            // Индексы для userTitles
            console.log('📊 Создание индексов для userTitles...');
            const userTitlesCollection = this.db.collection('userTitles');
            await userTitlesCollection.createIndex({ userId: 1 }, { unique: true, background: true });
            console.log('✅ Индексы для userTitles созданы');

            // Индексы для titles
            console.log('📊 Создание индексов для titles...');
            const titlesCollection = this.db.collection('titles');
            await titlesCollection.createIndex({ id: 1 }, { unique: true, background: true });
            console.log('✅ Индексы для titles созданы');

            // Индексы для minerTypes
            console.log('📊 Создание индексов для minerTypes...');
            const minerTypesCollection = this.db.collection('minerTypes');
            await minerTypesCollection.createIndex({ id: 1 }, { unique: true, background: true });
            console.log('✅ Индексы для minerTypes созданы');

            console.log('✅ Все индексы успешно созданы');
            
        } catch (error) {
            console.error('❌ Ошибка создания индексов:', error.message);
            console.error('🔍 Детали ошибки:', error);
            throw error;
        }
    }

    async createDefaultData() {
        try {
            console.log('🔧 Создание данных по умолчанию...');

            // Создаем титулы по умолчанию
            const titlesCollection = this.db.collection('titles');
            const titlesCount = await titlesCollection.countDocuments();
            
            if (titlesCount === 0) {
                const defaultTitles = [
                    {
                        id: 'novice',
                        name: 'Новичок',
                        description: 'Первый титул для новых пользователей',
                        requirements: { level: 1 },
                        isUnlocked: true
                    },
                    {
                        id: 'owner',
                        name: 'Владелец',
                        description: 'Титул для владельцев бота',
                        requirements: { level: 10 },
                        isUnlocked: false
                    }
                ];

                await titlesCollection.insertMany(defaultTitles);
                console.log('✅ Титулы по умолчанию созданы');
            } else {
                console.log(`📊 Найдено ${titlesCount} существующих титулов`);
            }

            // Создаем типы майнеров по умолчанию
            const minerTypesCollection = this.db.collection('minerTypes');
            const minerTypesCount = await minerTypesCollection.countDocuments();
            
            if (minerTypesCount === 0) {
                const defaultMinerTypes = [
                    {
                        id: 'NOVICE',
                        name: 'Новичок',
                        price: 100,
                        priceType: 'coins',
                        rewardType: 'coins',
                        rewardPerMinute: 0.25,
                        rarity: 'common',
                        serverLimit: 100,
                        description: 'Базовый майнер для новичков'
                    },
                    {
                        id: 'STAR_PATH',
                        name: 'Путь к звездам',
                        price: 100,
                        priceType: 'stars',
                        rewardType: 'stars',
                        rewardPerMinute: 0.01,
                        rarity: 'rare',
                        serverLimit: 100,
                        description: 'Майнер для добычи звезд'
                    }
                ];

                await minerTypesCollection.insertMany(defaultMinerTypes);
                console.log('✅ Типы майнеров по умолчанию созданы');
            } else {
                console.log(`📊 Найдено ${minerTypesCount} существующих типов майнеров`);
            }

            console.log('✅ Данные по умолчанию проверены/созданы');
            
        } catch (error) {
            console.error('❌ Ошибка создания данных по умолчанию:', error.message);
            throw error;
        }
    }

    async getDatabaseStats() {
        try {
            if (!this.db) {
                throw new Error('База данных не подключена');
            }

            const stats = {};
            const collections = await this.db.listCollections().toArray();
            
            for (const collection of collections) {
                const collectionName = collection.name;
                const count = await this.db.collection(collectionName).countDocuments();
                stats[collectionName] = count;
            }

            return stats;
        } catch (error) {
            console.error('❌ Ошибка получения статистики базы данных:', error.message);
            throw error;
        }
    }
}

// Экспортируем единственный экземпляр
module.exports = new Database();
