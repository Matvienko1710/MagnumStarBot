const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance } = require('../bot/utils/currency');

// API для получения баланса пользователя
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Получаем реальный баланс из базы данных
        const balance = await getUserBalance(userId);

        // Форматируем ответ
        const responseData = {
            stars: balance.stars || 0,
            magnumCoins: balance.coins || 0,
            totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
            lastUpdate: new Date().toISOString()
        };

        console.log(`📊 Получен баланс для пользователя ${userId}:`, responseData);

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
        const dataManager = require('../bot/utils/dataManager');

        // Получаем пользователя из базы данных
        const user = await dataManager.getUser(userId);

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

module.exports = router;
