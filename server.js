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
    console.log(`📊 Middleware: установлен startTime для ${req.method} ${req.path}: ${req.startTime}`);
    next();
});

// Основные middleware
app.use(express.json());

// API роуты вебаппа (должны быть ПЕРЕД статическими файлами)
const apiRoutes = require('./webapp/api');
app.use('/api', apiRoutes);

// Статические файлы вебаппа
app.use(express.static('webapp'));

// Явный маршрут для корневого пути вебаппа
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webapp/index.html');
});

// Webhook для Telegram бота
app.post('/webhook', (req, res) => {
    try {
        logger.info('Получен webhook от Telegram', {
            updateId: req.body.update_id,
            messageType: req.body.message ? 'message' : 'callback',
            chatId: req.body.message?.chat?.id || req.body.callback_query?.message?.chat?.id,
            userId: req.body.message?.from?.id || req.body.callback_query?.from?.id
        });

        const bot = require('./bot');
        bot.handleUpdate(req.body);

        res.status(200).send('OK');
    } catch (error) {
        logger.error('Ошибка обработки webhook', error);
        res.status(500).send('Error');
    }
});

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

        // Настройка webhook для production
        const webhookUrl = process.env.WEBHOOK_URL;
        const botToken = process.env.BOT_TOKEN;

        if (webhookUrl && botToken) {
            const fullWebhookUrl = `${webhookUrl}/webhook`;

            logger.info('Настройка webhook для бота', {
                webhookUrl: fullWebhookUrl,
                botToken: botToken.substring(0, 10) + '...'
            });

            // Устанавливаем webhook
            await bot.telegram.setWebhook(fullWebhookUrl);
            logger.info('✅ Webhook успешно настроен');

            // Проверяем статус webhook
            const webhookInfo = await bot.telegram.getWebhookInfo();
            logger.info('Статус webhook', {
                url: webhookInfo.url,
                hasCustomCertificate: webhookInfo.has_custom_certificate,
                pendingUpdateCount: webhookInfo.pending_update_count,
                lastErrorDate: webhookInfo.last_error_date,
                lastErrorMessage: webhookInfo.last_error_message
            });

        } else {
            logger.warn('WEBHOOK_URL или BOT_TOKEN не установлены, запускаем в режиме polling');
            // Для development используем polling
            if (process.env.NODE_ENV !== 'production') {
                await bot.launch();
                logger.info('✅ Бот запущен в режиме polling (development)');
            } else {
                throw new Error('WEBHOOK_URL и BOT_TOKEN обязательны для production');
            }
        }

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
// Простой health check для быстрого ответа
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Детальный health check (для отладки)
app.get('/api/health/detailed', async (req, res) => {
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
        
        const responseTime = Date.now() - req.startTime;
        console.log(`📊 Health check: startTime=${req.startTime}, now=${Date.now()}, responseTime=${responseTime}`);
        
        logger.response('Health check ответ', { 
            statusCode: 200, 
            responseTime: responseTime
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