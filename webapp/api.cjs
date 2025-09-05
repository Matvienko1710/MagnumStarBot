const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance, addCoinsForClick, addStarsForAd } = require('../bot/utils/currency');

// API для получения баланса пользователя
router.get('/balance/:userId', async (req, res) => {
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

        const balance = await getUserBalance(numericUserId);
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

        // Добавляем монеты и получаем новый баланс
        const balance = await addCoinsForClick(numericUserId);
        
        res.json({
            success: true,
            message: 'Добавлена 1 монета',
            balance: {
                stars: balance.stars || 0,
                coins: balance.coins || 0,
                totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Ошибка при клике:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

// API для получения наград за просмотр рекламы
router.post('/reward/:userId/ad-watch', async (req, res) => {
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

        // Добавляем звезды за просмотр рекламы
        const balance = await addStarsForAd(numericUserId);
        
        res.json({
            success: true,
            message: 'Добавлено 0.05 звезд',
            balance: {
                stars: balance.stars || 0,
                coins: balance.coins || 0,
                totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Ошибка при начислении награды за рекламу:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

module.exports = router;
