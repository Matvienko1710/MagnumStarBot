const express = require('express');
const router = express.Router();

// Используем тот же DataManager что и основной бот
const dataManager = require('../bot/utils/dataManager');

// Проверяем подключение к DataManager
async function ensureDataManagerConnection(req, res, next) {
    try {
        console.log('🔍 Проверка DataManager:', {
            isInitialized: dataManager.isInitialized,
            hasDb: !!dataManager.db,
            isConnected: dataManager.db ? dataManager.db.client && dataManager.db.isConnected : false
        });

        if (!dataManager.isInitialized || !dataManager.db) {
            console.log('❌ DataManager не инициализирован или нет подключения к БД');
            return res.status(503).json({
                error: 'Сервис временно недоступен',
                details: 'DataManager не готов к работе'
            });
        }

        console.log('✅ DataManager подключен и готов к работе');
        req.dataManager = dataManager;
        next();
    } catch (error) {
        console.error('❌ Ошибка подключения к DataManager:', error);
        res.status(500).json({ error: 'Ошибка подключения к DataManager', details: error.message });
    }
}

// Middleware для проверки подключения к БД
async function ensureDatabaseConnection(req, res, next) {
    try {
        // Используем DataManager для подключения к БД
        if (!dataManager.isInitialized) {
            await dataManager.initialize();
        }
        req.db = dataManager.db;
        next();
    } catch (error) {
        console.error('❌ Ошибка подключения к БД через DataManager:', error);
        res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }
}

// Middleware для валидации userId
function validateUserId(req, res, next) {
    const { userId } = req.params;

    if (!userId || isNaN(userId) || Number(userId) <= 0) {
        return res.status(400).json({
            error: 'Неверный ID пользователя',
            details: 'userId должен быть положительным числом'
        });
    }

    // Преобразуем в число для безопасности
    req.params.userId = Number(userId);
    next();
}

// Получение баланса пользователя
router.get('/user/balance/:userId', validateUserId, ensureDataManagerConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const dm = req.dataManager;

        console.log(`🔍 API: Запрос баланса для пользователя ${userId}`);
        console.log(`🔍 API: DataManager готов: ${!!dm && dm.isInitialized}`);
        console.log(`🔍 API: Время начала запроса: ${new Date().toISOString()}`);

        // Получаем пользователя через DataManager
        const user = await dm.getUser(Number(userId));

        console.log(`🔍 API: Пользователь найден: ${!!user}`);
        console.log(`🔍 API: Данные пользователя:`, user ? {
            userId: user.userId,
            balance: user.balance,
            lastActivity: user.lastActivity
        } : 'null');

        if (!user) {
            console.log(`❌ API: Пользователь ${userId} не найден`);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Возвращаем баланс
        const balance = user.balance || { stars: 0, coins: 0 };

        console.log(`✅ API: Баланс успешно получен для ${userId}:`, balance);
        console.log(`📊 API: Время завершения запроса: ${new Date().toISOString()}`);
        res.json({
            success: true,
            balance: {
                stars: balance.stars || 0,
                coins: balance.coins || 0,
                totalEarned: balance.totalEarned || { stars: 0, coins: 0 }
            },
            timestamp: new Date().toISOString(),
            lastActivity: user.lastActivity
        });

    } catch (error) {
        console.error('❌ API: Ошибка получения баланса:', error);
        console.error('❌ API: Стек ошибки:', error.stack);
        res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
});

// Обновление баланса (клик по кнопке)
router.post('/user/click/:userId', validateUserId, ensureDataManagerConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const dm = req.dataManager;

        console.log(`🔍 API: Клик по кнопке для пользователя ${userId}`);
        console.log(`🔍 API: Время начала клика: ${new Date().toISOString()}`);

        // Получаем пользователя через DataManager
        const user = await dm.getUser(Number(userId));

        if (!user) {
            console.log(`❌ API: Пользователь ${userId} не найден`);
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log(`🔍 API: Баланс до клика:`, user.balance);

        // Увеличиваем баланс Coins на 1 через DataManager
        const newBalance = await dm.updateBalance(Number(userId), 'coins', 1, 'webapp_click');

        console.log(`✅ API: updateBalance вернул:`, newBalance);

        // Получаем обновленный баланс
        const updatedUser = await dm.getUser(Number(userId));
        const balance = updatedUser.balance || { stars: 0, coins: 0 };

        console.log(`✅ API: Баланс после обновления:`, balance);
        console.log(`📊 API: Время завершения клика: ${new Date().toISOString()}`);

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
        console.error('❌ API: Ошибка обновления баланса:', error);
        console.error('❌ API: Стек ошибки:', error.stack);
        res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
});

