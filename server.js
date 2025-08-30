const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { bot, launchBot } = require('./bot');
const logger = require('./bot/utils/logger');
const database = require('./bot/utils/database');
const { migrateDataToMongoDB } = require('./bot/utils/migration');

// Загрузка переменных окружения
dotenv.config();
logger.info('Запуск сервера', { 
  nodeVersion: process.version, 
  platform: process.platform,
  env: process.env.NODE_ENV || 'development'
});

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'webapp')));
app.use(express.json());

// Маршруты
app.get('/', (req, res) => {
  logger.request('GET', '/');
  res.sendFile(path.join(__dirname, 'webapp', 'index.html'));
  logger.response('GET', '/', 200);
});

// API для взаимодействия с ботом
app.post('/api/webhook', (req, res) => {
  logger.request('POST', '/api/webhook', req.body);
  const data = req.body;
  logger.info('Получены данные от WebApp', { data });
  res.json({ success: true });
  logger.response('POST', '/api/webhook', 200);
});

// API для проверки состояния базы данных
app.get('/api/health', async (req, res) => {
  logger.request('GET', '/api/health');
  try {
    const dbStatus = await database.ping();
    const dbStats = await database.getDatabaseStats();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus,
        stats: dbStats
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };
    
    logger.response('GET', '/api/health', 200, healthData);
    res.json(healthData);
  } catch (error) {
    logger.error('Ошибка проверки здоровья системы', error);
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    };
    
    logger.response('GET', '/api/health', 500, errorData);
    res.status(500).json(errorData);
  }
});

// Запуск сервера
const server = app.listen(PORT, async () => {
  logger.info(`Сервер запущен на порту ${PORT}`);
  
  try {
    // Подключаемся к базе данных
    logger.info('Подключение к базе данных...');
    await database.connect();
    
    // Инициализируем коллекции и индексы
    await database.initializeCollections();
    
    // Создаем базовые данные
    await database.createDefaultData();
    
    // Запускаем миграцию данных
    await migrateDataToMongoDB();
    
    logger.info('База данных готова к работе');
    
    // Запуск бота
    logger.info('Запуск бота...');
    launchBot();
  } catch (error) {
    logger.error('Критическая ошибка при инициализации', error);
    process.exit(1);
  }
});

// Корректное завершение работы
const gracefulShutdown = async (signal) => {
  logger.info(`Получен сигнал ${signal}. Начинаю graceful shutdown...`);
  
  try {
    // Останавливаем бота
    logger.info('Остановка бота...');
    await bot.stop(signal);
    logger.info('Бот успешно остановлен');
    
    // Закрываем соединение с базой данных
    logger.info('Закрытие соединения с базой данных...');
    await database.close();
    logger.info('Соединение с базой данных закрыто');
    
    // Останавливаем сервер
    server.close(() => {
      logger.info('HTTP сервер успешно остановлен');
      process.exit(0);
    });
    
    // Таймаут для принудительного завершения
    setTimeout(() => {
      logger.error('Принудительное завершение из-за таймаута');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    logger.error('Ошибка при graceful shutdown', error);
    process.exit(1);
  }
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Обработка необработанных ошибок процесса
process.on('uncaughtException', (error) => {
  logger.error('Необработанная ошибка процесса', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение промиса', error, { reason, promise });
  gracefulShutdown('unhandledRejection');
});