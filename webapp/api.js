const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

// Подключение к MongoDB
let db = null;
let client = null;

async function connectToDatabase() {
    try {
        if (!client) {
            client = new MongoClient(process.env.MONGODB_URI);
            await client.connect();
            db = client.db();
            console.log('✅ WebApp подключен к MongoDB');
        }
        return db;
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        throw error;
    }
}

// Middleware для проверки подключения к БД
async function ensureDatabaseConnection(req, res, next) {
    try {
        req.db = await connectToDatabase();
        next();
    } catch (error) {
        res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }
}

// Получение баланса пользователя
router.get('/user/balance/:userId', ensureDatabaseConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = req.db;
        
        // Получаем пользователя из базы
        const user = await db.collection('users').findOne({ userId: Number(userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Возвращаем баланс
        const balance = user.balance || { stars: 0, coins: 0 };
        
        res.json({
            success: true,
            balance: {
                stars: balance.stars || 0,
                coins: balance.coins || 0,
                totalEarned: balance.totalEarned || { stars: 0, coins: 0 }
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения баланса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновление баланса (клик по кнопке)
router.post('/user/click/:userId', ensureDatabaseConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = req.db;
        
        // Получаем пользователя
        const user = await db.collection('users').findOne({ userId: Number(userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Увеличиваем баланс Stars на 1
        const currentStars = user.balance?.stars || 0;
        const newStars = currentStars + 1;
        
        // Обновляем баланс
        await db.collection('users').updateOne(
            { userId: Number(userId) },
            { 
                $set: { 
                    'balance.stars': newStars,
                    'balance.lastUpdated': new Date()
                },
                $inc: { 'balance.totalEarned.stars': 1 }
            }
        );
        
        // Записываем транзакцию
        await db.collection('transactions').insertOne({
            userId: Number(userId),
            currency: 'stars',
            amount: 1,
            reason: 'webapp_click',
            oldBalance: currentStars,
            newBalance: newStars,
            timestamp: new Date()
        });
        
        // Получаем обновленный баланс
        const updatedUser = await db.collection('users').findOne({ userId: Number(userId) });
        const balance = updatedUser.balance || { stars: 0, coins: 0 };
        
        res.json({
            success: true,
            message: 'Баланс обновлен!',
            balance: {
                stars: balance.stars || 0,
                coins: balance.coins || 0,
                totalEarned: balance.totalEarned || { stars: 0, coins: 0 }
            }
        });
        
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение статистики пользователя
router.get('/user/stats/:userId', ensureDatabaseConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = req.db;
        
        // Получаем пользователя
        const user = await db.collection('users').findOne({ userId: Number(userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Получаем количество транзакций
        const transactionCount = await db.collection('transactions').countDocuments({ userId: Number(userId) });
        
        // Получаем последнюю транзакцию
        const lastTransaction = await db.collection('transactions')
            .findOne({ userId: Number(userId) }, { sort: { timestamp: -1 } });
        
        // Получаем статистику по дням
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTransactions = await db.collection('transactions').countDocuments({
            userId: Number(userId),
            timestamp: { $gte: today },
            reason: 'webapp_click'
        });
        
        res.json({
            success: true,
            stats: {
                totalTransactions: transactionCount,
                totalEarned: user.balance?.totalEarned || { stars: 0, coins: 0 },
                todayClicks: todayTransactions,
                lastTransaction: lastTransaction ? {
                    amount: lastTransaction.amount,
                    currency: lastTransaction.currency,
                    reason: lastTransaction.reason,
                    timestamp: lastTransaction.timestamp
                } : null
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение информации о пользователе
router.get('/user/info/:userId', ensureDatabaseConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = req.db;
        
        // Получаем пользователя
        const user = await db.collection('users').findOne({ userId: Number(userId) });
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Получаем количество рефералов
        const referralCount = await db.collection('referrals').countDocuments({ referrerId: Number(userId) });
        
        res.json({
            success: true,
            user: {
                userId: user.userId,
                firstName: user.first_name,
                username: user.username,
                balance: user.balance || { stars: 0, coins: 0 },
                referral: {
                    referralId: user.referral?.referralId,
                    totalEarned: user.referral?.totalEarned || { stars: 0, coins: 0 },
                    referralCount: referralCount
                },
                createdAt: user.createdAt,
                lastActivity: user.lastActivity
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Проверка здоровья API
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Magnum Stars WebApp API работает!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