// Получение статистики пользователя
router.get('/user/stats/:userId', validateUserId, ensureDataManagerConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const dm = req.dataManager;
        
        console.log(`🔍 API: Запрос статистики для пользователя ${userId}`);
        
        // Получаем пользователя через DataManager
        const user = await dm.getUser(Number(userId));
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Получаем количество транзакций через DataManager
        const transactionCount = await dm.db.collection('transactions').countDocuments({ userId: Number(userId) });
        
        // Получаем последнюю транзакцию
        const lastTransaction = await dm.db.collection('transactions')
            .findOne({ userId: Number(userId) }, { sort: { timestamp: -1 } });
        
        // Получаем статистику по дням
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTransactions = await dm.db.collection('transactions').countDocuments({
            userId: Number(userId),
            timestamp: { $gte: today },
            reason: 'webapp_click'
        });
        
        console.log(`✅ API: Статистика получена для ${userId}`);
        
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
        console.error('❌ API: Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение информации о пользователе
router.get('/user/info/:userId', validateUserId, ensureDataManagerConnection, async (req, res) => {
    try {
        const { userId } = req.params;
        const dm = req.dataManager;
        
        console.log(`🔍 API: Запрос информации для пользователя ${userId}`);
        
        // Получаем пользователя через DataManager
        const user = await dm.getUser(Number(userId));
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Получаем количество рефералов через DataManager
        const referralCount = await dm.db.collection('referrals').countDocuments({ referrerId: Number(userId) });
        
        console.log(`✅ API: Информация получена для ${userId}`);
        
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
        console.error('❌ API: Ошибка получения информации о пользователе:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Проверка здоровья API
router.get('/health', (req, res) => {
    console.log('🔍 API Health check вызван');
    console.log('🔍 API: Проверяем подключение к DataManager...');

    // Проверяем подключение к DataManager
    const isConnected = !!dataManager && dataManager.isInitialized;
    console.log(`🔍 API: DataManager подключен: ${isConnected}`);

    res.json({
        success: true,
        message: 'Magnum Stars WebApp API работает!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        gameSettings: {
            clickReward: '1 Magnum Coin',
            clickLimitPerSecond: 5
        },
        dataManager: {
            connected: isConnected,
            initialized: dataManager ? dataManager.isInitialized : false
        },
        endpoints: [
            '/api/health',
            '/api/user/balance/:userId',
            '/api/user/click/:userId',
            '/api/user/stats/:userId',
            '/api/user/info/:userId'
        ]
    });
});

// Логирование всех API запросов
router.use((req, res, next) => {
    console.log(`📡 API запрос: ${req.method} ${req.path}`);
    next();
});

// Обработка ошибок для API
router.use((err, req, res, next) => {
    console.error('❌ API ошибка:', err);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка API',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Диагностика системы майнинга
router.get('/mining/diagnose', ensureDataManagerConnection, async (req, res) => {
    try {
        console.log('🔍 Запрос диагностики системы майнинга');

        const diagnosis = await req.dataManager.diagnoseMiningSystem();

        if (diagnosis.error) {
            return res.status(500).json({
                success: false,
                error: 'Ошибка диагностики',
                details: diagnosis.error
            });
        }

        res.json({
            success: true,
            data: diagnosis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка выполнения диагностики майнинга:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка диагностики',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Обработка 404 для API
router.use('*', (req, res) => {
    console.log(`❌ API endpoint не найден: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'API endpoint не найден',
        requestedPath: req.originalUrl,
        availableEndpoints: [
            '/api/health',
            '/api/user/balance/:userId',
            '/api/user/click/:userId',
            '/api/user/stats/:userId',
            '/api/user/info/:userId',
            '/api/mining/diagnose'
        ]
    });
});

module.exports = router;
