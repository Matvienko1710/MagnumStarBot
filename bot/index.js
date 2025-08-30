const { Telegraf } = require('telegraf');
const logger = require('./utils/logger');

// Инициализация бота
function initializeBot() {
    try {
        const botToken = process.env.BOT_TOKEN;
        if (!botToken) {
            throw new Error('BOT_TOKEN не установлен в переменных окружения');
        }

        logger.info('Инициализация бота', {
            botToken: 'Установлен',
            nodeEnv: process.env.NODE_ENV || 'development'
        });

        const bot = new Telegraf(botToken);
        logger.info('Бот создан');

        // Настройка логирования ошибок
        const logError = (error, ctx) => {
            logger.errorWithContext('Ошибка в боте', error, {
                userId: ctx?.from?.id,
                chatId: ctx?.chat?.id,
                messageType: ctx?.message?.text ? 'text' : 'callback',
                timestamp: new Date().toISOString()
            });
        };

        // Безопасная обертка для асинхронных обработчиков
        const safeAsync = (handler) => {
            return async (ctx, next) => {
                try {
                    logger.function('Выполнение обработчика', {
                        handler: handler.name || 'anonymous',
                        userId: ctx?.from?.id,
                        chatId: ctx?.chat?.id
                    });

                    await handler(ctx, next);
                    
                } catch (error) {
                    logger.errorWithContext('Ошибка в обработчике', error, {
                        handler: handler.name || 'anonymous',
                        userId: ctx?.from?.id,
                        chatId: ctx?.chat?.id,
                        message: ctx?.message?.text || 'callback'
                    });

                    // Отправляем сообщение пользователю об ошибке
                    try {
                        await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
                        logger.info('Отправлено сообщение об ошибке пользователю', {
                            userId: ctx?.from?.id
                        });
                    } catch (replyError) {
                        logger.error('Не удалось отправить сообщение об ошибке', replyError);
                    }
                }
            };
        };

        // Регистрация обработчиков
        logger.info('Регистрация обработчиков...');

        // Обработчик /start
        logger.info('Обработчик start зарегистрирован');
        const startHandler = require('./handlers/start');
        bot.start(safeAsync(startHandler));

        // Обработчик текстовых сообщений
        logger.info('Обработчик info зарегистрирован');
        const infoHandler = require('./handlers/info');
        bot.on('text', safeAsync(infoHandler));

        // Обработчик callback запросов
        logger.info('Обработчик callback зарегистрирован');
        const callbackHandler = require('./handlers/callback');
        bot.on('callback_query', safeAsync(callbackHandler));

        // Глобальная обработка ошибок
        bot.catch((error, ctx) => {
            logger.errorWithContext('Глобальная ошибка бота', error, {
                userId: ctx?.from?.id,
                chatId: ctx?.chat?.id,
                messageType: ctx?.message?.text ? 'text' : 'callback',
                timestamp: new Date().toISOString(),
                errorStack: error.stack
            });
        });

        // Обработка ошибок процесса
        process.on('uncaughtException', (error) => {
            logger.error('Необработанная ошибка процесса', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Необработанное отклонение промиса', { reason, promise });
        });

        // Функция запуска бота
        const launchBot = async () => {
            try {
                logger.info('Запуск бота...');
                await bot.launch();
                logger.info('Бот успешно запущен');
            } catch (error) {
                logger.error('Ошибка запуска бота', error);
                throw error;
            }
        };

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`Получен сигнал ${signal}. Остановка бота...`);
            try {
                await bot.stop(signal);
                logger.info('Бот успешно остановлен');
                process.exit(0);
            } catch (error) {
                logger.error('Ошибка при остановке бота', error);
                process.exit(1);
            }
        };

        process.once('SIGINT', () => gracefulShutdown('SIGINT'));
        process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

        return { bot, launchBot };

    } catch (error) {
        logger.error('Критическая ошибка при инициализации бота', error);
        throw error;
    }
}

// Создаем и инициализируем бота
const { bot, launchBot } = initializeBot();

// Автоматически запускаем бота
launchBot().catch(error => {
    logger.error('Критическая ошибка при запуске бота', error);
    process.exit(1);
});

// Экспортируем бота и функцию запуска
module.exports = { bot, launchBot };