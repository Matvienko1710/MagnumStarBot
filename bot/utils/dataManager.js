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
            // Индексы для пользователей
            await this.db.collection('users').createIndex({ userId: 1 }, { unique: true });
            await this.db.collection('users').createIndex({ username: 1 });
            
            // Индексы для транзакций
            await this.db.collection('transactions').createIndex({ userId: 1 });
            await this.db.collection('transactions').createIndex({ timestamp: -1 });
            
            // Индексы для рефералов
            await this.db.collection('referrals').createIndex({ userId: 1 }, { unique: true });
            await this.db.collection('referrals').createIndex({ referralCode: 1 }, { unique: true });
            await this.db.collection('referrals').createIndex({ referrerId: 1 });
            
            // Индексы для титулов
            await this.db.collection('userTitles').createIndex({ userId: 1 }, { unique: true });
            
            // Индексы для ключей
            await this.db.collection('keys').createIndex({ key: 1 }, { unique: true });
            await this.db.collection('keys').createIndex({ isActive: 1 });
            
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
                        code: null,
                        referrerId: null,
                        referrals: [],
                        totalEarned: { stars: 0, coins: 0 },
                        level: 1
                    },
                    titles: {
                        current: 'novice',
                        unlocked: ['novice'],
                        history: []
                    },
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
    
    async updateBalance(userId, currency, amount, reason = 'transaction') {
        try {
            const user = await this.getUser(userId);
            const oldBalance = user.balance[currency];
            const newBalance = oldBalance + amount;
            
            // Обновляем баланс
            await this.updateUser(userId, {
                [`balance.${currency}`]: newBalance,
                [`balance.totalEarned.${currency}`]: user.balance.totalEarned[currency] + (amount > 0 ? amount : 0)
            });
            
            // Записываем транзакцию
            await this.addTransaction(userId, currency, amount, reason, oldBalance, newBalance);
            
            logger.info('Баланс обновлен', { userId, currency, amount, reason, oldBalance, newBalance });
            
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
            
            await this.db.collection('transactions').insertOne(transaction);
            
            logger.info('Транзакция добавлена', { userId, currency, amount, reason });
            
        } catch (error) {
            logger.error('Ошибка добавления транзакции', error, { userId, currency, amount, reason });
        }
    }

    // === УПРАВЛЕНИЕ РЕФЕРАЛАМИ ===
    
    async getUserByReferralCode(referralCode) {
        try {
            const user = await this.db.collection('users').findOne({ 'referral.code': referralCode });
            return user;
        } catch (error) {
            logger.error('Ошибка поиска пользователя по реферальному коду', error, { referralCode });
            return null;
        }
    }
    
    async setupReferral(userId, referrerCode = null) {
        try {
            const user = await this.getUser(userId);
            
            if (user.referral.referrerId) {
                return user.referral; // Уже настроен
            }
            
            let referralCode = user.referral.code;
            if (!referralCode) {
                referralCode = this.generateReferralCode();
            }
            
            let referrerId = null;
            
            // Если передан реферальный код, находим реферера
            if (referrerCode) {
                const referrer = await this.getUserByReferralCode(referrerCode);
                if (referrer && referrer.userId !== userId) {
                    referrerId = referrer.userId;
                }
            }
            
            const referralData = {
                code: referralCode,
                referrerId: referrerId,
                referrals: [],
                totalEarned: { stars: 0, coins: 0 },
                level: 1
            };
            
            await this.updateUser(userId, { referral: referralData });
            
            // Если есть реферер, добавляем пользователя в его список
            if (referrerId) {
                await this.addReferralToUser(referrerId, userId);
            }
            
            logger.info('Реферальная система настроена', { userId, referrerId, referralCode });
            
            return referralData;
            
        } catch (error) {
            logger.error('Ошибка настройки реферальной системы', error, { userId, referrerCode });
            throw error;
        }
    }

    async addReferralToUser(referrerId, newUserId) {
        try {
            const referrer = await this.getUser(referrerId);
            const newReferrals = [...referrer.referral.referrals, newUserId];
            
            await this.updateUser(referrerId, {
                'referral.referrals': newReferrals
            });
            
            logger.info('Реферал добавлен к пользователю', { referrerId, newUserId });
            
        } catch (error) {
            logger.error('Ошибка добавления реферала', error, { referrerId, newUserId });
        }
    }

    async getReferralStats(userId) {
        try {
            const user = await this.getUser(userId);
            const referrals = user.referral.referrals;
            
            return {
                referralCode: user.referral.code,
                totalReferrals: referrals.length,
                activeReferrals: referrals.length, // Пока упрощенно
                totalEarned: user.referral.totalEarned,
                level: user.referral.level,
                referrals: referrals
            };
            
        } catch (error) {
            logger.error('Ошибка получения реферальной статистики', error, { userId });
            throw error;
        }
    }

    generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
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
}

// Создаем и экспортируем экземпляр
const dataManager = new DataManager();

module.exports = dataManager;
