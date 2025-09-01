const database = require('./database');
const logger = require('./logger');
const { MINER_TYPES } = require('./miners');

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
            
            // Создаем коллекцию для отслеживания активности пользователей
            await this.createUserActivityCollection();
            
            // Запускаем проверку пропущенных наград в фоновом режиме (неблокирующе)
            logger.info('⛏️ Запускаем проверку пропущенных наград в фоновом режиме...');
            setImmediate(async () => {
            try {
                logger.info('🔍 Вызываем processAllMissedMiningRewards...');
                const missedRewardsResult = await this.processAllMissedMiningRewards();
                logger.info('📊 Результат processAllMissedMiningRewards получен:', missedRewardsResult);
                
                if (missedRewardsResult.success) {
                    logger.info('✅ Проверка пропущенных наград завершена успешно', missedRewardsResult);
                } else {
                    logger.error('❌ Ошибка проверки пропущенных наград', missedRewardsResult.error);
                }
            } catch (missedRewardsError) {
                logger.error('💥 Ошибка при проверке пропущенных наград', missedRewardsError);
            }
            });
            
            logger.info('DataManager успешно инициализирован');
            
            // Запускаем автоматическое начисление дохода от майнинга каждую минуту
            this.startMiningIncomeScheduler();
            
            // Запускаем планировщик активных рефералов
            this.startActiveReferralsScheduler();
            
        } catch (error) {
            logger.error('Ошибка инициализации DataManager', error);
            throw error;
        }
    }
    
    // Запуск планировщика автоматического дохода от майнинга
    startMiningIncomeScheduler() {
        try {
            logger.info('🚀 Запускаем планировщик автоматического дохода от майнинга...');
            
            // Запускаем каждую минуту (60000 мс)
            this.miningIncomeInterval = setInterval(async () => {
                try {
                    await this.processAllUsersMiningIncome();
                } catch (error) {
                    logger.error('❌ Ошибка в планировщике автоматического дохода', error);
                }
            }, 60000); // 1 минута
            
            logger.info('✅ Планировщик автоматического дохода запущен (интервал: 1 минута)');
            
        } catch (error) {
            logger.error('❌ Ошибка запуска планировщика автоматического дохода', error);
        }
    }
    
    // Обработка автоматического дохода для всех пользователей
    async processAllUsersMiningIncome() {
        try {
            logger.info('⏰ Запуск автоматического начисления дохода от майнинга...');
            
            // Получаем всех пользователей с майнерами
            const usersWithMiners = await this.db.collection('users').find({
                'miners.0': { $exists: true } // У пользователя есть хотя бы один майнер
            }).toArray();
            
            logger.info(`🔍 Найдено пользователей с майнерами: ${usersWithMiners.length}`);
            
            let totalUsersProcessed = 0;
            let totalCoinsAwarded = 0;
            let totalStarsAwarded = 0;
            
            // Обрабатываем каждого пользователя
            for (const user of usersWithMiners) {
                try {
                    const result = await this.processMiningIncome(user.userId);
                    
                    if (result.coins > 0 || result.stars > 0) {
                        totalUsersProcessed++;
                        totalCoinsAwarded += result.coins;
                        totalStarsAwarded += result.stars;
                        
                        logger.info('Пользователь обработан (автоматический доход)', { 
                            userId: user.userId, 
                            coins: result.coins, 
                            stars: result.stars,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (userError) {
                    logger.error('Ошибка обработки пользователя (автоматический доход)', userError, { userId: user.userId });
                }
            }
            
            if (totalCoinsAwarded > 0 || totalStarsAwarded > 0) {
                logger.info('🎉 Автоматическое начисление дохода завершено', {
                    totalUsersProcessed,
                    totalCoinsAwarded,
                    totalStarsAwarded
                });
            } else {
                logger.debug('Автоматическое начисление дохода завершено (нет активных майнеров)');
            }
            
        } catch (error) {
            logger.error('❌ Ошибка автоматического начисления дохода для всех пользователей', error);
        }
    }

    // Диагностика системы майнинга
    async diagnoseMiningSystem() {
        try {
            logger.info('🔍 Начинаем диагностику системы майнинга...');

            // Получаем статистику
            const usersWithMiners = await this.db.collection('users').find({
                'miners.0': { $exists: true }
            }).toArray();

            let totalActiveMiners = 0;
            let totalInactiveMiners = 0;
            let totalExpiredMiners = 0;
            const now = new Date();

            for (const user of usersWithMiners) {
                const miners = user.miners || [];
                for (const miner of miners) {
                    if (!miner.isActive) {
                        totalInactiveMiners++;
                        continue;
                    }

                    if (!miner.lastMiningStart) {
                        totalInactiveMiners++;
                        continue;
                    }

                    const miningStartTime = new Date(miner.lastMiningStart);
                    const hoursSinceStart = (now - miningStartTime) / (1000 * 60 * 60);

                    if (hoursSinceStart >= 4) {
                        totalExpiredMiners++;
                    } else {
                        totalActiveMiners++;
                    }
                }
            }

            const stats = {
                totalUsers: usersWithMiners.length,
                totalActiveMiners,
                totalInactiveMiners,
                totalExpiredMiners,
                schedulerStatus: this.miningIncomeInterval ? 'ACTIVE' : 'INACTIVE',
                nextRunTime: this.miningIncomeInterval ? new Date(Date.now() + 60000).toISOString() : null
            };

            logger.info('📊 Диагностика системы майнинга завершена', stats);
            return stats;

        } catch (error) {
            logger.error('❌ Ошибка диагностики системы майнинга', error);
            return { error: error.message };
        }
    }

    // ===== СИСТЕМА УРОВНЕЙ =====

    // Получение информации об уровне пользователя
    async getUserLevel(userId) {
        try {
            const user = await this.getUser(userId);
            return user.level || {
                current: 1,
                experience: 0,
                nextLevelExp: 100
            };
        } catch (error) {
            logger.error('Ошибка получения уровня пользователя', error, { userId });
            return {
                current: 1,
                experience: 0,
                nextLevelExp: 100
            };
        }
    }

    // Добавление опыта пользователю
    async addExperience(userId, expAmount, reason = 'unknown') {
        try {
            const user = await this.getUser(userId);
            let userLevel = user.level || {
                current: 1,
                experience: 0,
                nextLevelExp: 100
            };

            // Добавляем опыт
            userLevel.experience += expAmount;

            // Проверяем повышение уровня
            let leveledUp = false;
            while (userLevel.experience >= userLevel.nextLevelExp) {
                userLevel.experience -= userLevel.nextLevelExp;
                userLevel.current++;
                userLevel.nextLevelExp = Math.floor(userLevel.nextLevelExp * 1.5); // Увеличиваем требуемый опыт
                leveledUp = true;
            }

            // Сохраняем изменения
            await this.db.collection('users').updateOne(
                { userId: Number(userId) },
                {
                    $set: {
                        level: userLevel,
                        lastActivity: new Date()
                    }
                }
            );

            logger.info('Опыт добавлен пользователю', {
                userId,
                expAdded: expAmount,
                newLevel: userLevel.current,
                newExp: userLevel.experience,
                leveledUp,
                reason
            });

            return {
                success: true,
                level: userLevel,
                leveledUp,
                expAdded: expAmount
            };

        } catch (error) {
            logger.error('Ошибка добавления опыта пользователю', error, { userId, expAmount, reason });
            return { success: false, error: error.message };
        }
    }

    // Получение требуемого опыта для следующего уровня
    getRequiredExpForLevel(level) {
        // Базовый опыт для уровня 1: 100
        // Каждый следующий уровень требует на 50% больше опыта
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // Получение прогресса до следующего уровня (в процентах)
    getLevelProgress(currentExp, nextLevelExp) {
        if (nextLevelExp === 0) return 100;
        return Math.floor((currentExp / nextLevelExp) * 100);
    }

    // ===== КОНЕЦ СИСТЕМЫ УРОВНЕЙ =====
    
    // Остановка планировщика автоматического дохода
    stopMiningIncomeScheduler() {
        try {
            if (this.miningIncomeInterval) {
                clearInterval(this.miningIncomeInterval);
                this.miningIncomeInterval = null;
                logger.info('🛑 Планировщик автоматического дохода остановлен');
            }
        } catch (error) {
            logger.error('❌ Ошибка остановки планировщика автоматического дохода', error);
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
            
            // Индексы для пользователей (только userId, остальные уже созданы в database.js)
            try {
                await this.db.collection('users').createIndex({ userId: 1 }, { unique: true });
            } catch (error) {
                // Индекс уже существует
                logger.info('Индекс userId для users уже существует');
            }
            
            // Индексы для транзакций
            try {
                await this.db.collection('transactions').createIndex({ userId: 1 });
                await this.db.collection('transactions').createIndex({ timestamp: -1 });
            } catch (error) {
                logger.info('Индексы для transactions уже существуют');
            }
            
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

    async createUserActivityCollection() {
        try {
            // Создаем коллекцию для отслеживания активности пользователей
            try {
                await this.db.createCollection('user_activity');
                logger.info('Коллекция user_activity создана');
            } catch (error) {
                logger.info('Коллекция user_activity уже существует');
            }
            
            // Создаем индексы для оптимизации
            try {
                await this.db.collection('user_activity').createIndex({ userId: 1 });
                await this.db.collection('user_activity').createIndex({ lastActivity: -1 });
                await this.db.collection('user_activity').createIndex({ userId: 1, lastActivity: -1 });
                logger.info('Индексы для user_activity созданы');
            } catch (error) {
                logger.info('Индексы для user_activity уже существуют');
            }
            
        } catch (error) {
            logger.error('Ошибка создания коллекции user_activity', error);
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
            logger.info('🔍 Запрос пользователя из базы данных', {
                userId,
                instanceId: this.constructor.name,
                isInitialized: this.isInitialized,
                timestamp: new Date().toISOString()
            });

            // Обновляем активность пользователя
            await this.updateUserActivity(userId);

            const user = await this.db.collection('users').findOne({ userId: Number(userId) });

            if (!user) {
                logger.info('👤 Пользователь не найден, создаем нового', { userId });

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
                level: {
                    current: 1,
                    experience: 0,
                    nextLevelExp: 100
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

                logger.info('✅ Создан новый пользователь', {
                    userId,
                    balance: newUser.balance,
                    timestamp: new Date().toISOString()
                });
                return newUser;
            }

            logger.info('✅ Пользователь найден в базе данных', {
                userId,
                balance: user.balance,
                lastActivity: user.lastActivity,
                timestamp: new Date().toISOString()
            });

            return user;

        } catch (error) {
            logger.error('❌ Ошибка получения пользователя', error, {
                userId,
                errorStack: error.stack
            });
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
        const session = this.db.client.startSession();

        try {
            logger.info('🔄 Начинаем транзакционное обновление баланса', {
                userId,
                currency,
                amount,
                reason,
                instanceId: this.constructor.name,
                isInitialized: this.isInitialized,
                timestamp: new Date().toISOString()
            });

            return await session.withTransaction(async () => {
                // Проверяем существование пользователя
                const user = await this.db.collection('users').findOne(
                    { userId: userId },
                    { session }
                );

                if (!user) {
                    throw new Error(`Пользователь ${userId} не найден`);
                }

                const oldBalance = user.balance[currency] || 0;
                const oldTotalEarned = user.balance.totalEarned?.[currency] || 0;

                logger.info('📊 Текущий баланс пользователя', {
                    userId,
                    currency,
                    oldBalance,
                    oldTotalEarned,
                    operation: amount > 0 ? 'increase' : 'decrease'
                });

                // Создаем объект для атомарного обновления
                const updateObj = {
                    $set: { lastActivity: new Date() }
                };

                // Атомарно увеличиваем баланс и totalEarned
                if (amount > 0) {
                    // Для положительных сумм обновляем оба поля
                    updateObj.$inc = {
                        [`balance.${currency}`]: amount,
                        [`balance.totalEarned.${currency}`]: amount
                    };
                } else {
                    // Для отрицательных сумм обновляем только баланс
                    updateObj.$inc = {
                        [`balance.${currency}`]: amount
                    };
                }

                // Пользователь уже существует (проверено выше), поэтому $setOnInsert не нужен

                logger.info('🔄 Выполняем атомарное обновление в транзакции', {
                    userId,
                    currency,
                    updateObj,
                    timestamp: new Date().toISOString()
                });

                // Выполняем атомарное обновление в транзакции
                const updateResult = await this.db.collection('users').updateOne(
                    { userId: userId },
                    updateObj,
                    { session }
                );

                if (updateResult.matchedCount === 0) {
                    throw new Error(`Пользователь ${userId} не найден для обновления`);
                }

                logger.info('💾 Атомарное обновление выполнено в транзакции', {
                    userId,
                    currency,
                    matchedCount: updateResult.matchedCount,
                    modifiedCount: updateResult.modifiedCount,
                    acknowledged: updateResult.acknowledged
                });

                // Получаем обновленный баланс для записи транзакции
                const updatedUser = await this.db.collection('users').findOne(
                    { userId: userId },
                    { session }
                );

                const newBalance = updatedUser.balance[currency] || 0;
                const newTotalEarned = updatedUser.balance.totalEarned?.[currency] || 0;

                // Записываем транзакцию в той же транзакции
                await this.addTransaction(userId, currency, amount, reason, oldBalance, newBalance, session);

                logger.info('✅ Баланс успешно обновлен в транзакции', {
                    userId,
                    currency,
                    amount,
                    reason,
                    oldBalance,
                    newBalance,
                    oldTotalEarned,
                    newTotalEarned,
                    timestamp: new Date().toISOString(),
                    source: 'DataManager.updateBalance'
                });

                return newBalance;
            });

        } catch (error) {
            logger.error('❌ Ошибка транзакционного обновления баланса', error, {
                userId,
                currency,
                amount,
                reason,
                errorStack: error.stack
            });
            throw error;
        } finally {
            await session.endSession();
        }
    }



    // === УПРАВЛЕНИЕ ТРАНЗАКЦИЯМИ ===
    
    async addTransaction(userId, currency, amount, reason, oldBalance, newBalance, session = null) {
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

            const options = session ? { session } : {};
            const result = await this.db.collection('transactions').insertOne(transaction, options);

            if (result.insertedId) {
                logger.info('Транзакция добавлена', {
                    userId,
                    currency,
                    amount,
                    reason,
                    transactionId: result.insertedId,
                    inTransaction: !!session
                });
            } else {
                logger.error('Не удалось добавить транзакцию', { userId, currency, amount, reason, inTransaction: !!session });
            }

        } catch (error) {
            logger.error('Ошибка добавления транзакции', error, {
                userId,
                currency,
                amount,
                reason,
                inTransaction: !!session
            });
            throw error; // Передаем ошибку выше для отката транзакции
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
    
    async setupReferral(userId, referrerId = null, userData = null) {
        try {
            // Обновляем профиль пользователя если переданы данные
            if (userData) {
                await this.updateUserProfile(userId, userData);
            }
            
            // Проверяем, не пытается ли пользователь использовать свою собственную реферальную ссылку
            if (referrerId && Number(referrerId) === userId) {
                logger.warn('Попытка использовать собственную реферальную ссылку заблокирована', { userId, referrerId });
                
                // Создаем пользователя без реферера
                const user = await this.getUser(userId);
                
                // Если у пользователя уже есть referralId, значит система настроена
                if (user.referral && user.referral.referralId) {
                    logger.info('Реферальная система уже настроена', { userId, existingReferralId: user.referral.referralId });
                    return user.referral;
                }
                
                // Возвращаем данные без реферера
                const referralData = {
                    referralId: userId,
                    referrerId: null,
                    totalEarned: { stars: 0, coins: 0 },
                    level: 1,
                    hasReceivedReferralBonus: true
                };
                
                await this.updateUser(userId, { referral: referralData });
                
                logger.info('Пользователь создан без реферера (собственная ссылка заблокирована)', { userId });
                return referralData;
            }
            
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
            
            // Дополнительная проверка: если пользователь уже является чьим-то рефералом
            if (referrerId) {
                const existingReferral = await this.db.collection('referrals').findOne({
                    userId: Number(userId)
                });
                
                if (existingReferral) {
                    logger.warn('Пользователь уже является чьим-то рефералом', { 
                        userId, 
                        existingReferrerId: existingReferral.referrerId,
                        requestedReferrerId: referrerId 
                    });
                    
                    // Возвращаем существующие данные без изменения
                    return user.referral || {
                        referralId: userId,
                        referrerId: existingReferral.referrerId,
                        totalEarned: { stars: 0, coins: 0 },
                        level: 1,
                        hasReceivedReferralBonus: true
                    };
                }
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
                
                // Проверяем, был ли реферал успешно добавлен
                const referralAdded = await this.db.collection('referrals').findOne({
                    userId: Number(userId),
                    referrerId: Number(actualReferrerId)
                });
                
                if (!referralAdded) {
                    logger.warn('Реферал не был добавлен, пропускаем начисление награды', { 
                        referrerId: actualReferrerId, 
                        newUserId: userId 
                    });
                    return referralData;
                }
                
                // Начисляем награду рефереру (5 звезд + 1000 магнум коинов)
                logger.info('Начисляем награду рефереру', { referrerId: actualReferrerId, stars: 5, coins: 1000 });
                await this.updateBalance(actualReferrerId, 'stars', 5, 'referral_reward');
                await this.updateBalance(actualReferrerId, 'coins', 1000, 'referral_reward');
                logger.info('Начислена награда за реферала', { referrerId: actualReferrerId, newUserId: userId, stars: 5, coins: 1000 });
                
                // Отправляем уведомление рефереру
                await this.sendReferralRewardNotification(actualReferrerId, userId, { stars: 5, coins: 1000 });
                
                // Также начисляем награду новому пользователю за регистрацию по реферальному коду
                logger.info('Начисляем бонус новому пользователю', { userId, reward: 1000, currency: 'coins' });
                await this.updateBalance(userId, 'coins', 1000, 'referral_registration_bonus');
                
                // Устанавливаем флаг, что пользователь получил награду
                await this.updateUser(userId, { 'referral.hasReceivedReferralBonus': true });
                
                // Отправляем уведомление новому пользователю
                await this.sendReferralRegistrationNotification(userId, actualReferrerId, { coins: 1000 });
                
                logger.info('Начислен бонус за регистрацию по реферальному коду', { userId, reward: 1000, currency: 'coins' });
            } else if (referrerId) {
                // Если ID реферера передан, но реферер не найден, все равно начисляем бонус новому пользователю
                // Это нужно для тестирования и чтобы пользователи не теряли бонусы
                logger.info('Реферер не найден, но начисляем бонус новому пользователю', { userId, reward: 1000, currency: 'coins', referrerId });
                await this.updateBalance(userId, 'coins', 1000, 'referral_registration_bonus');
                
                // Устанавливаем флаг, что пользователь получил награду
                await this.updateUser(userId, { 'referral.hasReceivedReferralBonus': true });
                
                // Отправляем уведомление новому пользователю (без реферера)
                await this.sendReferralRegistrationNotification(userId, null, { coins: 1000 });
                
                logger.info('Начислен бонус за регистрацию по реферальному коду (реферер не найден)', { userId, reward: 1000, currency: 'coins', referrerId });
            }
            
            logger.info('Реферальная система настроена', { userId, referrerId: actualReferrerId, referralId });
            
            return referralData;
            
        } catch (error) {
            logger.error('Ошибка настройки реферальной системы', error, { userId, referrerId });
            throw error;
        }
    }

    // Обновление профиля пользователя (имя, username)
    async updateUserProfile(userId, userData) {
        try {
            logger.info('Обновление профиля пользователя', { userId, userData });
            
            const updateData = {};
            
            // Обновляем firstName если он передан и не пустой
            if (userData.firstName && userData.firstName.trim()) {
                updateData.firstName = userData.firstName.trim();
            }
            
            // Обновляем username если он передан и не пустой
            if (userData.username && userData.username.trim()) {
                updateData.username = userData.username.trim();
            }
            
            // Обновляем lastName если он передан и не пустой
            if (userData.lastName && userData.lastName.trim()) {
                updateData.lastName = userData.lastName.trim();
            }
            
            // Обновляем telegramUsername если username передан
            if (userData.username && userData.username.trim()) {
                updateData.telegramUsername = userData.username.trim();
            }
            
            // Если есть данные для обновления, обновляем пользователя
            if (Object.keys(updateData).length > 0) {
                await this.updateUser(userId, updateData);
                logger.info('Профиль пользователя обновлен', { userId, updateData });
            }
            
        } catch (error) {
            logger.error('Ошибка обновления профиля пользователя', error, { userId, userData });
        }
    }

    async addReferralToUser(referrerId, newUserId) {
        try {
            logger.info('Начинаем добавление реферала к пользователю', { referrerId, newUserId });
            
            // Дополнительная проверка на дублирование для надежности
            const existingReferral = await this.db.collection('referrals').findOne({
                userId: Number(newUserId),
                referrerId: Number(referrerId)
            });
            
            if (existingReferral) {
                logger.warn('Реферал уже существует, пропускаем добавление', { 
                    referrerId, 
                    newUserId, 
                    existingReferralId: existingReferral._id 
                });
                return;
            }
            
            // Создаем запись в коллекции referrals
            const referralRecord = {
                userId: Number(newUserId),
                referrerId: Number(referrerId),
                createdAt: new Date(),
                isActive: true,
                reward: { stars: 5, coins: 1000 } // 5 звезд + 1000 магнум коинов за реферала
            };
            
            // Сохраняем в коллекцию referrals
            try {
                await this.db.collection('referrals').insertOne(referralRecord);
                logger.info('Запись о реферале сохранена в коллекции referrals', { referrerId, newUserId, referralId: referralRecord._id });
            } catch (insertError) {
                // Проверяем, не является ли ошибка связанной с дублированием
                if (insertError.code === 11000) {
                    logger.warn('Попытка создать дублирующую запись реферала заблокирована уникальным индексом', { 
                        referrerId, 
                        newUserId, 
                        error: insertError.message 
                    });
                    return; // Выходим без начисления награды
                }
                throw insertError; // Пробрасываем другие ошибки
            }
            
            // Обновляем статистику реферера в коллекции users
            const referrer = await this.getUser(referrerId);
            const currentEarned = referrer.referral.totalEarned || { stars: 0, coins: 0 };
            const newEarned = {
                stars: currentEarned.stars + 5, // 5 звезд за реферала
                coins: currentEarned.coins + 1000 // 1000 магнум коинов за реферала
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
            
            // Рассчитываем актуальный общий доход на основе количества рефералов
            const baseStarsReward = 5; // 5 звезд за каждого реферала
            const baseCoinsReward = 1000; // 1000 магнум коинов за каждого реферала
            const calculatedEarned = {
                stars: referrals.length * baseStarsReward,
                coins: referrals.length * baseCoinsReward
            };
            
            // Используем рассчитанное значение или сохраненное (берем большее)
            const savedEarned = user.referral.totalEarned || { stars: 0, coins: 0 };
            const totalEarned = {
                stars: Math.max(calculatedEarned.stars, savedEarned.stars),
                coins: Math.max(calculatedEarned.coins, savedEarned.coins)
            };
            
            // Обновляем сохраненное значение, если рассчитанное больше
            if (totalEarned.stars > savedEarned.stars || totalEarned.coins > savedEarned.coins) {
                await this.updateUser(userId, {
                    'referral.totalEarned': totalEarned
                });
                logger.info('Обновлен totalEarned для пользователя', { userId, oldEarned: savedEarned, newEarned: totalEarned });
            }
            
            // Получаем статистику активных рефералов
            const activeReferralsStats = await this.getActiveReferralsStats(userId);
            
            return {
                referralId: numericUserId, // ID пользователя для реферальной ссылки
                totalReferrals: referrals.length,
                activeReferrals: activeReferralsStats.activeReferrals,
                totalEarned: totalEarned,
                level: user.referral.level || 1,
                referrals: referrals,
                isActiveReferrer: activeReferralsStats.isActiveReferrer
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
            
            // Проверяем лимиты майнеров
            const userMinerCount = await this.getUserMinerCount(userId, minerType);
            const globalMinerCount = await this.getGlobalMinerCount(minerType);
            
            logger.info('Проверка лимитов майнеров', { 
                userId, 
                minerType, 
                userMinerCount, 
                globalMinerCount,
                maxPerUser: minerInfo.maxPerUser,
                globalLimit: minerInfo.globalLimit
            });
            
            // Проверяем лимит на пользователя
            if (userMinerCount >= minerInfo.maxPerUser) {
                throw new Error(`Достигнут лимит майнеров "${minerInfo.name}" на пользователя (${minerInfo.maxPerUser})`);
            }
            
            // Проверяем общий лимит на сервере
            if (globalMinerCount >= minerInfo.globalLimit) {
                throw new Error(`Достигнут общий лимит майнеров "${minerInfo.name}" на сервере (${minerInfo.globalLimit})`);
            }
            
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
            
            // Обновляем пользователя с новыми майнерами
            await this.updateUser(userId, { miners: userMiners });
            
            // Если у пользователя уже запущен майнинг, добавляем новый майнер к активным
            const hasActiveMining = userMiners.some(m => m.isActive && m.lastMiningStart);
            if (hasActiveMining) {
                logger.info('У пользователя уже запущен майнинг, новый майнер добавлен к активным', { 
                    userId, 
                    minerId: miner.id, 
                    totalMiners: userMiners.length 
                });
            }
            
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
    
    // Запуск майнинга (раз в 4 часа для novice, раз в 12 часов для limited)
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
            // Если хотя бы один майнер может запуститься - разрешаем
            for (const miner of miners) {
                if (!miner.isActive) continue;
                
                if (!miner.lastMiningStart) {
                    canStartMining = true;
                    break;
                }
                
                const timeSinceLastStart = now - new Date(miner.lastMiningStart);
                const hoursSinceLastStart = timeSinceLastStart / (1000 * 60 * 60);
                
                // Разные интервалы для разных типов майнеров
                let requiredHours = 4; // По умолчанию 4 часа
                if (miner.type === 'limited') {
                    requiredHours = 12;
                } else if (miner.type === 'epic') {
                    requiredHours = 8; // Епический майнер работает 8 часов
                }
                
                if (hoursSinceLastStart >= requiredHours) {
                    canStartMining = true;
                    break;
                }
            }
            
            // Если майнинг уже запущен, показываем время следующего запуска
            if (!canStartMining) {
                const earliestNextStart = new Date(Math.min(...miners
                    .filter(m => m.isActive && m.lastMiningStart)
                    .map(m => {
                        const requiredHours = m.type === 'limited' ? 12 : 4;
                        return new Date(m.lastMiningStart).getTime() + (requiredHours * 60 * 60 * 1000);
                    })
                ));
                
                const timeUntilNext = earliestNextStart - now;
                const hoursUntilNext = Math.ceil(timeUntilNext / (1000 * 60 * 60));
                
                return { 
                    success: false, 
                    message: `Майнинг уже запущен! Следующий запуск возможен через ${hoursUntilNext} часов`,
                    nextStartTime: earliestNextStart
                };
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
            
            // Сразу начисляем первую награду за запуск майнинга
            let totalCoins = 0;
            let totalStars = 0;
            
            for (const miner of miners) {
                if (miner.isActive) {
                    totalCoins += miner.speed.coins;
                    totalStars += miner.speed.stars;
                }
            }
            
            // Начисляем доход за первую минуту
            if (totalCoins > 0) {
                await this.updateBalance(userId, 'coins', totalCoins, 'mining_income_start');
                logger.info('Начислена награда за запуск майнинга (Coins)', { userId, totalCoins });
            }
            if (totalStars > 0) {
                await this.updateBalance(userId, 'stars', totalStars, 'mining_income_start');
                logger.info('Начислена награда за запуск майнинга (Stars)', { userId, totalStars });
            }
            
            logger.info('Майнинг успешно запущен', { userId, startTime: now, initialReward: { coins: totalCoins, stars: totalStars } });
            
            // Формируем сообщение о доходе
            let rewardMessage = 'Майнинг запущен! ';
            if (totalCoins > 0) {
                rewardMessage += `Получено ${totalCoins} 🪙 Coins за первую минуту. `;
            }
            if (totalStars > 0) {
                rewardMessage += `Получено ${totalStars} ⭐ Stars за первую минуту. `;
            }
            rewardMessage += 'Доход будет начисляться каждую минуту автоматически.';
            
            return { 
                success: true, 
                message: rewardMessage,
                startTime: now,
                initialReward: { coins: totalCoins, stars: totalStars }
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
            
            logger.info('Обрабатываем автоматический доход от майнинга', { userId, minersCount: miners.length });
            
            // Рассчитываем доход для каждого майнера
            for (const miner of miners) {
                if (!miner.isActive || !miner.lastMiningStart) {
                    logger.debug('Майнер неактивен или майнинг не запущен', { 
                        userId, 
                        minerId: miner.id, 
                        isActive: miner.isActive, 
                        lastMiningStart: miner.lastMiningStart 
                    });
                    continue;
                }
                
                // Проверяем, что майнинг был запущен менее требуемого времени назад
                const timeSinceMiningStart = now - new Date(miner.lastMiningStart);
                const hoursSinceStart = timeSinceMiningStart / (1000 * 60 * 60);
                
                // Разные интервалы для разных типов майнеров
                let requiredHours = 4; // По умолчанию 4 часа
                if (miner.type === 'limited') {
                    requiredHours = 12;
                } else if (miner.type === 'epic') {
                    requiredHours = 8; // Епический майнер работает 8 часов
                }
                
                if (hoursSinceStart < requiredHours) {
                    // Начисляем доход за последнюю минуту (скорость уже в минуту)
                    const coinsEarned = miner.speed.coins; // Доход в минуту (1 Coin)
                    const starsEarned = miner.speed.stars; // Доход в минуту
                    
                    totalCoins += coinsEarned;
                    totalStars += starsEarned;
                    
                    logger.debug('Майнер генерирует доход', { 
                        userId, 
                        minerId: miner.id, 
                        minerType: miner.type,
                        coinsEarned, 
                        starsEarned,
                        hoursSinceStart: Math.round(hoursSinceStart * 100) / 100
                    });
                } else {
                    logger.debug(`Майнинг майнера истек (более ${requiredHours} часов)`, { 
                        userId, 
                        minerId: miner.id, 
                        hoursSinceStart: Math.round(hoursSinceStart * 100) / 100,
                        requiredHours
                    });
                }
            }
            
            // Начисляем доход
            if (totalCoins > 0) {
                await this.updateBalance(userId, 'coins', totalCoins, 'mining_income_auto');
                logger.info('✅ Автоматический доход от майнинга начислен (Coins)', { userId, totalCoins });
            }
            if (totalStars > 0) {
                await this.updateBalance(userId, 'stars', totalStars, 'mining_income_auto');
                logger.info('✅ Автоматический доход от майнинга начислен (Stars)', { userId, totalStars });
            }
            
            if (totalCoins > 0 || totalStars > 0) {
                logger.info('🎉 Автоматический доход от майнинга начислен', { userId, totalCoins, totalStars });
            } else {
                logger.debug('Автоматический доход не начислен (нет активных майнеров)', { userId });
            }
            
            return { coins: totalCoins, stars: totalStars };
            
        } catch (error) {
            logger.error('❌ Ошибка автоматического начисления дохода', error, { userId });
            return { coins: 0, stars: 0 };
        }
    }
    
    // Проверка и начисление пропущенных наград за майнинг (после редеплоя)
    async processMissedMiningRewards(userId) {
        try {
            const user = await this.getUser(userId);
            const miners = user.miners || [];
            
            if (miners.length === 0) {
                return { coins: 0, stars: 0, minutesProcessed: 0 };
            }
            
            let totalCoins = 0;
            let totalStars = 0;
            let totalMinutesProcessed = 0;
            const now = new Date();
            
            logger.info('Проверяем пропущенные награды за майнинг', { userId, minersCount: miners.length });
            
            // Проверяем каждого майнера
            for (const miner of miners) {
                if (!miner.isActive || !miner.lastMiningStart) continue;
                
                const miningStartTime = new Date(miner.lastMiningStart);
                const timeSinceStart = now - miningStartTime;
                const hoursSinceStart = timeSinceStart / (1000 * 60 * 60);
                
                // Определяем требуемое время работы для типа майнера
                let requiredHours = 4; // По умолчанию 4 часа
                if (miner.type === 'limited') {
                    requiredHours = 12;
                } else if (miner.type === 'epic') {
                    requiredHours = 8;
                }
                
                // Если майнинг был запущен менее требуемого времени назад
                if (hoursSinceStart < requiredHours) {
                    // Рассчитываем количество пропущенных минут
                    const minutesSinceStart = Math.floor(timeSinceStart / (1000 * 60));
                    const maxMinutes = requiredHours * 60; // Максимум в минутах
                    const minutesToProcess = Math.min(minutesSinceStart, maxMinutes);
                    
                    if (minutesToProcess > 0) {
                        // Начисляем награды за пропущенные минуты
                        const coinsEarned = miner.speed.coins * minutesToProcess;
                        const starsEarned = miner.speed.stars * minutesToProcess;
                        
                        totalCoins += coinsEarned;
                        totalStars += starsEarned;
                        totalMinutesProcessed += minutesToProcess;
                        
                        logger.info('Начислены пропущенные награды за майнер', { 
                            userId, 
                            minerId: miner.id, 
                            minerType: miner.type,
                            minutesProcessed: minutesToProcess,
                            coinsEarned,
                            starsEarned
                        });
                    }
                }
            }
            
            // Начисляем общие пропущенные награды
            if (totalCoins > 0 || totalStars > 0) {
                if (totalCoins > 0) {
                    await this.updateBalance(userId, 'coins', totalCoins, 'mining_income_missed');
                    logger.info('Начислены пропущенные награды за майнинг (Coins)', { userId, totalCoins });
                }
                if (totalStars > 0) {
                    await this.updateBalance(userId, 'stars', totalStars, 'mining_income_missed');
                    logger.info('Начислены пропущенные награды за майнинг (Stars)', { userId, totalStars });
                }
                
                logger.info('Пропущенные награды за майнинг успешно начислены', { 
                    userId, 
                    totalCoins, 
                    totalStars, 
                    totalMinutesProcessed 
                });
            }
            
            return { 
                coins: totalCoins, 
                stars: totalStars, 
                minutesProcessed: totalMinutesProcessed 
            };
            
        } catch (error) {
            logger.error('Ошибка обработки пропущенных наград за майнинг', error, { userId });
            return { coins: 0, stars: 0, minutesProcessed: 0 };
        }
    }
    
    // Массовая проверка и начисление пропущенных наград для всех пользователей
    async processAllMissedMiningRewards() {
        try {
            logger.info('Начинаем массовую проверку пропущенных наград за майнинг');
            
            // Получаем только активных пользователей с майнерами (ограничиваем для быстрого старта)
            const usersWithMiners = await this.db.collection('users').find({
                'miners.0': { $exists: true }, // У пользователя есть хотя бы один майнер
                'lastActivity': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Активные за последние 7 дней
            }).limit(100).toArray(); // Ограничиваем до 100 пользователей за раз
            
            let totalUsersProcessed = 0;
            let totalCoinsAwarded = 0;
            let totalStarsAwarded = 0;
            let totalMinutesProcessed = 0;
            
            logger.info(`Найдено пользователей с майнерами: ${usersWithMiners.length}`);
            
            // Обрабатываем каждого пользователя
            for (const user of usersWithMiners) {
                try {
                    const result = await this.processMissedMiningRewards(user.userId);
                    
                    if (result.minutesProcessed > 0) {
                        totalUsersProcessed++;
                        totalCoinsAwarded += result.coins;
                        totalStarsAwarded += result.stars;
                        totalMinutesProcessed += result.minutesProcessed;
                        
                        logger.info('Пользователь обработан', { 
                            userId: user.userId, 
                            coins: result.coins, 
                            stars: result.stars, 
                            minutes: result.minutesProcessed 
                        });
                    }
                } catch (userError) {
                    logger.error('Ошибка обработки пользователя', userError, { userId: user.userId });
                }
            }
            
            logger.info('Массовая проверка пропущенных наград завершена', {
                totalUsersProcessed,
                totalCoinsAwarded,
                totalStarsAwarded,
                totalMinutesProcessed
            });
            
            return {
                success: true,
                totalUsersProcessed,
                totalCoinsAwarded,
                totalStarsAwarded,
                totalMinutesProcessed
            };
            
        } catch (error) {
            logger.error('Ошибка массовой проверки пропущенных наград', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Получение информации о майнере
    getMinerInfo(minerType) {
        const miners = {
            'novice': {
                id: 'novice',
                name: 'Новичок',
                price: { coins: 100, stars: 0 },
                speed: { coins: 1, stars: 0 }, // 1 Magnum Coin в минуту
                rarity: 'Обычный',
                maxPerUser: 10, // Максимум 10 майнеров на пользователя
                globalLimit: 100 // Общий лимит на сервере
            },
            'limited': {
                id: 'limited',
                name: 'Лимитированная версия',
                price: { coins: 0, stars: 100 },
                speed: { coins: 0, stars: 0.001999 }, // 0.001999 Stars в минуту
                rarity: 'Редкий',
                maxPerUser: 5, // Максимум 5 майнеров на пользователя
                globalLimit: 10 // Общий лимит на сервере (всего 10 майнеров)
            },
            'epic': {
                id: 'epic',
                name: 'Епический',
                price: { coins: 10000, stars: 0 },
                speed: { coins: 0, stars: 0.6944 }, // 0.6944 Stars в минуту
                rarity: 'Епический',
                maxPerUser: 1, // Максимум 1 майнер на пользователя
                globalLimit: 100 // Общий лимит на сервере (всего 100 майнеров)
            }
        };
        
        return miners[minerType];
    }
    
    // Генерация уникального ID для майнера
    generateMinerId() {
        return 'miner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Получение количества майнеров определенного типа у пользователя
    async getUserMinerCount(userId, minerType) {
        try {
            const user = await this.getUser(userId);
            const userMiners = user.miners || [];
            
            // Подсчитываем майнеры указанного типа
            const count = userMiners.filter(miner => miner.type === minerType).length;
            
            logger.info('Подсчет майнеров пользователя', { userId, minerType, count });
            return count;
            
        } catch (error) {
            logger.error('Ошибка подсчета майнеров пользователя', error, { userId, minerType });
            return 0;
        }
    }
    
    // Получение общего количества майнеров определенного типа на сервере
    async getGlobalMinerCount(minerType) {
        try {
            // Агрегация для подсчета всех майнеров указанного типа
            const result = await this.db.collection('users').aggregate([
                { $unwind: '$miners' },
                { $match: { 'miners.type': minerType } },
                { $count: 'total' }
            ]).toArray();
            
            const count = result.length > 0 ? result[0].total : 0;
            
            logger.info('Подсчет общих майнеров на сервере', { minerType, count });
            return count;
            
        } catch (error) {
            logger.error('Ошибка подсчета общих майнеров на сервере', error, { minerType });
            return 0;
        }
    }
    
    // Получение количества активных майнеров определенного типа на сервере
    async getActiveMinersCount(minerType) {
        try {
            // Агрегация для подсчета активных майнеров указанного типа
            const result = await this.db.collection('users').aggregate([
                { $unwind: '$miners' },
                { 
                    $match: { 
                        'miners.type': minerType,
                        'miners.isActive': true,
                        'miners.lastMiningStart': { $exists: true, $ne: null }
                    } 
                },
                { $count: 'total' }
            ]).toArray();
            
            const count = result.length > 0 ? result[0].total : 0;
            
            logger.info('Подсчет активных майнеров на сервере', { minerType, count });
            return count;
            
        } catch (error) {
            logger.error('Ошибка подсчета активных майнеров на сервере', error, { minerType });
            return 0;
        }
    }
    
    // Получение информации о доступности майнеров для покупки
    async getMinerAvailability(minerType) {
        try {
            const minerInfo = this.getMinerInfo(minerType);
            if (!minerInfo) {
                return null;
            }
            
            const globalCount = await this.getGlobalMinerCount(minerType);
            const activeCount = await this.getActiveMinersCount(minerType);
            const available = Math.max(0, minerInfo.globalLimit - globalCount);
            
            return {
                type: minerType,
                name: minerInfo.name,
                price: minerInfo.price,
                speed: minerInfo.speed,
                rarity: minerInfo.rarity,
                maxPerUser: minerInfo.maxPerUser,
                globalLimit: minerInfo.globalLimit,
                globalCount: globalCount,
                activeCount: activeCount,
                available: available,
                isAvailable: available > 0
            };
            
        } catch (error) {
            logger.error('Ошибка получения доступности майнера', error, { minerType });
            return null;
        }
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
                id: await this.generateWithdrawalId(),
                userId: Number(userId),
                firstName: user.firstName || 'Неизвестно',
                username: user.username || user.telegramUsername || '@username',
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
            
            // Получаем актуальные данные пользователя
            const user = await this.getUser(request.userId);
            
            const updateData = {
                status: action === 'approve' ? 'approved' : 'rejected',
                processedAt: new Date(),
                processedBy: Number(adminId),
                firstName: user.firstName || 'Неизвестно',
                username: user.username || user.telegramUsername || '@username'
            };
            
            // Обновляем статус заявки
            await this.db.collection('withdrawals').updateOne(
                { id: requestId },
                { $set: updateData }
            );
            
            if (action === 'approve') {
                // Обновляем статистику бота при одобрении заявки
                await this.updateBotStats('totalStarsWithdrawn', request.amount);
                logger.info('Обновлена статистика выведенных звезд', { 
                    amount: request.amount,
                    totalWithdrawn: request.amount
                });
            } else if (action === 'reject') {
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
    async generateWithdrawalId() {
        try {
            // Получаем количество существующих заявок для нумерации
            const count = await this.db.collection('withdrawals').countDocuments();
            return (count + 1).toString();
        } catch (error) {
            // Fallback на случай ошибки
            return 'wd_' + Date.now();
        }
    }
    
    // Проверка подписки пользователя на канал
    async checkUserSubscription(userId, channelUsername = null, bot = null) {
        // Используем переменную окружения или значение по умолчанию
        const defaultChannel = process.env.CHANNEL_USERNAME || '@magnumtap';
        const targetChannel = channelUsername || defaultChannel;
        try {
            logger.info('Проверка подписки пользователя', { userId, targetChannel });
            
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
            
            // Проверяем, подписан ли пользователь на канал через Telegram API
            let isSubscribed = false;
            
            if (bot) {
                try {
                    // Убираем @ из username если есть
                    const cleanUsername = targetChannel.replace('@', '');
                    
                    // Проверяем подписку через getChatMember
                    const chatMember = await bot.getChatMember(`@${cleanUsername}`, userId);
                    
                    // Пользователь подписан если статус не 'left' и не 'kicked'
                    isSubscribed = chatMember && 
                                  chatMember.status !== 'left' && 
                                  chatMember.status !== 'kicked';
                    
                    logger.info('Проверка подписки через Telegram API', { 
                        userId, 
                        channelUsername: cleanUsername, 
                        status: chatMember?.status,
                        isSubscribed 
                    });
                    
                } catch (telegramError) {
                    logger.warn('Ошибка проверки подписки через Telegram API', { 
                        userId, 
                        targetChannel, 
                        error: telegramError.message 
                    });
                    
                    // Если не удалось проверить через API, возвращаем false
                    isSubscribed = false;
                }
            } else {
                logger.warn('Bot instance не передан для проверки подписки', { userId });
                // Для тестирования возвращаем true
                isSubscribed = true;
            }
            
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

    // Создание ключа майнера
    async createMinerKey(keyData) {
        try {
            const key = {
                key: keyData.key,
                type: 'miner',
                minerType: keyData.minerType, // 'novice' или 'star_path'
                maxUses: keyData.maxUses,
                currentUses: 0,
                createdAt: new Date(),
                createdBy: keyData.createdBy,
                isActive: true
            };

            await this.db.collection('keys').insertOne(key);

            logger.info('Ключ майнера создан в базе данных', {
                key: key.key.substring(0, 6) + '...',
                minerType: key.minerType,
                maxUses: key.maxUses
            });

            return { success: true, key: key };

        } catch (error) {
            logger.error('Ошибка создания ключа майнера в базе данных', error, { keyData });
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

            // Обработка ключа майнера
            if (keyDoc.type === 'miner') {
                // Получаем информацию о майнере
                const minerInfo = MINER_TYPES[keyDoc.minerType.toUpperCase()];

                if (!minerInfo) {
                    return { success: false, message: 'Тип майнера не найден' };
                }

                // Проверяем, хватает ли средств для покупки майнера
                const userBalance = await this.getUserBalance(userId);
                let canAfford = false;

                if (minerInfo.priceType === 'stars' && userBalance.stars >= minerInfo.price) {
                    canAfford = true;
                } else if (minerInfo.priceType === 'coins' && userBalance.coins >= minerInfo.price) {
                    canAfford = true;
                }

                if (!canAfford) {
                    return {
                        success: false,
                        message: `Недостаточно средств для покупки майнера "${minerInfo.name}". Нужно: ${minerInfo.price} ${minerInfo.priceType === 'stars' ? '⭐' : '🪙'}`
                    };
                }

                // Проверяем лимит майнеров на сервере
                const serverMinerCounts = await this.getServerMinerCounts();
                if (serverMinerCounts[keyDoc.minerType.toUpperCase()] <= 0) {
                    return { success: false, message: `Майнер "${minerInfo.name}" больше недоступен на сервере` };
                }

                // Проверяем лимит майнеров пользователя
                const userMinerCount = await this.getUserMinerCount(userId, keyDoc.minerType);
                if (userMinerCount >= minerInfo.serverLimit / 10) { // Примерный лимит на пользователя
                    return { success: false, message: `Достигнут лимит майнеров "${minerInfo.name}" для пользователя` };
                }

                try {
                    // Создаем майнер для пользователя
                    await this.createMinerForUser(userId, keyDoc.minerType);

                    // Списываем стоимость майнера
                    if (minerInfo.priceType === 'stars') {
                        await this.updateBalance(userId, 'stars', -minerInfo.price, 'miner_key_activation');
                    } else {
                        await this.updateBalance(userId, 'coins', -minerInfo.price, 'miner_key_activation');
                    }

                    // Уменьшаем количество майнеров на сервере
                    serverMinerCounts[keyDoc.minerType.toUpperCase()]--;
                    await this.updateServerMinerCounts(serverMinerCounts);

                    rewardText.push(`⛏️ Майнер: ${minerInfo.name}`);
                    rewardText.push(`💰 Стоимость: ${minerInfo.price} ${minerInfo.priceType === 'stars' ? '⭐' : '🪙'}`);
                    rewardText.push(`⚡ Доход: ${minerInfo.rewardType === 'stars' ? minerInfo.rewardPerMinute + ' ⭐/мин' : minerInfo.rewardPerMinute + ' 🪙/мин'}`);

                } catch (error) {
                    logger.error('Ошибка создания майнера из ключа', error, { userId, minerType: keyDoc.minerType });
                    return { success: false, message: 'Ошибка при создании майнера' };
                }
            }

            // Увеличиваем счетчик использований ключа
            await this.db.collection('keys').updateOne(
                { key: key },
                { $inc: { currentUses: 1 } }
            );
            
            // Обновляем сообщение в канале
            await this.updateKeyChannelMessage(key);
            
            // Записываем активацию ключа
            await this.db.collection('key_activations').insertOne({
                key: key,
                userId: Number(userId),
                activatedAt: new Date(),
                reward: keyDoc.reward
            });
            
            // Добавляем опыт за активацию ключа (20 опыта за ключ)
            const expResult = await this.addExperience(userId, 20, 'key_activation');
            logger.info('Опыт добавлен за активацию ключа', expResult);
            
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
    
    // === АВТОМАТИЧЕСКОЕ УДАЛЕНИЕ СООБЩЕНИЙ ===
    
    // Логирование сообщения для автоматического удаления
    async logMessageForDeletion(messageId, chatId, userId, messageType = 'bot') {
        try {
            const deletionTime = new Date(Date.now() + 15000); // 15 секунд
            
            await this.db.collection('message_deletions').insertOne({
                messageId: messageId,
                chatId: chatId,
                userId: userId,
                messageType: messageType, // 'bot' или 'user'
                createdAt: new Date(),
                deleteAt: deletionTime,
                isDeleted: false
            });
            
            logger.info('Сообщение запланировано на удаление', { 
                messageId, 
                chatId, 
                userId, 
                messageType, 
                deleteAt: deletionTime 
            });
            
        } catch (error) {
            logger.error('Ошибка логирования сообщения для удаления', error, { messageId, chatId, userId });
        }
    }
    
    // Получение сообщений для удаления
    async getMessagesToDelete() {
        try {
            const now = new Date();
            
            const messages = await this.db.collection('message_deletions')
                .find({
                    deleteAt: { $lte: now },
                    isDeleted: false
                })
                .toArray();
            
            return messages;
            
        } catch (error) {
            logger.error('Ошибка получения сообщений для удаления', error);
            return [];
        }
    }
    
    // Отметка сообщения как удаленного
    async markMessageAsDeleted(messageId) {
        try {
            await this.db.collection('message_deletions').updateOne(
                { messageId: messageId },
                { $set: { isDeleted: true, deletedAt: new Date() } }
            );
            
            logger.info('Сообщение отмечено как удаленное', { messageId });
            
        } catch (error) {
            logger.error('Ошибка отметки сообщения как удаленного', error, { messageId });
    }
}

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ МАЙНЕРОВ ===

    // Создание майнера для пользователя из ключа
    async createMinerForUser(userId, minerType) {
        try {
            const minerInfo = MINER_TYPES[minerType.toUpperCase()];

            if (!minerInfo) {
                throw new Error(`Тип майнера ${minerType} не найден`);
            }

            // Получаем майнеры пользователя
            let userMiners = await this.getUserMiners(userId);
            if (!userMiners) {
                userMiners = [];
            }

            // Создаем новый майнер
            const newMiner = {
                id: `${minerType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                type: minerType,
                name: minerInfo.name,
                power: minerInfo.power,
                price: minerInfo.price,
                profit: minerInfo.profit,
                createdAt: new Date(),
                lastProfit: new Date(),
                isActive: true
            };

            // Добавляем майнер в массив пользователя
            userMiners.push(newMiner);

            // Сохраняем в базу данных
            await this.db.collection('user_miners').updateOne(
                { userId: Number(userId) },
                {
                    $set: {
                        userId: Number(userId),
                        miners: userMiners,
                        lastUpdated: new Date()
                    }
                },
                { upsert: true }
            );

            logger.info('Майнер создан для пользователя из ключа', {
                userId,
                minerType,
                minerId: newMiner.id
            });

            return newMiner;

        } catch (error) {
            logger.error('Ошибка создания майнера для пользователя', error, { userId, minerType });
            throw error;
        }
    }

    // Обновление количества майнеров на сервере
    async updateServerMinerCounts(counts) {
        try {
            await this.db.collection('server_data').updateOne(
                { type: 'miner_counts' },
                {
                    $set: {
                        counts: counts,
                        lastUpdated: new Date()
                    }
                },
                { upsert: true }
            );

            logger.info('Количество майнеров на сервере обновлено', { counts });

        } catch (error) {
            logger.error('Ошибка обновления количества майнеров на сервере', error, { counts });
            throw error;
        }
    }

    // Получение количества майнеров на сервере
    async getServerMinerCounts() {
        try {
            const result = await this.db.collection('server_data').findOne({ type: 'miner_counts' });
            return result ? result.counts : {};
        } catch (error) {
            logger.error('Ошибка получения количества майнеров на сервере', error);
            return {};
        }
    }



    // Генерация реферального кода (используем просто userId)
    generateReferralCode(userId) {
        return userId.toString();
    }

    // Получение пользователя по реферальному коду
    async getUserByReferralCode(referralCode) {
        try {
            // Конвертируем referralCode в число, так как теперь это userId
            const userId = parseInt(referralCode);
            if (isNaN(userId)) {
                logger.warn('Неверный формат реферального кода', { referralCode });
                return null;
            }

            const user = await this.getUser(userId);

            if (user) {
                logger.info('Пользователь найден по реферальному коду (userId)', {
                    referralCode,
                    userId: user.userId
                });
                return user;
            }

            logger.warn('Пользователь не найден по реферальному коду', { referralCode, userId });
            return null;

        } catch (error) {
            logger.error('Ошибка поиска пользователя по реферальному коду', error, { referralCode });
            throw error;
        }
    }

    // Получение реферального кода пользователя
    async getUserReferralCode(userId) {
        try {
            // Теперь реферальный код - это просто userId
            const referralCode = userId.toString();
            
            logger.info('Реферальный код (userId)', {
                userId,
                referralCode
            });

            return referralCode;

        } catch (error) {
            logger.error('Ошибка получения реферального кода', error, { userId });
            throw error;
        }
    }

    // Обновление баланса пользователя
    async updateUserBalance(userId, currency, amount, reason = 'unknown') {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                throw new Error(`Пользователь ${userId} не найден`);
            }

            // Инициализируем баланс если он не существует
            if (!user.balance) {
                user.balance = { stars: 0, coins: 0, totalEarned: { stars: 0, coins: 0 } };
            }
            if (!user.balance[currency]) {
                user.balance[currency] = 0;
            }
            if (!user.balance.totalEarned) {
                user.balance.totalEarned = { stars: 0, coins: 0 };
            }
            if (!user.balance.totalEarned[currency]) {
                user.balance.totalEarned[currency] = 0;
            }

            // Обновляем баланс
            user.balance[currency] += amount;
            user.balance.totalEarned[currency] += Math.max(0, amount); // Только положительные значения для totalEarned

            // Сохраняем в базу данных
            const result = await this.db.collection('users').updateOne(
                { userId: Number(userId) },
                {
                    $set: {
                        balance: user.balance,
                        lastActivity: new Date()
                    }
                }
            );

            logger.info('Баланс пользователя обновлен', {
                userId,
                currency,
                amount,
                newBalance: user.balance[currency],
                reason,
                result: result.modifiedCount
            });

            return result;

        } catch (error) {
            logger.error('Ошибка обновления баланса пользователя', error, { userId, currency, amount, reason });
            throw error;
        }
    }

    // Функция для отправки уведомления о реферальной награде
    async sendReferralRewardNotification(referrerId, newUserId, reward) {
        try {
            // Получаем экземпляр бота из bot/index.js
            const { bot } = require('../index');
            if (!bot) {
                logger.warn('Бот не инициализирован, не можем отправить уведомление', { referrerId, newUserId, reward });
                return;
            }

            const message = `🎉 **Поздравляем!**\n\n` +
                `👥 У вас новый реферал!\n` +
                `🆔 ID реферала: \`${newUserId}\`\n\n` +
                `💰 **Награда:**\n` +
                `├ ⭐ Stars: +${reward.stars}\n` +
                `└ 🪙 Magnum Coins: +${reward.coins}\n\n` +
                `🎯 Продолжайте приглашать друзей для получения еще больше наград!`;

            await bot.telegram.sendMessage(referrerId, message, { parse_mode: 'Markdown' });
            logger.info('Уведомление о реферальной награде отправлено', { referrerId, newUserId, reward });

        } catch (error) {
            logger.error('Ошибка отправки уведомления о реферальной награде', error, { referrerId, newUserId, reward });
        }
    }

    // Функция для отправки уведомления о регистрации по реферальному коду
    async sendReferralRegistrationNotification(userId, referrerId, reward) {
        try {
            // Получаем экземпляр бота из bot/index.js
            const { bot } = require('../index');
            if (!bot) {
                logger.warn('Бот не инициализирован, не можем отправить уведомление', { userId, referrerId, reward });
                return;
            }

            let message = `🎉 **Добро пожаловать в MagnumStarBot!**\n\n`;
            
            if (referrerId) {
                message += `👥 Вы зарегистрировались по реферальной ссылке!\n` +
                    `🆔 Ваш реферер: \`${referrerId}\`\n\n`;
            }
            
            message += `💰 **Бонус за регистрацию:**\n` +
                `└ 🪙 Magnum Coins: +${reward.coins}\n\n` +
                `🚀 Начните зарабатывать Stars и Magnum Coins прямо сейчас!`;

            await bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
            logger.info('Уведомление о регистрации по реферальному коду отправлено', { userId, referrerId, reward });

        } catch (error) {
            logger.error('Ошибка отправки уведомления о регистрации', error, { userId, referrerId, reward });
        }
    }

    // Функция для обновления сообщения о ключе в канале
    async updateKeyChannelMessage(key) {
        try {
            // Получаем экземпляр бота из bot/index.js
            const { bot } = require('../index');
            if (!bot) {
                logger.warn('Бот не инициализирован, не можем обновить сообщение', { key });
                return;
            }

            // Получаем актуальные данные ключа
            const keyDoc = await this.db.collection('keys').findOne({ key: key });
            if (!keyDoc) {
                logger.warn('Ключ не найден для обновления сообщения', { key });
                return;
            }

            // Определяем тип награды и количество
            let rewardTypeText = '';
            let rewardAmount = 0;
            
            if (keyDoc.type === 'stars') {
                rewardTypeText = '⭐ Stars';
                rewardAmount = keyDoc.reward.stars;
            } else if (keyDoc.type === 'coins') {
                rewardTypeText = '🪙 Magnum Coins';
                rewardAmount = keyDoc.reward.coins;
            } else if (keyDoc.type === 'miner') {
                const minerInfo = MINER_TYPES[keyDoc.minerType.toUpperCase()];
                rewardTypeText = `⛏️ ${minerInfo?.name || 'Майнер'}`;
                rewardAmount = 1;
            }

            // Определяем статус ключа
            const remainingUses = keyDoc.maxUses - keyDoc.currentUses;
            const isActive = remainingUses > 0;
            const statusEmoji = isActive ? '🟢' : '🔴';
            const statusText = isActive ? 'Активен' : 'Исчерпан лимит активаций';

            // Формируем обновленное сообщение
            const updatedMessage = `🎉 **Новый ключ доступен!**\n\n` +
                `🔑 **Код:** \`${keyDoc.key}\`\n` +
                `💰 **Награда:** ${rewardAmount} ${rewardTypeText}\n` +
                `🔄 **Доступно:** ${remainingUses} активаций\n` +
                `${statusEmoji} **Статус:** ${statusText}\n\n` +
                `⚡ Успей активировать ключ в боте и забери бонус первым!`;

            // Здесь нужно найти и обновить сообщение в канале
            // Пока что просто логируем обновление
            logger.info('Обновление сообщения о ключе в канале', { 
                key, 
                remainingUses, 
                isActive, 
                statusText 
            });

        } catch (error) {
            logger.error('Ошибка обновления сообщения о ключе в канале', error, { key });
        }
    }

    // Система активных рефералов
    async startActiveReferralsScheduler() {
        try {
            logger.info('🚀 Запускаем планировщик активных рефералов...');
            
            // Запускаем каждый день в 04:00
            this.activeReferralsInterval = setInterval(async () => {
                try {
                    const now = new Date();
                    const currentHour = now.getHours();
                    
                    // Проверяем, что сейчас 04:00
                    if (currentHour === 4) {
                        logger.info('⏰ 04:00 - запуск проверки активных рефералов...');
                        await this.updateActiveReferrals();
                    }
                } catch (error) {
                    logger.error('❌ Ошибка в планировщике активных рефералов', error);
                }
            }, 60000); // Проверяем каждую минуту
            
            logger.info('✅ Планировщик активных рефералов запущен (проверка каждый день в 04:00)');
            
        } catch (error) {
            logger.error('❌ Ошибка запуска планировщика активных рефералов', error);
        }
    }

    // Обновление активных рефералов
    async updateActiveReferrals() {
        try {
            logger.info('🔄 Начинаем обновление активных рефералов...');
            
            // Получаем всех пользователей с рефералами
            const usersWithReferrals = await this.db.collection('users').find({
                'referral.referralId': { $exists: true, $ne: null }
            }).toArray();
            
            logger.info(`🔍 Найдено пользователей с рефералами: ${usersWithReferrals.length}`);
            
            let totalActiveReferrals = 0;
            let totalRewardsGiven = 0;
            
            for (const user of usersWithReferrals) {
                try {
                    const result = await this.checkAndUpdateActiveReferrals(user.userId);
                    if (result.isActive) {
                        totalActiveReferrals++;
                        if (result.rewardGiven) {
                            totalRewardsGiven++;
                        }
                    }
                } catch (error) {
                    logger.error('Ошибка проверки активных рефералов для пользователя', error, { userId: user.userId });
                }
            }
            
            logger.info('✅ Обновление активных рефералов завершено', { 
                totalActiveReferrals, 
                totalRewardsGiven 
            });
            
        } catch (error) {
            logger.error('❌ Ошибка обновления активных рефералов', error);
        }
    }

    // Проверка и обновление активных рефералов для конкретного пользователя
    async checkAndUpdateActiveReferrals(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user || !user.referral) {
                return { isActive: false, rewardGiven: false };
            }
            
            // Получаем всех рефералов пользователя
            const referrals = await this.db.collection('referrals').find({
                referrerId: Number(userId)
            }).toArray();
            
            if (referrals.length === 0) {
                return { isActive: false, rewardGiven: false };
            }
            
            let activeReferralsCount = 0;
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            for (const referral of referrals) {
                const isActive = await this.isReferralActive(referral.userId, weekAgo);
                if (isActive) {
                    activeReferralsCount++;
                }
            }
            
            // Проверяем условия для активных рефералов
            const hasActiveReferrals = activeReferralsCount >= 5;
            const hasDailyUsage = await this.checkDailyUsage(userId);
            
            const isActive = hasActiveReferrals && hasDailyUsage;
            
            // Обновляем статус в базе данных
            await this.db.collection('users').updateOne(
                { userId: Number(userId) },
                { 
                    $set: { 
                        'referral.activeReferrals': activeReferralsCount,
                        'referral.isActiveReferrer': isActive,
                        'referral.lastActiveCheck': now
                    }
                }
            );
            
            // Если пользователь стал активным реферером, начисляем награду
            let rewardGiven = false;
            if (isActive && !user.referral.hasReceivedActiveReferrerBonus) {
                const reward = { stars: 50, coins: 5000 }; // 50 звезд + 5000 монет за активных рефералов
                
                await this.updateBalance(userId, reward.stars, reward.coins);
                
                // Обновляем общий заработок
                const currentEarned = user.referral.totalEarned || { stars: 0, coins: 0 };
                const newEarned = {
                    stars: currentEarned.stars + reward.stars,
                    coins: currentEarned.coins + reward.coins
                };
                
                await this.db.collection('users').updateOne(
                    { userId: Number(userId) },
                    { 
                        $set: { 
                            'referral.totalEarned': newEarned,
                            'referral.hasReceivedActiveReferrerBonus': true,
                            'referral.activeReferrerBonusReceivedAt': now
                        }
                    }
                );
                
                rewardGiven = true;
                logger.info('Награда за активных рефералов начислена', { userId, reward, newEarned });
            }
            
            return { isActive, rewardGiven };
            
        } catch (error) {
            logger.error('Ошибка проверки активных рефералов', error, { userId });
            return { isActive: false, rewardGiven: false };
        }
    }

    // Проверка активности реферала
    async isReferralActive(referralUserId, sinceDate) {
        try {
            // Проверяем использование бота в течение 5 дней подряд
            const userActivity = await this.db.collection('user_activity').find({
                userId: Number(referralUserId),
                lastActivity: { $gte: sinceDate }
            }).toArray();
            
            if (userActivity.length === 0) {
                return false;
            }
            
            // Проверяем, что пользователь использовал бота 5 дней подряд
            const activityDates = userActivity.map(activity => 
                new Date(activity.lastActivity).toDateString()
            );
            
            const uniqueDates = [...new Set(activityDates)];
            const hasConsecutiveDays = this.checkConsecutiveDays(uniqueDates, 5);
            
            // Проверяем, что реферал пригласил 5 человек за неделю
            const referralInvites = await this.db.collection('referrals').find({
                referrerId: Number(referralUserId),
                createdAt: { $gte: sinceDate }
            }).toArray();
            
            const hasEnoughInvites = referralInvites.length >= 5;
            
            return hasConsecutiveDays && hasEnoughInvites;
            
        } catch (error) {
            logger.error('Ошибка проверки активности реферала', error, { referralUserId });
            return false;
        }
    }

    // Проверка ежедневного использования бота
    async checkDailyUsage(userId) {
        try {
            const now = new Date();
            const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
            
            // Получаем активность пользователя за последние 5 дней
            const userActivity = await this.db.collection('user_activity').find({
                userId: Number(userId),
                lastActivity: { $gte: fiveDaysAgo }
            }).toArray();
            
            if (userActivity.length === 0) {
                return false;
            }
            
            // Проверяем, что пользователь использовал бота 5 дней подряд
            const activityDates = userActivity.map(activity => 
                new Date(activity.lastActivity).toDateString()
            );
            
            const uniqueDates = [...new Set(activityDates)];
            return this.checkConsecutiveDays(uniqueDates, 5);
            
        } catch (error) {
            logger.error('Ошибка проверки ежедневного использования', error, { userId });
            return false;
        }
    }

    // Проверка последовательных дней
    checkConsecutiveDays(dates, requiredDays) {
        if (dates.length < requiredDays) {
            return false;
        }
        
        // Сортируем даты
        const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));
        
        // Проверяем последовательность
        let consecutiveCount = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const previousDate = new Date(sortedDates[i - 1]);
            const diffDays = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                consecutiveCount++;
            } else {
                consecutiveCount = 1;
            }
            
            if (consecutiveCount >= requiredDays) {
                return true;
            }
        }
        
        return false;
    }

    // Получение статистики активных рефералов
    async getActiveReferralsStats(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user || !user.referral) {
                return { activeReferrals: 0, isActiveReferrer: false };
            }
            
            return {
                activeReferrals: user.referral.activeReferrals || 0,
                isActiveReferrer: user.referral.isActiveReferrer || false
            };
        } catch (error) {
            logger.error('Ошибка получения статистики активных рефералов', error, { userId });
            return { activeReferrals: 0, isActiveReferrer: false };
        }
    }

    // Обновление активности пользователя
    async updateUserActivity(userId) {
        try {
            const now = new Date();
            
            // Обновляем или создаем запись об активности
            await this.db.collection('user_activity').updateOne(
                { userId: Number(userId) },
                { 
                    $set: { 
                        lastActivity: now,
                        updatedAt: now
                    }
                },
                { upsert: true }
            );
            
            logger.debug('Активность пользователя обновлена', { userId, timestamp: now });
            
        } catch (error) {
            logger.error('Ошибка обновления активности пользователя', error, { userId });
        }
    }
}

// Создаем и экспортируем экземпляр
const dataManager = new DataManager();

module.exports = dataManager;
