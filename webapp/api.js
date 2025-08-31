const express = require('express');
const router = express.Router();

// API для получения баланса пользователя
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Здесь должна быть логика получения баланса из базы данных
        // Пока возвращаем тестовые данные
        const balance = {
            stars: 1250,
            magnumCoins: 5678,
            lastUpdate: new Date().toISOString()
        };

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('Ошибка получения баланса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для обновления баланса
router.post('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { stars, magnumCoins } = req.body;

        // Здесь должна быть логика обновления баланса в базе данных
        console.log(`Обновление баланса для пользователя ${userId}:`, { stars, magnumCoins });

        res.json({
            success: true,
            message: 'Баланс обновлен',
            data: {
                stars: stars || 0,
                magnumCoins: magnumCoins || 0,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// API для получения статистики
router.get('/stats', async (req, res) => {
    try {
        // Здесь должна быть логика получения статистики
        const stats = {
            totalUsers: 1250,
            activeUsers: 890,
            totalTransactions: 5670,
            lastUpdate: new Date().toISOString()
        };

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

// API для получения leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        // Здесь должна быть логика получения топа пользователей
        const leaderboard = [
            { userId: '1', username: 'user1', stars: 5000, magnumCoins: 25000 },
            { userId: '2', username: 'user2', stars: 4500, magnumCoins: 22000 },
            { userId: '3', username: 'user3', stars: 4000, magnumCoins: 20000 },
        ];

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Ошибка получения leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

module.exports = router;
