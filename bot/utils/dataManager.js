const database = require('./database');
const logger = require('./logger');

class DataManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (!database.isConnected) {
                throw new Error('База данных не подключена');
            }
            
            this.db = database.getDb();
            this.isInitialized = true;
            
            // Создаем индексы для оптимизации
            await this.createIndexes();
            
            // Создаем начальные данные
            await this.createDefaultData();
            
            logger.info('DataManager успешно инициализирован');
            
        } catch (error) {
            logger.error('Ошибка инициализации DataManager', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            // Создаем коллекции, если их нет
            const collections = ['users', 'transactions', 'settings'];
            for (const collectionName of collections) {
                try {
                    await this.db.createCollection(collectionName);
                    logger.info(`Коллекция ${collectionName} создана`);
                } catch (error) {
                    // Коллекция уже существует
                    logger.info(`Коллекция ${collectionName} уже существует`);
                }
            }
            
            // Индексы для пользователей (только userId, username уже создан в database.js)
            await this.db.collection('users').createIndex({ userId: 1 }, { unique: true });
            // Убираем дублирующий индекс username - он уже создается в database.js
            
            // Индексы для транзакций
            await this.db.collection('transactions').createIndex({ userId: 1 });
            await this.db.collection('transactions').createIndex({ timestamp: -1 });
            
            // Индексы для ключей
            try {
                await this.db.createCollection('keys');
                await this.db.collection('keys').createIndex({ key: 1 }, { unique: true });
                await this.db.collection('keys').createIndex({ isActive: 1 });
            } catch (error) {
                logger.info('Коллекция keys уже существует');
            }
            

            
            logger.info('Индексы созданы');
            
        } catch (error) {
            logger.error('Ошибка создания индексов', error);
        }
    }

    async createDefaultData() {
        try {
            // Создаем системные настройки
            const settingsCollection = this.db.collection('settings');
            const existingSettings = await settingsCollection.findOne({ type: 'system' });
            
            if (!existingSettings) {
                await settingsCollection.insertOne({
                    type: 'system',
                    botStats: {
                        totalUsers: 0,
                        totalStarsWithdrawn: 0,
                        totalCoinsEarned: 0,
                        activeReferrals: 0
                    },
                    exchangeRates: {
                        starToCoin: 10,
                        coinToStar: 0.1
                    },
                    referralRewards: {
                        level1: { stars: 5, coins: 0 },
                        level2: { stars: 3, coins: 0 },
                        level3: { stars: 1, coins: 0 }
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                logger.info('Системные настройки созданы');
            }
            
        } catch (error) {
            logger.error('Ошибка создания начальных данных', error);
        }
    }

    // === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===
    
    async getUser(userId) {
        try {
            const user = await this.db.collection('users').findOne({ userId: Number(userId) });
            
            if (!user) {
                // Создаем нового пользователя
                const newUser = {
                    userId: Number(userId),
                    username: null,
                    firstName: null,
                    lastName: null,
                    balance: {
                        stars: 0,
                        coins: 0,
                        totalEarned: { stars: 0, coins: 0 }
                    },
                    referral: {
                        referralId: null,
                        referrerId: null,
                        totalEarned: { stars: 0, coins: 0 },
                        level: 1,
                        hasReceivedReferralBonus: false
                    },
                    titles: {
                        current: 'novice',
                        unlocked: ['novice'],
                        history: []
                    },
                    miners: [],
                    createdAt: new Date(),
                    lastActivity: new Date()
                };
                
                await this.db.collection('users').insertOne(newUser);
                
                // Обновляем статистику бота
                await this.updateBotStats('totalUsers', 1);
                
                logger.info('Создан новый пользователь', { userId });
                return newUser;
            }
            
            return user;
            
        } catch (error) {
            logger.error('Ошибка получения пользователя', error, { userId });
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            const result = await this.db.collection('users').updateOne(
                { userId: Number(userId) },
                { 
                    $set: { 
                        ...updateData,
                        lastActivity: new Date()
                    }
                }
            );
            
            if (result.modifiedCount > 0) {
                logger.info('Пользователь обновлен', { userId, updateData });
            }
            
            return result;
            
        } catch (error) {
            logger.error('Ошибка обновления пользователя', error, { userId, updateData });
            throw error;
        }
    }

    // === УПРАВЛЕНИЕ БАЛАНСОМ ===
    
    async getUserBalance(userId) {
        try {
            const user = await this.getUser(userId);
            return user.balance;
        } catch (error) {
            logger.error('Ошибка получения баланса пользователя', error, { userId });
            return { stars: 0, coins: 0, totalEarned: { stars: 0, coins: 0 } };
        }
    }
    
    async updateBalance(userId, currency, amount, reason = 'transaction') {
        try {
            logger.info('Начинаем обновление баланса', { userId, currency, amount, reason });
            
            const user = await this.getUser(userId);
            logger.info('Пользователь получен для обновления баланса', { userId, currentBalance: user.balance });
            
            const oldBalance = user.balance[currency] || 0;
            const newBalance = oldBalance + amount;
            
            logger.info('Рассчитываем новый баланс', { userId, currency, oldBalance, amount, newBalance });
            
            // Обновляем баланс
            const updateResult = await this.updateUser(userId, {
                [`balance.${currency}`]: newBalance,
                [`balance.totalEarned.${currency}`]: (user.balance.totalEarned?.[currency] || 0) + (amount > 0 ? amount : 0)
            });
            
            logger.info('Баланс обновлен в базе', { userId, currency, updateResult });
            
            // Записываем транзакцию
            await this.addTransaction(userId, currency, amount, reason, oldBalance, newBalance);
            
            logger.info('Баланс успешно обновлен', { userId, currency, amount, reason, oldBalance, newBalance });
            
            return newBalance;
            
        } catch (error) {
            logger.error('Ошибка обновления баланса', error, { userId, currency, amount, reason });
            throw error;
        }
    }

    async getBalance(userId) {
        try {
            const user = await this.getUser(userId);
            return user.balance;
            
        } catch (error) {
            logger.error('Ошибка получения баланса', error, { userId });
            throw error;
        }
    }

    // === УПРАВЛЕНИЕ ТРАНЗАКЦИЯМИ ===
    
    async addTransaction(userId, currency, amount, reason, oldBalance, newBalance) {
        try {
            const transaction = {
                userId: Number(userId),
                currency,
                amount,
                reason,
                oldBalance,
                newBalance,
                timestamp: new Date()
            };
            
            const result = await this.db.collection('transactions').insertOne(transaction);
            
            if (result.insertedId) {
                logger.info('Транзакция добавлена', { userId, currency, amount, reason, transactionId: result.insertedId });
            } else {
                logger.error('Не удалось добавить транзакцию', { userId, currency, amount, reason });
            }
            
        } catch (error) {
            logger.error('Ошибка добавления транзакции', error, { userId, currency, amount, reason });
        }
    }

    // === УПРАВЛЕНИЕ РЕФЕРАЛАМИ ===
    
    async getUserByReferralId(referralId) {
        try {
            // Ищем пользователя по ID
            const user = await this.db.collection('users').findOne({ userId: Number(referralId) });
            
            if (user) {
                logger.info('Пользователь найден по ID', { referralId, userId: user.userId });
                return user;
            } else {
                logger.warn('Пользователь не найден по ID', { referralId });
                return null;
            }
        } catch (error) {
            logger.error('Ошибка поиска пользователя по ID', error, { referralId });
            return null;
        }
    }
    
    async setupReferral(userId, referrerId = null) {
        try {
            // Сначала получаем или создаем пользователя
            const user = await this.getUser(userId);
            
            // Если у пользователя уже есть referralId, значит система настроена
            if (user.referral && user.referral.referralId) {
                logger.info('Реферальная система уже настроена', { userId, existingReferralId: user.referral.referralId });
                return user.referral;
            }
            
            // Проверяем, получал ли пользователь уже награду за реферальную регистрацию
            if (user.referral && user.referral.hasReceivedReferralBonus) {
                logger.info('Пользователь уже получал награду за реферальную регистрацию', { userId });
                return user.referral;
            }
            
            // Генерируем новый referralId (используем userId пользователя)
            let referralId = userId;
            let actualReferrerId = null;
            
            // Если передан ID реферера, проверяем его существование
            if (referrerId) {
                const referrer = await this.getUser(Number(referrerId));
                if (referrer && referrer.userId !== userId) {
                    actualReferrerId = Number(referrerId);
                    logger.info('Найден реферер по ID', { userId, referrerId: actualReferrerId });
                } else {
                    logger.warn('Реферер не найден или некорректный', { userId, referrerId, referrerFound: !!referrer });
                }
            }
            
            const referralData = {
                referralId: referralId,
                referrerId: actualReferrerId,
                totalEarned: { stars: 0, coins: 0 },
                level: 1,
                hasReceivedReferralBonus: false
            };
            
            // Обновляем реферальные данные пользователя
            await this.updateUser(userId, { referral: referralData });
            
            // Если есть реферер, добавляем пользователя в его список и начисляем награду
            if (actualReferrerId) {
                logger.info('Начинаем начисление наград за реферала', { referrerId: actualReferrerId, newUserId: userId });
                
                await this.addReferralToUser(actualReferrerId, userId);
                
                // Начисляем награду рефереру (5 звезд)
                logger.info('Начисляем награду рефереру', { referrerId: actualReferrerId, reward: 5, currency: 'stars' });
                await this.updateBalance(actualReferrerId, 'stars', 5, 'referral_reward');
                logger.info('Начислена награда за реферала', { referrerId: actualReferrerId, newUserId: userId, reward: 5 });
                
                // Также начисляем награду новому пользователю за регистрацию по реферальному коду
                logger.info('Начисляем бонус новому пользователю', { userId, reward: 1000, currency: 'coins' });
                await this.updateBalance(userId, 'coins', 1000, 'referral_registration_bonus');
                
                // Устанавливаем флаг, что пользователь получил награду
                await this.updateUser(userId, { 'referral.hasReceivedReferralBonus': true });
                
                logger.info('Начислен бонус за регистрацию по реферальному коду', { userId, reward: 1000, currency: 'coins' });
            } else if (referrerId) {
                // Если ID реферера передан, но реферер не найден, все равно начисляем бонус новому пользователю
                // Это нужно для тестирования и чтобы пользователи не теряли бонусы
                logger.info('Реферер не найден, но начисляем бонус новому пользователю', { userId, reward: 1000, currency: 'coins', referrerId });
                await this.updateBalance(userId, 'coins', 1000, 'referral_registration_bonus');
                
                // Устанавливаем флаг, что пользователь получил награду
                await this.updateUser(userId, { 'referral.hasReceivedReferralBonus': true });
                
                logger.info('Начислен бонус за регистрацию по реферальному коду (реферер не найден)', { userId, reward: 1000, currency: 'coins', referrerId });
            }
            
            logger.info('Реферальная система настроена', { userId, referrerId: actualReferrerId, referralId });
            
            return referralData;
            
        } catch (error) {
            logger.error('Ошибка настройки реферальной системы', error, { userId, referrerId });
            throw error;
        }
    }

    async addReferralToUser(referrerId, newUserId) {
        try {
            logger.info('Начинаем добавление реферала к пользователю', { referrerId, newUserId });
            
            // Создаем запись в коллекции referrals
            const referralRecord = {
                userId: Number(newUserId),
                referrerId: Number(referrerId),
                createdAt: new Date(),
                isActive: true,
                reward: 5 // 5 звезд за реферала
            };
            
            // Сохраняем в коллекцию referrals
            await this.db.collection('referrals').insertOne(referralRecord);
            logger.info('Запись о реферале сохранена в коллекции referrals', { referrerId, newUserId, referralId: referralRecord._id });
            
            // Обновляем статистику реферера в коллекции users
            const referrer = await this.getUser(referrerId);
            const currentEarned = referrer.referral.totalEarned || { stars: 0, coins: 0 };
            const newEarned = {
                stars: currentEarned.stars + 5, // 5 звезд за реферала
                coins: currentEarned.coins
            };
            
            logger.info('Обновляем общий заработок реферера', { referrerId, currentEarned, newEarned });
            await this.updateUser(referrerId, {
                'referral.totalEarned': newEarned
            });
            
            logger.info('Реферал успешно добавлен к пользователю', { referrerId, newUserId, newEarned });
            

            
        } catch (error) {
            logger.error('Ошибка добавления реферала', error, { referrerId, newUserId });
        }
    }



    async getReferralStats(userId) {
        try {
            const user = await this.getUser(userId);
            
            // Получаем рефералов из коллекции referrals
            const referrals = await this.db.collection('referrals')
                .find({ referrerId: Number(userId) })
                .toArray();
            
            logger.info('Получены рефералы из коллекции referrals', { userId, referralsCount: referrals.length });
            
            // Убеждаемся, что userId - это число
            const numericUserId = Number(userId);
            
            return {
                referralId: numericUserId, // ID пользователя для реферальной ссылки
                totalReferrals: referrals.length,
                activeReferrals: referrals.filter(r => r.isActive).length,
                totalEarned: user.referral.totalEarned || { stars: 0, coins: 0 },
                level: user.referral.level || 1,
                referrals: referrals
            };
            
        } catch (error) {
            logger.error('Ошибка получения реферальной статистики', error, { userId });
            
            return {
                referralId: Number(userId),
                totalReferrals: 0,
                activeReferrals: 0,
                totalEarned: { stars: 0, coins: 0 },
                level: 1,
                referrals: []
            };
        }
    }



    // === УПРАВЛЕНИЕ ТИТУЛАМИ ===
    
    async getCurrentTitle(userId) {
        try {
            const user = await this.getUser(userId);
            return user.titles.current;
            
        } catch (error) {
            logger.error('Ошибка получения текущего титула', error, { userId });
            throw error;
        }
    }

    async unlockTitle(userId, titleId) {
        try {
            const user = await this.getUser(userId);
            const unlockedTitles = [...user.titles.unlocked];
            
            if (!unlockedTitles.includes(titleId)) {
                unlockedTitles.push(titleId);
                
                await this.updateUser(userId, {
                    'titles.unlocked': unlockedTitles,
                    'titles.history': [...user.titles.history, {
                        titleId,
                        timestamp: new Date(),
                        action: 'unlock'
                    }]
                });
                
                logger.info('Титул разблокирован', { userId, titleId });
            }
            
            return unlockedTitles;
            
        } catch (error) {
            logger.error('Ошибка разблокировки титула', error, { userId, titleId });
            throw error;
        }
    }

    // === СТАТИСТИКА БОТА ===
    
    async getBotStats() {
        try {
            const settings = await this.db.collection('settings').findOne({ type: 'system' });
            return settings ? settings.botStats : {
                totalUsers: 0,
                totalStarsWithdrawn: 0,
                totalCoinsEarned: 0,
                activeReferrals: 0
            };
            
        } catch (error) {
            logger.error('Ошибка получения статистики бота', error);
            return {
                totalUsers: 0,
                totalStarsWithdrawn: 0,
                totalCoinsEarned: 0,
                activeReferrals: 0
            };
        }
    }

    async updateBotStats(field, value) {
        try {
            await this.db.collection('settings').updateOne(
                { type: 'system' },
                { 
                    $inc: { [`botStats.${field}`]: value },
                    $set: { updatedAt: new Date() }
                }
            );
            
            logger.info('Статистика бота обновлена', { field, value });
            
        } catch (error) {
            logger.error('Ошибка обновления статистики бота', error, { field, value });
        }
    }

    // === ОБЩАЯ СТАТИСТИКА ===
    
    async getTotalUsers() {
        try {
            const count = await this.db.collection('users').countDocuments();
            return count;
            
        } catch (error) {
            logger.error('Ошибка получения количества пользователей', error);
            return 0;
        }
    }

    async getTotalStarsWithdrawn() {
        try {
            const result = await this.db.collection('transactions').aggregate([
                { $match: { currency: 'stars', amount: { $lt: 0 } } },
                { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
            ]).toArray();
            
            return result.length > 0 ? result[0].total : 0;
            
        } catch (error) {
            logger.error('Ошибка получения общего количества выведенных звезд', error);
            return 0;
        }
    }

    

    // === УПРАВЛЕНИЕ МАЙНЕРАМИ ===
    
    // Покупка майнера
    async buyMiner(userId, minerType) {
        try {
            logger.info('Начинаем покупку майнера', { userId, minerType });
            
            // Получаем информацию о майнере
            const minerInfo = this.getMinerInfo(minerType);
            if (!minerInfo) {
                throw new Error('Майнер не найден');
            }
            
            // Получаем пользователя
            const user = await this.getUser(userId);
            
            // Проверяем, хватает ли средств
            const canAfford = (user.balance.coins >= minerInfo.price.coins) && 
                             (user.balance.stars >= minerInfo.price.stars);
            
            if (!canAfford) {
                throw new Error('Недостаточно средств для покупки майнера');
            }
            
            // Списываем средства
            if (minerInfo.price.coins > 0) {
                await this.updateBalance(userId, 'coins', -minerInfo.price.coins, 'miner_purchase');
            }
            if (minerInfo.price.stars > 0) {
                await this.updateBalance(userId, 'stars', -minerInfo.price.stars, 'miner_purchase');
            }
            
            // Создаем майнер
            const miner = {
                id: this.generateMinerId(),
                type: minerType,
                name: minerInfo.name,
                speed: minerInfo.speed,
                rarity: minerInfo.rarity,
                purchaseDate: new Date(),
                lastCollection: new Date(),
                isActive: true,
                level: 1,
                experience: 0
            };
            
            // Добавляем майнер пользователю
            const userMiners = user.miners || [];
            userMiners.push(miner);
            
            await this.updateUser(userId, { miners: userMiners });
            
            logger.info('Майнер успешно куплен', { userId, minerType, minerId: miner.id });
            
            return miner;
            
        } catch (error) {
            logger.error('Ошибка покупки майнера', error, { userId, minerType });
            throw error;
        }
    }
    
    // Получение майнеров пользователя
    async getUserMiners(userId) {
        try {
            const user = await this.getUser(userId);
            return user.miners || [];
            
        } catch (error) {
            logger.error('Ошибка получения майнеров пользователя', error, { userId });
            return [];
        }
    }
    
    // Сбор дохода от майнеров
    async collectMiningIncome(userId) {
        try {
            logger.info('Начинаем сбор дохода от майнеров', { userId });
            
            const user = await this.getUser(userId);
            const miners = user.miners || [];
            
            if (miners.length === 0) {
                return { coins: 0, stars: 0, message: 'У вас нет майнеров для сбора дохода' };
            }
            
            let totalCoins = 0;
            let totalStars = 0;
            const now = new Date();
            
            // Рассчитываем доход для каждого майнера
            for (const miner of miners) {
                if (!miner.isActive) continue;
                
                const timeDiff = now - new Date(miner.lastCollection);
                const minutesPassed = Math.floor(timeDiff / (1000 * 60));
                
                if (minutesPassed >= 10) { // Сбор каждые 10 минут
                    const coinsEarned = (miner.speed.coins * minutesPassed) / 10;
                    const starsEarned = (miner.speed.stars * minutesPassed) / 10;
                    
                    totalCoins += coinsEarned;
                    totalStars += starsEarned;
                    
                    // Обновляем время последнего сбора
                    miner.lastCollection = now;
                }
            }
            
            // Начисляем доход
            if (totalCoins > 0) {
                await this.updateBalance(userId, 'coins', totalCoins, 'mining_income');
            }
            if (totalStars > 0) {
                await this.updateBalance(userId, 'stars', totalStars, 'mining_income');
            }
            
            // Обновляем майнеры пользователя
            await this.updateUser(userId, { miners: miners });
            
            logger.info('Доход от майнеров собран', { userId, totalCoins, totalStars });
            
            return { 
                coins: totalCoins, 
                stars: totalStars, 
                message: `Собрано: ${totalCoins.toFixed(2)} 🪙, ${totalStars.toFixed(2)} ⭐` 
            };
            
        } catch (error) {
            logger.error('Ошибка сбора дохода от майнеров', error, { userId });
            throw error;
        }
    }
    
    // Получение информации о майнере
    getMinerInfo(minerType) {
        const miners = {
            'novice': {
                id: 'novice',
                name: 'Новичок',
                price: { coins: 100, stars: 0 },
                speed: { coins: 0.25, stars: 0 },
                rarity: 'Обычный',
                available: 100
            },
            'star_path': {
                id: 'star_path',
                name: 'Путь к звездам',
                price: { coins: 0, stars: 100 },
                speed: { coins: 0, stars: 0.01 },
                rarity: 'Редкий',
                available: 100
            }
        };
        
        return miners[minerType];
    }
    
    // Генерация уникального ID для майнера
    generateMinerId() {
        return 'miner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Создаем и экспортируем экземпляр
const dataManager = new DataManager();

module.exports = dataManager;
