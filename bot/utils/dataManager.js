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
                    subscription: {
                        isConfirmed: false,
                        confirmedAt: null
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
                lastMiningStart: null, // Время последнего запуска майнинга
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
    
    // Запуск майнинга (раз в 4 часа)
    async startMining(userId) {
        try {
            logger.info('Попытка запуска майнинга', { userId });
            
            const user = await this.getUser(userId);
            const miners = user.miners || [];
            
            if (miners.length === 0) {
                return { success: false, message: 'У вас нет майнеров для запуска майнинга' };
            }
            
            const now = new Date();
            let canStartMining = false;
            let nextStartTime = null;
            
            // Проверяем, можно ли запустить майнинг
            for (const miner of miners) {
                if (!miner.isActive) continue;
                
                if (!miner.lastMiningStart) {
                    canStartMining = true;
                    break;
                }
                
                const timeSinceLastStart = now - new Date(miner.lastMiningStart);
                const hoursSinceLastStart = timeSinceLastStart / (1000 * 60 * 60);
                
                if (hoursSinceLastStart >= 4) {
                    canStartMining = true;
                    break;
                } else {
                    const remainingHours = 4 - hoursSinceLastStart;
                    const nextStart = new Date(miner.lastMiningStart);
                    nextStart.setHours(nextStart.getHours() + 4);
                    nextStartTime = nextStart;
                }
            }
            
            if (!canStartMining) {
                return { 
                    success: false, 
                    message: `Майнинг можно запустить через ${Math.ceil((nextStartTime - now) / (1000 * 60 * 60))} часов`,
                    nextStartTime: nextStartTime
                };
            }
            
            // Запускаем майнинг для всех активных майнеров
            for (const miner of miners) {
                if (miner.isActive) {
                    miner.lastMiningStart = now;
                }
            }
            
            // Обновляем майнеры пользователя
            await this.updateUser(userId, { miners: miners });
            
            logger.info('Майнинг успешно запущен', { userId, startTime: now });
            
            return { 
                success: true, 
                message: 'Майнинг запущен! Доход будет начисляться каждую минуту автоматически.',
                startTime: now
            };
            
        } catch (error) {
            logger.error('Ошибка запуска майнинга', error, { userId });
            throw error;
        }
    }
    
    // Автоматическое начисление дохода каждую минуту (вызывается системой)
    async processMiningIncome(userId) {
        try {
            const user = await this.getUser(userId);
            const miners = user.miners || [];
            
            if (miners.length === 0) {
                return { coins: 0, stars: 0 };
            }
            
            let totalCoins = 0;
            let totalStars = 0;
            const now = new Date();
            
            // Рассчитываем доход для каждого майнера
            for (const miner of miners) {
                if (!miner.isActive || !miner.lastMiningStart) continue;
                
                // Проверяем, что майнинг был запущен менее 4 часов назад
                const timeSinceMiningStart = now - new Date(miner.lastMiningStart);
                const hoursSinceStart = timeSinceMiningStart / (1000 * 60 * 60);
                
                if (hoursSinceStart < 4) {
                    // Начисляем доход за последнюю минуту
                    const coinsEarned = miner.speed.coins / 60; // Доход в минуту
                    const starsEarned = miner.speed.stars / 60; // Доход в минуту
                    
                    totalCoins += coinsEarned;
                    totalStars += starsEarned;
                }
            }
            
            // Начисляем доход
            if (totalCoins > 0) {
                await this.updateBalance(userId, 'coins', totalCoins, 'mining_income_auto');
            }
            if (totalStars > 0) {
                await this.updateBalance(userId, 'stars', totalStars, 'mining_income_auto');
            }
            
            logger.info('Автоматический доход от майнинга начислен', { userId, totalCoins, totalStars });
            
            return { coins: totalCoins, stars: totalStars };
            
        } catch (error) {
            logger.error('Ошибка автоматического начисления дохода', error, { userId });
            return { coins: 0, stars: 0 };
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
    
    // Создание заявки на вывод звезд
    async createWithdrawalRequest(userId, amount) {
        try {
            logger.info('Создание заявки на вывод звезд', { userId, amount });
            
            // Проверяем баланс пользователя
            const user = await this.getUser(userId);
            if (user.balance.stars < amount) {
                return { success: false, message: 'Недостаточно звезд для вывода' };
            }
            
            // Проверяем минимальную сумму
            if (amount < 50) {
                return { success: false, message: 'Минимальная сумма для вывода: 50 ⭐ Stars' };
            }
            
            // Создаем заявку
            const withdrawalRequest = {
                id: this.generateWithdrawalId(),
                userId: Number(userId),
                username: user.username || 'Не указан',
                firstName: user.firstName || 'Не указано',
                amount: amount,
                status: 'pending', // pending, approved, rejected
                createdAt: new Date(),
                processedAt: null,
                processedBy: null,
                comment: ''
            };
            
            // Сохраняем заявку в базе
            await this.db.collection('withdrawals').insertOne(withdrawalRequest);
            
            // Резервируем звезды (вычитаем из баланса)
            await this.updateBalance(userId, 'stars', -amount, 'withdrawal_request');
            
            logger.info('Заявка на вывод создана', { userId, amount, requestId: withdrawalRequest.id });
            
            return { 
                success: true, 
                message: 'Заявка на вывод создана успешно',
                requestId: withdrawalRequest.id,
                request: withdrawalRequest
            };
            
        } catch (error) {
            logger.error('Ошибка создания заявки на вывод', error, { userId, amount });
            throw error;
        }
    }
    
    // Получение заявок на вывод (для админов)
    async getWithdrawalRequests(status = 'pending') {
        try {
            const requests = await this.db.collection('withdrawals')
                .find({ status: status })
                .sort({ createdAt: -1 })
                .toArray();
            
            return requests;
            
        } catch (error) {
            logger.error('Ошибка получения заявок на вывод', error);
            return [];
        }
    }
    
    // Обработка заявки на вывод (одобрение/отклонение)
    async processWithdrawalRequest(requestId, action, adminId, comment = '') {
        try {
            logger.info('Обработка заявки на вывод', { requestId, action, adminId, comment });
            
            const request = await this.db.collection('withdrawals').findOne({ id: requestId });
            if (!request) {
                return { success: false, message: 'Заявка не найдена' };
            }
            
            if (request.status !== 'pending') {
                return { success: false, message: 'Заявка уже обработана' };
            }
            
            const updateData = {
                status: action === 'approve' ? 'approved' : 'rejected',
                processedAt: new Date(),
                processedBy: Number(adminId),
                comment: comment
            };
            
            // Обновляем статус заявки
            await this.db.collection('withdrawals').updateOne(
                { id: requestId },
                { $set: updateData }
            );
            
            if (action === 'reject') {
                // Возвращаем звезды пользователю при отклонении
                await this.updateBalance(request.userId, 'stars', request.amount, 'withdrawal_rejected');
                logger.info('Звезды возвращены пользователю при отклонении заявки', { 
                    userId: request.userId, 
                    amount: request.amount 
                });
            }
            
            logger.info('Заявка на вывод обработана', { requestId, action, adminId });
            
            return { 
                success: true, 
                message: `Заявка ${action === 'approve' ? 'одобрена' : 'отклонена'}`,
                request: { ...request, ...updateData }
            };
            
        } catch (error) {
            logger.error('Ошибка обработки заявки на вывод', error, { requestId, action, adminId });
            throw error;
        }
    }
    
    // Генерация уникального ID для заявки на вывод
    generateWithdrawalId() {
        return 'wd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Проверка подписки пользователя на канал
    async checkUserSubscription(userId, channelUsername = '@magnumtap') {
        try {
            logger.info('Проверка подписки пользователя', { userId, channelUsername });
            
            // Получаем информацию о пользователе
            const user = await this.getUser(userId);
            
            // Если пользователь уже подтвердил подписку, возвращаем true
            if (user.subscription && user.subscription.isConfirmed) {
                return { 
                    success: true, 
                    isSubscribed: true, 
                    message: 'Подписка подтверждена' 
                };
            }
            
            // Проверяем, подписан ли пользователь на канал
            // В реальном боте здесь будет вызов Telegram API
            // Пока что возвращаем false для демонстрации
            const isSubscribed = false; // Заглушка
            
            if (isSubscribed) {
                // Обновляем статус подписки
                await this.updateUser(userId, {
                    'subscription.isConfirmed': true,
                    'subscription.confirmedAt': new Date()
                });
                
                logger.info('Подписка пользователя подтверждена', { userId });
                
                return { 
                    success: true, 
                    isSubscribed: true, 
                    message: 'Подписка подтверждена' 
                };
            } else {
                return { 
                    success: false, 
                    isSubscribed: false, 
                    message: 'Вы не подписаны на канал' 
                };
            }
            
        } catch (error) {
            logger.error('Ошибка проверки подписки', error, { userId });
            return { 
                success: false, 
                isSubscribed: false, 
                message: 'Ошибка проверки подписки' 
            };
        }
    }
    
    // Установка статуса подписки (для ручной проверки админом)
    async setSubscriptionStatus(userId, isConfirmed) {
        try {
            const updateData = {
                'subscription.isConfirmed': isConfirmed,
                'subscription.confirmedAt': isConfirmed ? new Date() : null
            };
            
            await this.updateUser(userId, updateData);
            
            logger.info('Статус подписки обновлен', { userId, isConfirmed });
            
            return { success: true };
            
        } catch (error) {
            logger.error('Ошибка обновления статуса подписки', error, { userId });
            throw error;
        }
    }
    
    // Проверка, может ли пользователь использовать бота
    async canUserUseBot(userId) {
        try {
            const user = await this.getUser(userId);
            return user.subscription && user.subscription.isConfirmed;
        } catch (error) {
            logger.error('Ошибка проверки доступа пользователя к боту', error, { userId });
            return false;
        }
    }
    
    // === УПРАВЛЕНИЕ ТИТУЛАМИ ===
    
    // Получение информации о титуле
    getTitleInfo(titleId) {
        const titles = {
            novice: {
                id: 'novice',
                name: 'Новичок',
                description: 'Первый титул для новых пользователей',
                rarity: 'Обычный',
                requirements: { level: 1, stars: 0, coins: 0 },
                bonuses: { stars: 0, coins: 0 }
            },
            miner: {
                id: 'miner',
                name: 'Майнер',
                description: 'Титул для активных майнеров',
                rarity: 'Обычный',
                requirements: { level: 5, stars: 100, coins: 500 },
                bonuses: { stars: 5, coins: 10 }
            },
            trader: {
                id: 'trader',
                name: 'Трейдер',
                description: 'Титул для опытных трейдеров',
                rarity: 'Редкий',
                requirements: { level: 10, stars: 500, coins: 1000 },
                bonuses: { stars: 15, coins: 25 }
            },
            investor: {
                id: 'investor',
                name: 'Инвестор',
                description: 'Титул для крупных инвесторов',
                rarity: 'Эпический',
                requirements: { level: 20, stars: 1000, coins: 5000 },
                bonuses: { stars: 30, coins: 50 }
            },
            master: {
                id: 'master',
                name: 'Мастер',
                description: 'Титул для мастеров своего дела',
                rarity: 'Легендарный',
                requirements: { level: 30, stars: 2500, coins: 10000 },
                bonuses: { stars: 50, coins: 100 }
            },
            legend: {
                id: 'legend',
                name: 'Легенда',
                description: 'Титул для легендарных игроков',
                rarity: 'Мифический',
                requirements: { level: 50, stars: 5000, coins: 25000 },
                bonuses: { stars: 100, coins: 200 }
            },
            owner: {
                id: 'owner',
                name: 'Владелец',
                description: 'Эксклюзивный титул владельца бота',
                rarity: 'Эксклюзивный',
                requirements: { level: 100, stars: 10000, coins: 50000 },
                bonuses: { stars: 200, coins: 500 },
                adminOnly: true
            }
        };
        
        return titles[titleId] || null;
    }
    
    // Выдача титула пользователю
    async grantTitle(userId, titleId, adminId) {
        try {
            const user = await this.getUser(userId);
            const titleInfo = this.getTitleInfo(titleId);
            
            if (!titleInfo) {
                return { success: false, message: 'Титул не найден' };
            }
            
            // Проверяем, есть ли уже этот титул
            if (user.titles.unlocked.includes(titleId)) {
                return { success: false, message: 'У пользователя уже есть этот титул' };
            }
            
            // Обновляем титулы пользователя
            const updateData = {
                'titles.unlocked': [...user.titles.unlocked, titleId],
                'titles.history': [...user.titles.history, {
                    titleId: titleId,
                    grantedAt: new Date(),
                    grantedBy: adminId,
                    reason: 'Выдан администратором'
                }]
            };
            
            // Если это первый титул, устанавливаем его как текущий
            if (user.titles.unlocked.length === 1 && user.titles.unlocked[0] === 'novice') {
                updateData['titles.current'] = titleId;
            }
            
            await this.updateUser(userId, updateData);
            
            logger.info('Титул выдан пользователю', { userId, titleId, adminId });
            
            return { 
                success: true, 
                message: `Титул "${titleInfo.name}" успешно выдан пользователю`,
                titleInfo: titleInfo
            };
            
        } catch (error) {
            logger.error('Ошибка выдачи титула', error, { userId, titleId, adminId });
            throw error;
        }
    }
    
    // Забирание титула у пользователя
    async revokeTitle(userId, titleId, adminId) {
        try {
            const user = await this.getUser(userId);
            const titleInfo = this.getTitleInfo(titleId);
            
            if (!titleInfo) {
                return { success: false, message: 'Титул не найден' };
            }
            
            // Проверяем, есть ли у пользователя этот титул
            if (!user.titles.unlocked.includes(titleId)) {
                return { success: false, message: 'У пользователя нет этого титула' };
            }
            
            // Нельзя забрать титул "Новичок"
            if (titleId === 'novice') {
                return { success: false, message: 'Нельзя забрать титул "Новичок"' };
            }
            
            // Нельзя забрать титул "Владелец" у владельца
            if (titleId === 'owner' && user.isAdmin) {
                return { success: false, message: 'Нельзя забрать титул "Владелец" у владельца' };
            }
            
            // Обновляем титулы пользователя
            const newUnlocked = user.titles.unlocked.filter(id => id !== titleId);
            const updateData = {
                'titles.unlocked': newUnlocked,
                'titles.history': [...user.titles.history, {
                    titleId: titleId,
                    revokedAt: new Date(),
                    revokedBy: adminId,
                    reason: 'Забран администратором'
                }]
            };
            
            // Если текущий титул был забран, устанавливаем "Новичок" как текущий
            if (user.titles.current === titleId) {
                updateData['titles.current'] = 'novice';
            }
            
            await this.updateUser(userId, updateData);
            
            logger.info('Титул забран у пользователя', { userId, titleId, adminId });
            
            return { 
                success: true, 
                message: `Титул "${titleInfo.name}" успешно забран у пользователя`,
                titleInfo: titleInfo
            };
            
        } catch (error) {
            logger.error('Ошибка забирания титула', error, { userId, titleId, adminId });
            throw error;
        }
    }
    
    // Получение титулов пользователя
    async getUserTitles(userId) {
        try {
            const user = await this.getUser(userId);
            const unlockedTitles = [];
            
            for (const titleId of user.titles.unlocked) {
                const titleInfo = this.getTitleInfo(titleId);
                if (titleInfo) {
                    unlockedTitles.push({
                        ...titleInfo,
                        isCurrent: user.titles.current === titleId
                    });
                }
            }
            
            return {
                current: user.titles.current,
                unlocked: unlockedTitles,
                history: user.titles.history || []
            };
            
        } catch (error) {
            logger.error('Ошибка получения титулов пользователя', error, { userId });
            return { current: 'novice', unlocked: [], history: [] };
        }
    }
    
    // === УПРАВЛЕНИЕ КЛЮЧАМИ ===
    
    // Создание нового ключа
    async createKey(keyData) {
        try {
            const key = {
                key: keyData.key,
                type: keyData.type, // 'stars', 'coins'
                reward: keyData.reward,
                maxUses: keyData.maxUses,
                currentUses: 0,
                createdAt: new Date(),
                createdBy: keyData.createdBy,
                isActive: true
            };
            
            await this.db.collection('keys').insertOne(key);
            
            logger.info('Ключ создан в базе данных', { 
                key: key.key.substring(0, 6) + '...', 
                type: key.type,
                reward: key.reward,
                maxUses: key.maxUses 
            });
            
            return { success: true, key: key };
            
        } catch (error) {
            logger.error('Ошибка создания ключа в базе данных', error, { keyData });
            throw error;
        }
    }
    
    // Активация ключа
    async activateKey(key, userId) {
        try {
            // Находим ключ в базе данных
            const keyDoc = await this.db.collection('keys').findOne({ 
                key: key, 
                isActive: true 
            });
            
            if (!keyDoc) {
                return { success: false, message: 'Ключ не найден или неактивен' };
            }
            
            // Проверяем, не превышено ли количество использований
            if (keyDoc.currentUses >= keyDoc.maxUses) {
                return { success: false, message: 'Ключ уже использован максимальное количество раз' };
            }
            
            // Проверяем, не активировал ли пользователь этот ключ ранее
            const activationRecord = await this.db.collection('key_activations').findOne({
                key: key,
                userId: Number(userId)
            });
            
            if (activationRecord) {
                return { success: false, message: 'Вы уже активировали этот ключ' };
            }
            
            // Начисляем награду пользователю
            let rewardText = [];
            
            if (keyDoc.type === 'stars' && keyDoc.reward.stars > 0) {
                await this.updateBalance(userId, 'stars', keyDoc.reward.stars, 'key_activation');
                rewardText.push(`⭐ Stars: +${keyDoc.reward.stars}`);
            }
            
            if (keyDoc.type === 'coins' && keyDoc.reward.coins > 0) {
                await this.updateBalance(userId, 'coins', keyDoc.reward.coins, 'key_activation');
                rewardText.push(`🪙 Magnum Coins: +${keyDoc.reward.coins}`);
            }
            
            // Увеличиваем счетчик использований ключа
            await this.db.collection('keys').updateOne(
                { key: key },
                { $inc: { currentUses: 1 } }
            );
            
            // Записываем активацию ключа
            await this.db.collection('key_activations').insertOne({
                key: key,
                userId: Number(userId),
                activatedAt: new Date(),
                reward: keyDoc.reward
            });
            
            logger.info('Ключ успешно активирован', { 
                key: key.substring(0, 6) + '...', 
                userId, 
                reward: keyDoc.reward 
            });
            
            return {
                success: true,
                type: keyDoc.type,
                reward: keyDoc.reward,
                message: 'Ключ успешно активирован!',
                rewardText: rewardText
            };
            
        } catch (error) {
            logger.error('Ошибка активации ключа', error, { key: key.substring(0, 6) + '...', userId });
            throw error;
        }
    }
    
    // Получение статистики ключей
    async getKeysStats() {
        try {
            const totalKeys = await this.db.collection('keys').countDocuments();
            const activeKeys = await this.db.collection('keys').countDocuments({ isActive: true });
            const totalActivations = await this.db.collection('key_activations').countDocuments();
            
            return {
                totalKeys,
                activeKeys,
                totalActivations
            };
            
        } catch (error) {
            logger.error('Ошибка получения статистики ключей', error);
            return { totalKeys: 0, activeKeys: 0, totalActivations: 0 };
        }
    }
}

// Создаем и экспортируем экземпляр
const dataManager = new DataManager();

module.exports = dataManager;
