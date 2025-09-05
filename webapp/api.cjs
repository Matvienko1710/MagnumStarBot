const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance, addCoins } = require('../bot/utils/currency');

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

// API для получения монет через клики
router.post('/click/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const numericUserId = parseInt(userId);
        
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }

        // Добавляем монеты пользователю через функцию addCoins
        const COINS_PER_CLICK = 1;
        const result = await addCoins(numericUserId, COINS_PER_CLICK);

        res.json({
            success: true,
            message: `Добавлено ${COINS_PER_CLICK} монет`,
            balance: result
        });
    } catch (error) {
        console.error('Ошибка при клике:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
    try {
        const { userId } = req.params;
        const numericUserId = parseInt(userId);

        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }

        // Обновляем баланс пользователя, добавляя 1 монету
        const newBalance = await dataManager.updateBalance(numericUserId, 'coins', 1, 'click-reward');
        
        res.json({
            success: true,
            balance: {
                stars: newBalance.stars || 0,
                coins: newBalance.coins || 0,
                totalEarned: newBalance.totalEarned || { stars: 0, coins: 0 },
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Ошибка при обработке клика:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

module.exports = router;