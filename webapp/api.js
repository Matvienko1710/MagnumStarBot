const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance, updateCoins, updateStars } = require('../bot/utils/currency');
const dataManager = require('../bot/utils/dataManager');

// API для получения баланса пользователя
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Конвертируем userId в число, так как в базе данных он хранится как число
        const numericUserId = parseInt(userId);
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }

        // Получаем реальный баланс из базы данных
        const balance = await getUserBalance(numericUserId);

        // Форматируем ответ
        const responseData = {
            stars: balance.stars || 0,
            magnumCoins: balance.coins || 0,
            totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
            lastUpdate: new Date().toISOString()
        };

        console.log(`📊 Получен баланс для пользователя ${numericUserId}:`, responseData);

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Ошибка получения баланса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

// API для получения статистики
router.get('/stats', async (req, res) => {
    try {
        // Импортируем функцию для получения статистики
        const { getCurrencyStats } = require('../bot/utils/currency');
        const stats = await getCurrencyStats();

        // Добавляем дополнительную статистику
        const database = require('../bot/utils/database');
        if (database.isConnected) {
            const db = database.getDb();
            const totalUsers = await db.collection('users').countDocuments();
            const activeUsers = await db.collection('users').countDocuments({
                lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Активные за последние 24 часа
            });

            stats.totalUsers = totalUsers;
            stats.activeUsers = activeUsers;
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для получения leaderboard (топ пользователей)
router.get('/leaderboard', async (req, res) => {
    try {
        const database = require('../bot/utils/database');

        if (!database.isConnected) {
            throw new Error('База данных не подключена');
        }

        const db = database.getDb();

        // Получаем топ 10 пользователей по балансу звезд
        const leaderboard = await db.collection('users')
            .find({})
            .sort({ 'balance.stars': -1 })
            .limit(10)
            .project({
                userId: 1,
                first_name: 1,
                username: 1,
                balance: 1,
                _id: 0
            })
            .toArray();

        // Форматируем данные для ответа
        const formattedLeaderboard = leaderboard.map((user, index) => ({
            rank: index + 1,
            userId: user.userId,
            username: user.username || user.first_name || `User ${user.userId}`,
            stars: user.balance?.stars || 0,
            magnumCoins: user.balance?.coins || 0
        }));

        res.json({
            success: true,
            data: formattedLeaderboard
        });
    } catch (error) {
        console.error('Ошибка получения leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для получения профиля пользователя
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Конвертируем userId в число, так как в базе данных он хранится как число
        const numericUserId = parseInt(userId);
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }
        
        const dataManager = require('../bot/utils/dataManager');

        // Получаем пользователя из базы данных
        const user = await dataManager.getUser(numericUserId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        // Форматируем профиль
        const profile = {
            userId: user.userId,
            username: user.username || user.first_name,
            firstName: user.first_name,
            balance: {
                stars: user.balance?.stars || 0,
                magnumCoins: user.balance?.coins || 0,
                totalEarned: user.balance?.totalEarned || { stars: 0, coins: 0 }
            },
            energy: {
                current: user.energy?.current || 1000,
                max: user.energy?.max || 1000,
                lastRegen: user.energy?.lastRegen || new Date()
            },
            miners: user.miners || [],
            titles: user.titles || { current: 'novice', unlocked: ['novice'] },
            referral: user.referral || { count: 0, earned: 0 },
            createdAt: user.createdAt,
            lastActivity: user.lastActivity
        };

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для получения энергии пользователя
router.get('/energy/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const numericUserId = parseInt(userId);
        
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID'
            });
        }

        const user = await dataManager.getUser(numericUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        // Инициализируем энергию если её нет
        if (!user.energy) {
            await dataManager.updateUser(numericUserId, {
                energy: {
                    current: 1000,
                    max: 1000,
                    lastRegen: new Date()
                }
            });
        }

        // Рассчитываем восстановленную энергию
        const now = new Date();
        const lastRegen = new Date(user.energy?.lastRegen || now);
        const timeDiff = now - lastRegen;
        const energyRegenRate = 1; // 1 энергия в секунду
        const energyToRegen = Math.floor(timeDiff / 1000) * energyRegenRate;
        
        let currentEnergy = user.energy?.current || 1000;
        const maxEnergy = user.energy?.max || 1000;
        
        if (energyToRegen > 0) {
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyToRegen);
            await dataManager.updateUser(numericUserId, {
                'energy.current': currentEnergy,
                'energy.lastRegen': now
            });
        }

        res.json({
            success: true,
            data: {
                current: currentEnergy,
                max: maxEnergy,
                percentage: Math.round((currentEnergy / maxEnergy) * 100)
            }
        });
    } catch (error) {
        console.error('Ошибка получения энергии:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для клика по монете
router.post('/click/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const numericUserId = parseInt(userId);
        
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID'
            });
        }

        const user = await dataManager.getUser(numericUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        // Инициализируем энергию если её нет
        if (!user.energy) {
            await dataManager.updateUser(numericUserId, {
                energy: {
                    current: 1000,
                    max: 1000,
                    lastRegen: new Date()
                }
            });
        }

        // Проверяем энергию
        let currentEnergy = user.energy?.current || 1000;
        if (currentEnergy < 1) {
            return res.status(400).json({
                success: false,
                error: 'Недостаточно энергии',
                message: 'Нужно подождать восстановления энергии'
            });
        }

        // Начисляем награды
        await updateCoins(numericUserId, 1, 'coin_click');
        await updateStars(numericUserId, 0.001, 'coin_click');

        // Тратим энергию
        currentEnergy -= 1;
        await dataManager.updateUser(numericUserId, {
            'energy.current': currentEnergy,
            'energy.lastRegen': new Date()
        });

        // Получаем обновленный баланс
        const balance = await getUserBalance(numericUserId);

        res.json({
            success: true,
            data: {
                rewards: {
                    coins: 1,
                    stars: 0.001
                },
                energy: {
                    current: currentEnergy,
                    max: user.energy?.max || 1000,
                    percentage: Math.round((currentEnergy / (user.energy?.max || 1000)) * 100)
                },
                balance: {
                    stars: balance.stars,
                    magnumCoins: balance.coins
                }
            }
        });
    } catch (error) {
        console.error('Ошибка клика по монете:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

module.exports = router;
