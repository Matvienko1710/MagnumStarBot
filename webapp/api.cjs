const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance } = require('../bot/utils/currency');

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
            coins: balance.coins || 0,
            totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
            lastUpdate: new Date().toISOString()
        };

        console.log(`📊 Получен баланс для пользователя ${numericUserId}:`, responseData);

        res.json({
            success: true,
            balance: responseData
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

module.exports = router;