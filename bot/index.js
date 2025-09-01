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

        // Обработка скриншота выплаты от админа
        const handlePaymentScreenshot = async (ctx, requestId, withdrawalRequest) => {
            try {
                const userId = ctx.from.id;
                const messageType = ctx.message.photo ? 'photo' : ctx.message.document ? 'document' : 'text';
                
                logger.info('📸 Обработка скриншота выплаты', { 
                    userId, 
                    requestId, 
                    messageType,
                    hasPhoto: !!ctx.message.photo,
                    hasDocument: !!ctx.message.document
                });
                
                if (messageType === 'photo') {
                    // Получаем фото с максимальным размером
                    const photo = ctx.message.photo[ctx.message.photo.length - 1];
                    const fileId = photo.file_id;
                    
                    // Сохраняем информацию о скриншоте в базе данных
                    const { dataManager } = require('./utils/dataManager');
                    await dataManager.db.collection('withdrawals').updateOne(
                        { id: requestId },
                        { 
                            $set: { 
                                paymentScreenshot: {
                                    fileId: fileId,
                                    uploadedAt: new Date(),
                                    uploadedBy: userId
                                },
                                status: 'payment_confirmed'
                            }
                        }
                    );
                    
                    // Обновляем сообщение в канале
                    const updatedMessage = `📋 **Заявка на вывод - ВЫПЛАТА ПОДТВЕРЖДЕНА** ✅\n\n` +
                        `👤 **Пользователь:**\n` +
                        `├ 🆔 ID: \`${withdrawalRequest.userId}\`\n` +
                        `├ 👤 Имя: ${withdrawalRequest.firstName}\n` +
                        `└ 🏷️ Username: ${withdrawalRequest.username}\n\n` +
                        `💰 **Детали заявки:**\n` +
                        `├ 🆔 ID заявки: \`${withdrawalRequest.id}\`\n` +
                        `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
                        `├ 📅 Дата: ${new Date(withdrawalRequest.createdAt).toLocaleDateString('ru-RU')}\n` +
                        `└ ⏰ Время: ${new Date(withdrawalRequest.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
                        `📸 **Скриншот выплаты прикреплен:**\n` +
                        `├ ✅ Статус: Выплата подтверждена\n` +
                        `├ 📅 Дата: ${new Date().toLocaleDateString('ru-RU')}\n` +
                        `└ 💡 **Заявка полностью обработана**`;
                    
                    // Создаем клавиатуру, видимую только админам
                    const updatedKeyboard = {
                        inline_keyboard: [
                            [
                                {
                                    text: '✅ Заявка завершена',
                                    callback_data: `complete_withdrawal_${requestId}`,
                                    web_app: undefined
                                }
                            ]
                        ]
                    };
                    
                    await ctx.reply(updatedMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: updatedKeyboard
                    });
                    
                    // Уведомляем пользователя
                    await ctx.telegram.sendMessage(withdrawalRequest.userId, 
                        `🎉 **Ваша выплата подтверждена!**\n\n` +
                        `📋 **Детали заявки:**\n` +
                        `├ 🆔 ID: \`${withdrawalRequest.id}\`\n` +
                        `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
                        `└ ✅ Статус: Выплата подтверждена\n\n` +
                        `📸 **Скриншот выплаты прикреплен администратором**\n` +
                        `⏰ **Дата подтверждения:** ${new Date().toLocaleDateString('ru-RU')}\n\n` +
                        `💡 **Выплата успешно завершена!**`
                    );
                    
                    logger.info('Скриншот выплаты успешно обработан', { userId, requestId, fileId });
                    
                } else if (messageType === 'document') {
                    // Обработка документа
                    const document = ctx.message.document;
                    await ctx.reply('📄 Документ получен, но для скриншота лучше использовать фото. Попробуйте отправить скриншот как изображение.');
                    
                } else {
                    // Текстовое сообщение
                    await ctx.reply('📝 Для подтверждения выплаты отправьте скриншот как изображение, а не текст.');
                }
                
            } catch (error) {
                logger.error('Ошибка обработки скриншота выплаты', error, { userId: ctx.from.id, requestId });
                await ctx.reply('❌ Ошибка при обработке скриншота. Попробуйте еще раз.');
            }
        };

        // Специальный обработчик для канала поддержки
        const supportChannelHandler = async (ctx) => {
            try {
                // Проверяем, что сообщение из канала поддержки
                if (ctx.chat.username === 'magnumsupported') {
                    const userId = ctx.from.id;
                    const text = ctx.message.text;
                    const hasPhoto = !!ctx.message.photo;
                    const hasDocument = !!ctx.message.document;

                    logger.info('Сообщение в канале поддержки', { 
                        userId, 
                        chatId: ctx.chat.id, 
                        text,
                        hasPhoto,
                        hasDocument,
                        messageType: hasPhoto ? 'photo' : hasDocument ? 'document' : 'text'
                    });

                    // Проверяем, является ли пользователь админом
                    const { isAdmin } = require('./utils/admin');
                    if (!isAdmin(userId)) {
                        logger.warn('Неавторизованная попытка в канале поддержки', { userId });
                        return;
                    }

                    // Проверяем, находится ли админ в состоянии ответа на тикет
                    const { userStates } = require('./handlers/callback');
                    const userState = userStates.get(userId);
                    
                    if (userState && userState.state === 'replying_to_ticket') {
                        logger.info('Админ отвечает на тикет поддержки', { userId, ticketId: userState.data.ticketId });
                        
                        // Обрабатываем ответ на тикет
                        await handleTicketReply(ctx, userState.data.ticketId, userState.data.ticketData);
                        
                        // Очищаем состояние
                        userStates.delete(userId);
                        return;
                    }
                }

                // Для всех остальных сообщений используем обычный обработчик
                await infoHandler(ctx);

            } catch (error) {
                logger.error('Ошибка в обработчике канала поддержки', error);
                throw error;
            }
        };

        // Обработка ответа на тикет поддержки от админа
        const handleTicketReply = async (ctx, ticketId, ticketData) => {
            try {
                const userId = ctx.from.id;
                const messageType = ctx.message.photo ? 'photo' : ctx.message.document ? 'document' : 'text';
                
                logger.info('💬 Обработка ответа на тикет поддержки', { 
                    userId, 
                    ticketId, 
                    messageType,
                    hasPhoto: !!ctx.message.photo,
                    hasDocument: !!ctx.message.document
                });
                
                if (messageType === 'photo') {
                    // Получаем фото с максимальным размером
                    const photo = ctx.message.photo[ctx.message.photo.length - 1];
                    const fileId = photo.file_id;
                    
                    // Сохраняем ответ админа в базе данных
                    const { dataManager } = require('./utils/dataManager');
                    await dataManager.db.collection('support_tickets').updateOne(
                        { id: ticketId },
                        { 
                            $push: { 
                                messages: {
                                    type: 'admin',
                                    content: '[Скриншот]',
                                    fileId: fileId,
                                    timestamp: new Date(),
                                    userId: userId
                                }
                            },
                            $set: { updatedAt: new Date() }
                        }
                    );
                    
                    // Уведомляем пользователя
                    await ctx.telegram.sendPhoto(ticketData.userId, fileId, {
                        caption: `💬 **Ответ администратора на тикет #${ticketId}**\n\n` +
                            `👨‍💼 **Админ:** ${ctx.from.first_name || 'Не указано'}\n` +
                            `⏰ **Время:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
                            `📸 **Скриншот прикреплен**`
                    });
                    
                } else if (messageType === 'document') {
                    // Обработка документа
                    const document = ctx.message.document;
                    await ctx.reply('📄 Документ получен, но для ответа лучше использовать фото или текст.');
                    
                } else if (messageType === 'text') {
                    // Текстовый ответ
                    const { dataManager } = require('./utils/dataManager');
                    await dataManager.db.collection('support_tickets').updateOne(
                        { id: ticketId },
                        { 
                            $push: { 
                                messages: {
                                    type: 'admin',
                                    content: ctx.message.text,
                                    timestamp: new Date(),
                                    userId: userId
                                }
                            },
                            $set: { updatedAt: new Date() }
                        }
                    );
                    
                    // Уведомляем пользователя
                    await ctx.telegram.sendMessage(ticketData.userId, 
                        `💬 **Ответ администратора на тикет #${ticketId}**\n\n` +
                            `👨‍💼 **Админ:** ${ctx.from.first_name || 'Не указано'}\n` +
                            `⏰ **Время:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n\n` +
                            `💬 **Сообщение:**\n${ctx.message.text}`
                    );
                }
                
                // Обновляем сообщение в канале
                const updatedMessage = `🆘 **Тикет поддержки - ОТВЕЧЕН** 💬\n\n` +
                    `👤 **Пользователь:**\n` +
                    `├ 🆔 ID: \`${ticketData.userId}\`\n` +
                    `├ 👤 Имя: ${ticketData.firstName}\n` +
                    `└ 🏷️ Username: ${ticketData.username ? `@${ticketData.username}` : '@username'}\n\n` +
                    `📋 **Детали тикета:**\n` +
                    `├ 🆔 ID тикета: \`${ticketId}\`\n` +
                    `├ 📝 Описание: ${ticketData.description.substring(0, 200)}${ticketData.description.length > 200 ? '...' : ''}\n` +
                    `├ 📅 Дата: ${new Date(ticketData.createdAt).toLocaleDateString('ru-RU')}\n` +
                    `└ ⏰ Время: ${new Date(ticketData.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
                    `👨‍💼 **Ответил:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n` +
                    `👤 **Админ:** ${ctx.from.first_name || 'Не указано'}\n\n` +
                    `💬 **Ответ отправлен пользователю**`;
                
                // Создаем клавиатуру, видимую только админам
                const updatedKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: '✅ Закрыть тикет',
                                callback_data: `close_ticket_${ticketId}`,
                                web_app: undefined
                            }
                        ]
                    ]
                };
                
                try {
                    await ctx.editMessageText(updatedMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: updatedKeyboard
                    });
                } catch (editError) {
                    logger.error('Ошибка обновления сообщения в канале поддержки', editError, { userId, ticketId });
                }
                
                logger.info('Ответ на тикет поддержки успешно отправлен', { userId, ticketId, messageType });
                
            } catch (error) {
                logger.error('Ошибка обработки ответа на тикет', error, { userId: ctx.from.id, ticketId });
                await ctx.reply('❌ Ошибка при отправке ответа. Попробуйте еще раз.');
            }
        };

        // Специальный обработчик для канала выплат (без ограничения privateChatOnly)
        const withdrawalChannelHandler = async (ctx) => {
            try {
                // Проверяем, что сообщение из канала выплат
                if (ctx.chat.username === 'magnumwithdraw') {
                    const userId = ctx.from.id;
                    const text = ctx.message.text;
                    const hasPhoto = !!ctx.message.photo;
                    const hasDocument = !!ctx.message.document;

                    logger.info('Сообщение в канале выплат', { 
                        userId, 
                        chatId: ctx.chat.id, 
                        text,
                        hasPhoto,
                        hasDocument,
                        messageType: hasPhoto ? 'photo' : hasDocument ? 'document' : 'text'
                    });

                    // Проверяем, является ли пользователь админом
                    const { isAdmin } = require('./utils/admin');
                    if (!isAdmin(userId)) {
                        logger.warn('Неавторизованная попытка в канале выплат', { userId });
                        return;
                    }

                    // Проверяем, находится ли админ в состоянии ожидания скриншота
                    const { userStates } = require('./handlers/callback');
                    const userState = userStates.get(userId);
                    
                    if (userState && userState.state === 'waiting_for_payment_screenshot') {
                        logger.info('Админ отправляет скриншот выплаты', { userId, requestId: userState.data.requestId });
                        
                        // Обрабатываем скриншот
                        await handlePaymentScreenshot(ctx, userState.data.requestId, userState.data.withdrawalRequest);
                        
                        // Очищаем состояние
                        userStates.delete(userId);
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

        // Регистрируем обработчики сообщений с поддержкой каналов
        bot.on('text', safeAsync(async (ctx) => {
            // Сначала проверяем канал поддержки
            if (ctx.chat?.username === 'magnumsupported') {
                await supportChannelHandler(ctx);
            } else if (ctx.chat?.username === 'magnumwithdraw') {
                await withdrawalChannelHandler(ctx);
            } else {
                await infoHandler(ctx);
            }
        }));
        
        bot.on('photo', safeAsync(async (ctx) => {
            if (ctx.chat?.username === 'magnumsupported') {
                await supportChannelHandler(ctx);
            } else if (ctx.chat?.username === 'magnumwithdraw') {
                await withdrawalChannelHandler(ctx);
            } else {
                await infoHandler(ctx);
            }
        }));
        
        bot.on('document', safeAsync(async (ctx) => {
            if (ctx.chat?.username === 'magnumsupported') {
                await supportChannelHandler(ctx);
            } else if (ctx.chat?.username === 'magnumwithdraw') {
                await withdrawalChannelHandler(ctx);
            } else {
                await infoHandler(ctx);
            }
        }));

        // Обработчик callback запросов для всех типов чатов
        logger.info('Обработчик callback зарегистрирован');
        const { callbackHandler } = require('./handlers/callback');

        // Универсальный обработчик callback для всех типов чатов
        const universalCallbackHandler = async (ctx) => {
            try {
                const userId = ctx.from.id;
                const callbackData = ctx.callbackQuery.data;
                const chatType = ctx.chat?.type;
                const chatUsername = ctx.chat?.username;

                logger.info('=== CALLBACK ЗАПРОС ПОЛУЧЕН ===', {
                    userId,
                    callbackData,
                    chatType,
                    chatUsername,
                    chatId: ctx.chat?.id,
                    messageId: ctx.callbackQuery?.message?.message_id,
                    timestamp: new Date().toISOString()
                });

                // Специальная обработка для канала выплат
                if (chatUsername === 'magnumwithdraw') {
                    logger.info('🎯 Обработка callback в канале выплат', {
                        userId,
                        callbackData,
                        chatId: ctx.chat.id
                    });

                    // Проверяем, является ли пользователь админом
                    const { isAdmin } = require('./utils/admin');
                    if (!isAdmin(userId)) {
                        logger.warn('❌ Неавторизованная попытка callback в канале выплат', {
                            userId,
                            callbackData,
                            chatId: ctx.chat.id
                        });
                        await ctx.answerCbQuery('❌ У вас нет доступа к управлению заявками', true);
                        return;
                    }

                    logger.info('✅ Админ подтвердил в канале выплат, обрабатываем callback', {
                        userId,
                        callbackData
                    });

                    // Обрабатываем callback через основной обработчик
                    await callbackHandler(ctx);
                    return;
                }

                // Для приватных чатов проверяем ограничение
                if (chatType !== 'private') {
                    logger.warn('❌ Callback из неподдерживаемого типа чата', {
                        userId,
                        callbackData,
                        chatType,
                        chatUsername
                    });
                    await ctx.answerCbQuery('❌ Этот тип чата не поддерживается', true);
                    return;
                }

                // Для приватных чатов обрабатываем обычным образом
                logger.info('📱 Обработка callback в приватном чате', {
                    userId,
                    callbackData
                });

                await callbackHandler(ctx);

            } catch (error) {
                logger.error('💥 Критическая ошибка в универсальном обработчике callback', error, {
                    userId: ctx?.from?.id,
                    callbackData: ctx?.callbackQuery?.data,
                    chatType: ctx?.chat?.type,
                    chatUsername: ctx?.chat?.username
                });
                throw error;
            }
        };

        bot.on('callback_query', safeAsync(universalCallbackHandler));

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