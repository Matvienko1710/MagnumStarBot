const express = require('express');
const { Telegraf } = require('telegraf');
const database = require('./bot/utils/database');
const dataManager = require('./bot/utils/dataManager');
const logger = require('./bot/utils/logger');
const cacheManager = require('./bot/utils/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для измерения времени ответа (должен быть ПЕРЕД всеми маршрутами)
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Основные middleware
app.use(express.json());
app.use(express.static('webapp'));

// Переменная для отслеживания состояния базы данных
let isDatabaseConnected = false;

// Простая инициализация базы данных
async function initializeDatabase() {
    try {
        logger.info('Подключение к MongoDB Atlas...');
        
        await database.connect();
        isDatabaseConnected = true;
        
        // Инициализируем DataManager для работы с данными
        await dataManager.initialize();
        
        logger.info('✅ База данных успешно подключена');
        return true;
        
    } catch (error) {
        logger.error('❌ Ошибка подключения к MongoDB Atlas', error);
        isDatabaseConnected = false;
        return false;
    }
}

// Функция запуска бота
async function launchBot() {
    try {
        logger.info('Запуск бота...');
        
        // Инициализируем бота
        const bot = require('./bot');
        
        if (isDatabaseConnected) {
            logger.info('Бот запущен с подключением к базе данных');
        } else {
            logger.warn('Бот запущен в режиме fallback (без базы данных)');
        }
        
        return bot;
        
    } catch (error) {
        logger.error('Ошибка запуска бота', error);
        throw error;
    }
}

// Health Check API
app.get('/api/health', async (req, res) => {
    try {
        logger.request('Health check запрос', { 
            method: req.method, 
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        
        const memUsage = process.memoryUsage();
        const cacheStats = cacheManager.getStats();
        
        const healthData = {
            status: isDatabaseConnected ? 'ok' : 'warning',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                connected: isDatabaseConnected,
                status: isDatabaseConnected ? 'connected' : 'disconnected',
                message: isDatabaseConnected ? 'Database connected successfully' : 'Database connection failed - running in fallback mode'
            },
            server: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: {
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
                    external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
                },
                pid: process.pid
            },
            cache: {
                totalSize: cacheStats.totalSize,
                hits: cacheStats.hits,
                misses: cacheStats.misses,
                evictions: cacheStats.evictions,
                hitRate: cacheStats.hits + cacheStats.misses > 0 ? 
                    Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) : 0
            }
        };
        
        // Если база данных подключена, получаем статистику
        if (isDatabaseConnected) {
            try {
                // Получаем базовую статистику БД
                const db = database.getDb();
                const collections = await db.listCollections().toArray();
                const collectionNames = collections.map(col => col.name);
                
                const dbStats = {
                    collections: collectionNames.length,
                    collectionNames: collectionNames,
                    status: 'connected'
                };
                
                healthData.database.stats = dbStats;
            } catch (error) {
                logger.error('Ошибка получения статистики БД для health check', error);
                healthData.database.stats = 'error';
            }
        }
        
        logger.response('Health check ответ', { 
            statusCode: 200, 
            responseTime: Date.now() - req.startTime 
        });
        
        res.status(200).json(healthData);
        
    } catch (error) {
        logger.error('Ошибка health check', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// API для управления кэшем
app.get('/api/cache/stats', (req, res) => {
    try {
        const stats = cacheManager.getStats();
        const memUsage = process.memoryUsage();
        
        const response = {
            ...stats,
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
                rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
            }
        };
        
        res.json(response);
    } catch (error) {
        logger.error('Ошибка получения статистики кэша', error);
        res.status(500).json({ error: 'Failed to get cache stats' });
    }
});

app.post('/api/cache/clear', (req, res) => {
    try {
        const beforeStats = cacheManager.getStats();
        cacheManager.clear();
        const afterStats = cacheManager.getStats();
        
        const response = {
            success: true,
            message: 'Cache cleared successfully',
            before: beforeStats,
            after: afterStats,
            freed: beforeStats.totalSize - afterStats.totalSize
        };
        
        logger.info('Кэш очищен через API', response);
        res.json(response);
    } catch (error) {
        logger.error('Ошибка очистки кэша', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});



// Обработка ошибок
app.use((error, req, res, next) => {
    logger.error('Ошибка Express', error, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
    });
});

// Проверка на уже запущенный процесс
let isServerStarting = false;

// Запуск сервера
async function startServer() {
    // Проверяем, не запускается ли уже сервер
    if (isServerStarting) {
        logger.warn('Сервер уже запускается, пропускаем повторный запуск');
        return;
    }
    
    isServerStarting = true;
    
    try {
        logger.info('🚀 Начинаем запуск сервера...');
        
        // Запускаем Express сервер
        const server = app.listen(PORT, () => {
            logger.info('✅ Express сервер запущен', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                platform: process.platform
            });
        });
        
        // Инициализируем базу данных
        logger.info('🔌 Инициализация базы данных...');
        await initializeDatabase();
        
        // Запускаем бота
        logger.info('🤖 Запуск Telegram бота...');
        await launchBot();
        
        logger.info('🎉 Приложение полностью инициализировано', {
            databaseConnected: isDatabaseConnected,
            mode: isDatabaseConnected ? 'full' : 'fallback'
        });
        
        // Сбрасываем флаг запуска
        isServerStarting = false;
        
    } catch (error) {
        logger.error('❌ Критическая ошибка при запуске сервера', error);
        isServerStarting = false;
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Получен сигнал SIGTERM, начинаем graceful shutdown...');
    
    try {
        if (isDatabaseConnected) {
            await database.close();
            logger.info('Соединение с базой данных закрыто');
        }
        
        logger.info('Graceful shutdown завершен');
        process.exit(0);
        
    } catch (error) {
        logger.error('Ошибка при graceful shutdown', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    logger.info('Получен сигнал SIGINT, начинаем graceful shutdown...');
    
    try {
        if (isDatabaseConnected) {
            await database.close();
            logger.info('Соединение с базой данных закрыто');
        }
        
        logger.info('Graceful shutdown завершен');
        process.exit(0);
        
    } catch (error) {
        logger.error('Ошибка при graceful shutdown', error);
        process.exit(1);
    }
});

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
    logger.error('Необработанная ошибка', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Необработанное отклонение промиса', { reason, promise });
    process.exit(1);
});

// Запускаем сервер
startServer();