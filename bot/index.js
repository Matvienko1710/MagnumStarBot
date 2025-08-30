const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

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
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${context} ERROR: ${error.message}`;
  const stackTrace = error.stack ? `\nStack trace:\n${error.stack}` : '';
  
  console.error(errorMessage + stackTrace);
  
  // В будущем здесь можно добавить отправку ошибок в внешние сервисы мониторинга
  // например, Sentry, LogRocket и т.д.
};

// Функция для безопасного выполнения асинхронных операций
const safeAsync = (fn) => {
  return async (ctx, next) => {
    try {
      await fn(ctx, next);
    } catch (error) {
      logError(error, `Handler error for user ${ctx.from?.id || 'unknown'}`);
      
      // Отправляем пользователю понятное сообщение об ошибке
      try {
        await ctx.reply(getErrorMessage('general'));
      } catch (replyError) {
        logError(replyError, 'Failed to send error message to user');
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
startHandler(bot, safeAsync);
infoHandler(bot, safeAsync);
callbackHandler(bot, safeAsync);

// Глобальная обработка ошибок
bot.catch((err, ctx) => {
  logError(err, `Global bot error for update type: ${ctx.updateType}`);
  
  // Попытка отправить сообщение пользователю о критической ошибке
  try {
    if (ctx.chat?.type === 'private') {
      ctx.reply(getErrorMessage('critical')).catch(replyError => {
        logError(replyError, 'Failed to send critical error message');
      });
    }
  } catch (error) {
    logError(error, 'Failed to handle critical error');
  }
});

// Обработка необработанных ошибок процесса
process.on('uncaughtException', (error) => {
  logError(error, 'Uncaught Exception');
  
  // В продакшене здесь можно добавить graceful shutdown
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`), 'Unhandled Rejection');
});

// Обработка ошибок при запуске бота
const launchBot = async () => {
  try {
    await bot.launch();
    console.log('✅ Бот успешно запущен');
  } catch (error) {
    logError(error, 'Bot launch failed');
    process.exit(1);
  }
};

module.exports = { bot, launchBot, logError };