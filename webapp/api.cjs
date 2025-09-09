const express = require('express');
const router = express.Router();

// Импортируем функции для работы с данными
const { getUserBalance, addCoinsForClick, addStarsForAd, updateCoins, updateStars } = require('../bot/utils/currency');

// API для получения баланса пользователя
router.get('/balance/:userId', async (req, res) => {
    console.log('🔍 GET /api/balance/:userId - запрос получен:', {
        userId: req.params.userId,
        timestamp: new Date().toISOString()
    });
    
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

// API для обновления баланса (списание/начисление)
router.post('/balance/:userId', async (req, res) => {
    console.log('🔍 POST /api/balance/:userId - запрос получен:', {
        userId: req.params.userId,
        body: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
    
    try {
        const { userId } = req.params;
        const { type, amount, reason } = req.body;
        const numericUserId = parseInt(userId);
        
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }

        if (!type || amount === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Неверные параметры',
                message: 'Требуются параметры type и amount'
            });
        }

        if (!['coins', 'stars'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный тип валюты',
                message: 'Тип должен быть "coins" или "stars"'
            });
        }

        const numericAmount = parseInt(amount);
        if (isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                error: 'Неверная сумма',
                message: 'Сумма должна быть числом'
            });
        }

        console.log(`💰 Обновляем баланс для пользователя ${numericUserId}:`, { type, amount: numericAmount, reason });

        // Обновляем баланс
        let updatedBalance;
        if (type === 'coins') {
            updatedBalance = await updateCoins(numericUserId, numericAmount, reason);
        } else if (type === 'stars') {
            updatedBalance = await updateStars(numericUserId, numericAmount, reason);
        }

        const responseData = {
            stars: updatedBalance.stars || 0,
            coins: updatedBalance.coins || 0,
            totalEarned: updatedBalance.totalEarned || { stars: 0, coins: 0 },
            lastUpdate: new Date().toISOString()
        };

        console.log(`✅ Баланс обновлен для пользователя ${numericUserId}:`, responseData);

        res.json({
            success: true,
            message: 'Баланс обновлен успешно',
            ...responseData,
            balance: responseData
        });
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

// API для наград кейсов
router.post('/reward/:userId/case-reward', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, amount, item, rarity } = req.body;
        const numericUserId = parseInt(userId);
        
        if (isNaN(numericUserId)) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат User ID',
                message: 'User ID должен быть числом'
            });
        }

        if (!type || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Неверные параметры',
                message: 'Требуются параметры type и amount'
            });
        }

        console.log(`🎁 Выдаем награду кейса для пользователя ${numericUserId}:`, { type, amount, item, rarity });

        // Начисляем награду
        let updatedBalance;
        if (type === 'coins') {
            updatedBalance = await updateCoins(numericUserId, amount, `case_reward_${item}`);
        } else if (type === 'stars') {
            updatedBalance = await updateStars(numericUserId, amount, `case_reward_${item}`);
        }

        const responseData = {
            stars: updatedBalance.stars || 0,
            coins: updatedBalance.coins || 0,
            totalEarned: updatedBalance.totalEarned || { stars: 0, coins: 0 },
            lastUpdate: new Date().toISOString()
        };

        console.log(`✅ Награда кейса выдана пользователю ${numericUserId}:`, responseData);

        res.json({
            success: true,
            message: `Получена награда: ${item}`,
            ...responseData,
            balance: responseData
        });
    } catch (error) {
        console.error('Ошибка выдачи награды кейса:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
            message: error.message
        });
    }
});

module.exports = router;
