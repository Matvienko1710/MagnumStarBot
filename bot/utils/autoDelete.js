// Утилита для автоматического удаления сообщений

const messageCleaner = require('./messageCleaner');
const logger = require('./logger');

// Функция для автоматического планирования удаления сообщения бота
async function autoDeleteBotMessage(ctx, messageId = null) {
    try {
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        const msgId = messageId || ctx.message?.message_id;
        
        if (!msgId) {
            logger.warn('Не удалось получить ID сообщения для автоматического удаления', { chatId, userId });
            return;
        }

        // Планируем удаление сообщения бота через 15 секунд
        await messageCleaner.scheduleMessageDeletion(msgId, chatId, userId, 'bot');
        
        logger.info('Сообщение бота запланировано на автоматическое удаление', { 
            messageId: msgId, 
            chatId, 
            userId 
        });

    } catch (error) {
        logger.error('Ошибка планирования автоматического удаления сообщения бота', error, { 
            chatId: ctx.chat?.id, 
            userId: ctx.from?.id 
        });
    }
}

// Функция для автоматического планирования удаления сообщения пользователя
async function autoDeleteUserMessage(ctx) {
    try {
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        const messageId = ctx.message?.message_id;
        
        if (!messageId) {
            logger.warn('Не удалось получить ID сообщения пользователя для автоматического удаления', { chatId, userId });
            return;
        }

        // Планируем удаление сообщения пользователя через 15 секунд
        await messageCleaner.scheduleMessageDeletion(messageId, chatId, userId, 'user');
        
        logger.info('Сообщение пользователя запланировано на автоматическое удаление', { 
            messageId, 
            chatId, 
            userId 
        });

    } catch (error) {
        logger.error('Ошибка планирования автоматического удаления сообщения пользователя', error, { 
            chatId: ctx.chat?.id, 
            userId: ctx.from?.id 
        });
    }
}

// Функция для автоматического планирования удаления ответного сообщения
async function autoDeleteReplyMessage(ctx, messageId, isActiveMenu = false) {
    try {
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        
        if (!messageId) {
            logger.warn('Не удалось получить ID ответного сообщения для автоматического удаления', { chatId, userId });
            return;
        }

        // Если это активное меню с кнопками - НЕ планируем удаление
        if (isActiveMenu) {
            logger.info('Активное меню не планируется на удаление', { 
                messageId, 
                chatId, 
                userId 
            });
            return;
        }

        // Планируем удаление обычного сообщения через 15 секунд
        await messageCleaner.scheduleMessageDeletion(messageId, chatId, userId, 'bot');
        
        logger.info('Ответное сообщение запланировано на автоматическое удаление', { 
            messageId, 
            chatId, 
            userId 
        });

    } catch (error) {
        logger.error('Ошибка планирования автоматического удаления ответного сообщения', error, { 
            chatId: ctx.chat?.id, 
            userId: ctx.from?.id 
        });
    }
}

// Middleware для автоматического планирования удаления сообщений пользователя
function autoDeleteUserMessageMiddleware() {
    return async (ctx, next) => {
        try {
            // Планируем удаление сообщения пользователя
            await autoDeleteUserMessage(ctx);
            
            // Передаем управление следующему обработчику
            await next();
            
        } catch (error) {
            logger.error('Ошибка в middleware автоматического удаления сообщений пользователя', error, { 
                chatId: ctx.chat?.id, 
                userId: ctx.from?.id 
            });
            
            // Продолжаем выполнение даже при ошибке
            await next();
        }
    };
}

// Функция для отправки сообщений с умным планированием удаления
async function sendSmartMessage(ctx, message, options = {}, isActiveMenu = false) {
    try {
        let sentMessage;
        
        if (options.reply_markup) {
            // Если есть клавиатура - это активное меню, не планируем удаление
            sentMessage = await ctx.reply(message, options);
            if (!isActiveMenu) {
                await autoDeleteReplyMessage(ctx, sentMessage.message_id, false);
            }
        } else {
            // Обычное сообщение без кнопок - планируем удаление
            sentMessage = await ctx.reply(message, options);
            await autoDeleteReplyMessage(ctx, sentMessage.message_id, false);
        }
        
        return sentMessage;
    } catch (error) {
        logger.error('Ошибка отправки умного сообщения', error, { 
            chatId: ctx.chat?.id, 
            userId: ctx.from?.id 
        });
        throw error;
    }
}

// Функция для редактирования сообщений с умным планированием удаления
async function editSmartMessage(ctx, messageId, message, options = {}, isActiveMenu = false) {
    try {
        if (!isActiveMenu) {
            // Если это не активное меню - планируем удаление через 15 секунд
            await autoDeleteReplyMessage(ctx, messageId, false);
        }
        
        await ctx.editMessageText(message, options);
        
    } catch (error) {
        logger.error('Ошибка редактирования умного сообщения', error, { 
            chatId: ctx.chat?.id, 
            userId: ctx.from?.id,
            messageId 
        });
        throw error;
    }
}

module.exports = {
    autoDeleteBotMessage,
    autoDeleteUserMessage,
    autoDeleteReplyMessage,
    autoDeleteUserMessageMiddleware,
    sendSmartMessage,
    editSmartMessage
};
