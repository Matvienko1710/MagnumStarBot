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
            const uri = process.env.MONGODB_URI;
            if (!uri) {
                throw new Error('MONGODB_URI не установлена в переменных окружения');
            }

            // Пробуем разные конфигурации подключения
            const connectionConfigs = [
                // Конфигурация 1: Без SSL
                {
                    serverApi: { version: '1', strict: true, deprecationErrors: true },
                    ssl: false,
                    tls: false,
                    retryWrites: true,
                    w: 'majority',
                    maxPoolSize: 5,
                    connectTimeoutMS: 30000,
                    socketTimeoutMS: 45000,
                    serverSelectionTimeoutMS: 30000,
                },
                // Конфигурация 2: С SSL но без проверки сертификатов
                {
                    serverApi: { version: '1', strict: true, deprecationErrors: true },
                    ssl: true,
                    tls: true,
                    tlsAllowInvalidCertificates: true,
                    tlsAllowInvalidHostnames: true,
                    retryWrites: true,
                    w: 'majority',
                    maxPoolSize: 5,
                    connectTimeoutMS: 30000,
                    socketTimeoutMS: 45000,
                    serverSelectionTimeoutMS: 30000,
                },
                // Конфигурация 3: Минимальная конфигурация
                {
                    serverApi: { version: '1', strict: true, deprecationErrors: true },
                    retryWrites: true,
                    w: 'majority',
                    maxPoolSize: 5,
                    connectTimeoutMS: 30000,
                    socketTimeoutMS: 45000,
                }
            ];

            let lastError = null;

            for (let i = 0; i < connectionConfigs.length; i++) {
                const config = connectionConfigs[i];
                try {
                    console.log(`🔧 Попытка подключения с конфигурацией ${i + 1}:`, {
                        ssl: config.ssl,
                        tls: config.tls,
                        tlsAllowInvalidCertificates: config.tlsAllowInvalidCertificates
                    });

                    this.client = new MongoClient(uri, config);
                    await this.client.connect();
                    this.db = this.client.db();
                    this.isConnected = true;
                    
                    console.log(`✅ Успешно подключено с конфигурацией ${i + 1}`);
                    
                    // Тестируем подключение
                    await this.ping();
                    return;
                    
                } catch (error) {
                    console.error(`❌ Ошибка с конфигурацией ${i + 1}:`, error.message);
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
                    if (i < connectionConfigs.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            // Если все конфигурации не сработали
            throw lastError || new Error('Не удалось подключиться ни с одной конфигурацией');
            
        } catch (error) {
            console.error('❌ Ошибка подключения к MongoDB Atlas:', error.message);
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
            
            await this.client.db('admin').command({ ping: 1 });
            console.log('✅ Ping к MongoDB успешен');
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

            // Создаем коллекции и индексы
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

            for (const collectionName of collections) {
                const collection = this.db.collection(collectionName);
                
                // Создаем коллекцию если её нет
                await collection.createIndex({}, { background: true });
                
                console.log(`✅ Коллекция ${collectionName} инициализирована`);
            }

            // Создаем специальные индексы
            await this.createIndexes();
            
            console.log('✅ Все коллекции инициализированы');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации коллекций:', error.message);
            throw error;
        }
    }

    async createIndexes() {
        try {
            // Индексы для users
            const usersCollection = this.db.collection('users');
            await usersCollection.createIndex({ userId: 1 }, { unique: true, background: true });
            await usersCollection.createIndex({ username: 1 }, { sparse: true, background: true });

            // Индексы для keys
            const keysCollection = this.db.collection('keys');
            await keysCollection.createIndex({ key: 1 }, { unique: true, background: true });
            await keysCollection.createIndex({ isUsed: 1 }, { background: true });

            // Индексы для miners
            const minersCollection = this.db.collection('miners');
            await minersCollection.createIndex({ userId: 1 }, { background: true });
            await minersCollection.createIndex({ type: 1 }, { background: true });

            // Индексы для transactions
            const transactionsCollection = this.db.collection('transactions');
            await transactionsCollection.createIndex({ userId: 1 }, { background: true });
            await transactionsCollection.createIndex({ timestamp: 1 }, { background: true });

            // Индексы для referrals
            const referralsCollection = this.db.collection('referrals');
            await referralsCollection.createIndex({ userId: 1 }, { unique: true, background: true });
            await referralsCollection.createIndex({ referrerId: 1 }, { background: true });

            // Индексы для userTitles
            const userTitlesCollection = this.db.collection('userTitles');
            await userTitlesCollection.createIndex({ userId: 1 }, { unique: true, background: true });

            // Индексы для titles
            const titlesCollection = this.db.collection('titles');
            await titlesCollection.createIndex({ id: 1 }, { unique: true, background: true });

            // Индексы для minerTypes
            const minerTypesCollection = this.db.collection('minerTypes');
            await minerTypesCollection.createIndex({ id: 1 }, { unique: true, background: true });

            console.log('✅ Все индексы созданы');
            
        } catch (error) {
            console.error('❌ Ошибка создания индексов:', error.message);
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
            }

            console.log('✅ Данные по умолчанию созданы');
            
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
