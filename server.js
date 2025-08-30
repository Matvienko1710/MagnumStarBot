const express = require('express');
const { Telegraf } = require('telegraf');
const database = require('./bot/utils/database');
const logger = require('./bot/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('webapp'));

// Переменная для отслеживания состояния базы данных
let isDatabaseConnected = false;

// Функция инициализации базы данных с повторными попытками
async function initializeDatabase() {
    const maxRetries = 3;
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
                maxRetries 
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
        
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                connected: isDatabaseConnected,
                status: isDatabaseConnected ? 'connected' : 'disconnected'
            },
            server: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                pid: process.pid
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
        
        logger.info('Приложение полностью инициализировано');
        
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