const express = require('express');
const { Telegraf } = require('telegraf');
const database = require('./bot/utils/database');
const logger = require('./bot/utils/logger');
const cacheManager = require('./bot/utils/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('webapp'));

// Переменная для отслеживания состояния базы данных
let isDatabaseConnected = false;

// Функция инициализации базы данных с повторными попытками
async function initializeDatabase() {
    const maxRetries = 5; // Увеличиваем количество попыток
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            logger.info('Попытка подключения к MongoDB Atlas...', { 
                attempt: retryCount + 1, 
                maxRetries 
            });
            
            await database.connect();
            await database.initializeCollections();
            await database.createDefaultData();
            
            isDatabaseConnected = true;
            logger.info('База данных успешно инициализирована');
            return true;
            
        } catch (error) {
            retryCount++;
            logger.error('Ошибка подключения к MongoDB Atlas', error, { 
                attempt: retryCount, 
                maxRetries,
                errorMessage: error.message,
                errorCode: error.code
            });
            
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // Экспоненциальная задержка
                logger.info(`Повторная попытка через ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    logger.warn('Не удалось подключиться к MongoDB Atlas после всех попыток. Бот будет работать в режиме fallback.');
    return false;
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
                const dbStats = await database.getDatabaseStats();
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

// Middleware для измерения времени ответа
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
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

// Запуск сервера
async function startServer() {
    try {
        // Запускаем Express сервер
        app.listen(PORT, () => {
            logger.info('Сервер запущен', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                platform: process.platform
            });
        });
        
        // Инициализируем базу данных
        await initializeDatabase();
        
        // Запускаем бота
        await launchBot();
        
        logger.info('Приложение полностью инициализировано', {
            databaseConnected: isDatabaseConnected,
            mode: isDatabaseConnected ? 'full' : 'fallback'
        });
        
    } catch (error) {
        logger.error('Критическая ошибка при запуске сервера', error);
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