const { Telegraf } = require('telegraf');
const logger = require('./utils/logger');
const messageCleaner = require('./utils/messageCleaner');

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

                    // Отправляем сообщение пользователю об ошибке ТОЛЬКО в личных чатах
                    if (ctx.chat?.type === 'private') {
                        try {
                            await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
                            logger.info('Отправлено сообщение об ошибке пользователю', {
                                userId: ctx?.from?.id
                            });
                        } catch (replyError) {
                            logger.error('Не удалось отправить сообщение об ошибке', replyError);
                        }
                    } else {
                        logger.info('Сообщение об ошибке НЕ отправлено - групповой чат', {
                            userId: ctx?.from?.id,
                            chatId: ctx?.chat?.id,
                            chatType: ctx?.chat?.type
                        });
                    }
                }
            };
        };

        // Регистрация обработчиков
        logger.info('Регистрация обработчиков...');

        // Middleware для ограничения команд в чате
        const { privateChatOnly } = require('./middleware/chatFilter');

        // Обработчик /start
        logger.info('Обработчик start зарегистрирован');
        const startHandler = require('./handlers/start');
        bot.start(safeAsync(privateChatOnly(startHandler)));

        // Обработчик текстовых сообщений
        logger.info('Обработчик info зарегистрирован');
        const infoHandler = require('./handlers/info');
        const { autoDeleteUserMessageMiddleware } = require('./utils/autoDelete');

        // Добавляем middleware для автоматического удаления сообщений пользователя
        bot.use(autoDeleteUserMessageMiddleware());

        // Специальный обработчик для канала выплат (без ограничения privateChatOnly)
        const withdrawalChannelHandler = async (ctx) => {
            try {
                // Проверяем, что сообщение из канала выплат
                if (ctx.chat.username === 'magnumwithdraw') {
                    const userId = ctx.from.id;
                    const text = ctx.message.text;

                    logger.info('Сообщение в канале выплат', { userId, chatId: ctx.chat.id, text });

                    // Проверяем, является ли пользователь админом
                    const { isAdmin } = require('./utils/admin');
                    if (!isAdmin(userId)) {
                        logger.warn('Неавторизованная попытка в канале выплат', { userId });
                        return;
                    }

                    // Обрабатываем числовые команды как ID заявок
                    const requestId = parseInt(text);
                    if (!isNaN(requestId)) {
                        logger.info('Обработка команды в канале выплат', { userId, requestId });

                        // Импортируем функции обработки заявок
                        const { handleApproveWithdrawal, handleRejectWithdrawal } = require('./handlers/callback');

                        // Создаем mock callbackQuery объект для одобрения
                        const mockCtx = {
                            ...ctx,
                            callbackQuery: {
                                data: `approve_withdrawal_${requestId}`,
                                message: ctx.message
                            },
                            answerCbQuery: async (text, showAlert) => {
                                if (text) {
                                    await ctx.reply(text);
                                }
                            },
                            editMessageText: async (text, options) => {
                                await ctx.reply(text, options);
                            }
                        };

                        // Обрабатываем как одобрение заявки
                        await handleApproveWithdrawal(mockCtx);
                        return;
                    }

                    // Обрабатываем текстовые команды
                    if (text.toLowerCase().includes('отклонить') || text.toLowerCase().includes('reject')) {
                        // Извлекаем ID заявки из текста (ожидаем формат "отклонить 123" или "reject 123")
                        const match = text.match(/(\d+)/);
                        if (match) {
                            const requestId = parseInt(match[1]);
                            logger.info('Обработка команды отклонения в канале выплат', { userId, requestId });

                            // Создаем mock callbackQuery объект для отклонения
                            const mockCtx = {
                                ...ctx,
                                callbackQuery: {
                                    data: `reject_withdrawal_${requestId}`,
                                    message: ctx.message
                                },
                                answerCbQuery: async (text, showAlert) => {
                                    if (text) {
                                        await ctx.reply(text);
                                    }
                                },
                                editMessageText: async (text, options) => {
                                    await ctx.reply(text, options);
                                }
                            };

                            // Обрабатываем как отклонение заявки
                            await handleRejectWithdrawal(mockCtx);
                            return;
                        }
                    }
                }

                // Для всех остальных сообщений используем обычный обработчик
                await infoHandler(ctx);

            } catch (error) {
                logger.error('Ошибка в обработчике канала выплат', error);
                throw error;
            }
        };

        // Регистрируем обработчик текстовых сообщений с поддержкой канала выплат
        bot.on('text', safeAsync(withdrawalChannelHandler));

        // Обработчик callback запросов для приватных чатов и каналов выплат
        logger.info('Обработчик callback зарегистрирован');
        const { callbackHandler } = require('./handlers/callback');

        // Отдельный обработчик для каналов выплат
        const withdrawalChannelCallbackHandler = async (ctx) => {
            try {
                // Проверяем, что это канал выплат
                if (ctx.chat?.username === 'magnumwithdraw') {
                    const userId = ctx.from.id;

                    logger.info('Callback в канале выплат', {
                        userId,
                        callbackData: ctx.callbackQuery.data,
                        chatId: ctx.chat.id,
                        chatType: ctx.chat.type,
                        messageId: ctx.callbackQuery.message?.message_id
                    });

                    // Проверяем, является ли пользователь админом
                    const { isAdmin } = require('./utils/admin');
                    if (!isAdmin(userId)) {
                        logger.warn('Неавторизованная попытка callback в канале выплат', { userId });
                        await ctx.answerCbQuery('❌ У вас нет доступа к управлению заявками', true);
                        return;
                    }

                    // Обрабатываем callback через основной обработчик
                    await callbackHandler(ctx);
                    return;
                }

                // Для всех остальных чатов используем основной обработчик с privateChatOnly
                await privateChatOnly(callbackHandler)(ctx);

            } catch (error) {
                logger.error('Ошибка в обработчике callback канала выплат', error);
                throw error;
            }
        };

        bot.on('callback_query', safeAsync(withdrawalChannelCallbackHandler));

        // Глобальная обработка ошибок
        bot.catch((error, ctx) => {
            logger.errorWithContext('Глобальная ошибка бота', error, {
                userId: ctx?.from?.id,
                chatId: ctx?.chat?.id,
                chatType: ctx?.chat?.type,
                messageType: ctx?.message?.text ? 'text' : 'callback',
                timestamp: new Date().toISOString(),
                errorStack: error.stack
            });

            // В групповых чатах НЕ отправляем никаких сообщений об ошибках
            if (ctx?.chat?.type !== 'private') {
                logger.info('Сообщение об ошибке НЕ отправлено в групповой чат', {
                    chatId: ctx?.chat?.id,
                    chatType: ctx?.chat?.type
                });
                return;
            }
        });

        // Интеграция системы автоматического удаления сообщений
        messageCleaner.setBot(bot);
        messageCleaner.start();
        
        logger.info('Система автоматического удаления сообщений интегрирована с ботом');



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