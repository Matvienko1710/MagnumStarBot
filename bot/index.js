const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Загрузка переменных окружения
dotenv.config();
logger.info('Инициализация бота', { 
  botToken: process.env.BOT_TOKEN ? 'Установлен' : 'Не установлен',
  nodeEnv: process.env.NODE_ENV || 'development'
});

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);
logger.info('Бот создан', { botId: bot.botInfo?.id });

// Импорт обработчиков
const startHandler = require('./handlers/start');
const infoHandler = require('./handlers/info');
const callbackHandler = require('./handlers/callback');

// Импорт middleware
const {
  requestLogger,
  contextValidator,
  rateLimitMiddleware,
  stateManager,
  performanceMonitor,
  errorHandlerMiddleware
} = require('./middleware/errorMiddleware');

// Импорт конфигурации ошибок
const { getErrorMessage, isFeatureEnabled } = require('./config/errorConfig');

// Функция для логирования ошибок
const logError = (error, context = '') => {
  logger.errorWithContext(context, error);
};

// Функция для безопасного выполнения асинхронных операций
const safeAsync = (fn) => {
  return async (ctx, next) => {
    const userId = ctx.from?.id || 'unknown';
    const updateType = ctx.updateType || 'unknown';
    
    logger.function('safeAsync', { userId, updateType, functionName: fn.name || 'anonymous' });
    
    try {
      await fn(ctx, next);
      logger.function('safeAsync_success', { userId, updateType });
    } catch (error) {
      logger.errorWithContext(`Handler error for user ${userId}`, error, { userId, updateType });
      
      // Отправляем пользователю понятное сообщение об ошибке
      try {
        await ctx.reply(getErrorMessage('general'));
        logger.info('Отправлено сообщение об ошибке пользователю', { userId });
      } catch (replyError) {
        logger.errorWithContext('Failed to send error message to user', replyError, { userId });
      }
    }
  };
};

// Применение middleware (только если включены в конфигурации)
if (isFeatureEnabled('logging')) {
  bot.use(requestLogger);
}

bot.use(errorHandlerMiddleware);
bot.use(contextValidator);

if (isFeatureEnabled('rateLimit')) {
  bot.use(rateLimitMiddleware);
}

bot.use(stateManager);

if (isFeatureEnabled('performance')) {
  bot.use(performanceMonitor);
}

// Регистрация обработчиков с защитой от ошибок
logger.info('Регистрация обработчиков...');
startHandler(bot, safeAsync);
logger.info('Обработчик start зарегистрирован');
infoHandler(bot, safeAsync);
logger.info('Обработчик info зарегистрирован');
callbackHandler(bot, safeAsync);
logger.info('Обработчик callback зарегистрирован');

// Глобальная обработка ошибок
bot.catch((err, ctx) => {
  const userId = ctx.from?.id || 'unknown';
  const updateType = ctx.updateType || 'unknown';
  const chatType = ctx.chat?.type || 'unknown';
  
  logger.errorWithContext(`Global bot error for update type: ${updateType}`, err, { 
    userId, updateType, chatType 
  });
  
  // Попытка отправить сообщение пользователю о критической ошибке
  try {
    if (ctx.chat?.type === 'private') {
      ctx.reply(getErrorMessage('critical')).catch(replyError => {
        logger.errorWithContext('Failed to send critical error message', replyError, { userId });
      });
    }
  } catch (error) {
    logger.errorWithContext('Failed to handle critical error', error, { userId });
  }
});

// Обработка необработанных ошибок процесса
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  
  // В продакшене здесь можно добавить graceful shutdown
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`));
});

// Обработка ошибок при запуске бота
const launchBot = async () => {
  logger.info('Запуск бота...');
  try {
    await bot.launch();
    logger.info('Бот успешно запущен');
  } catch (error) {
    logger.error('Bot launch failed', error);
    process.exit(1);
  }
};

module.exports = { bot, launchBot, logError };