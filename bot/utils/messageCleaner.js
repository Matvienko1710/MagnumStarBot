// Система автоматического удаления сообщений

const logger = require('./logger');
const dataManager = require('./dataManager');

class MessageCleaner {
    constructor() {
        this.isRunning = false;
        this.cleanupInterval = null;
        this.cleanupIntervalMs = 5000; // Проверяем каждые 5 секунд
        this.bot = null;
    }

    // Запуск системы очистки
    start() {
        if (this.isRunning) {
            logger.info('Система очистки сообщений уже запущена');
            return;
        }

        this.isRunning = true;
        this.cleanupInterval = setInterval(() => {
            this.cleanupMessages();
        }, this.cleanupIntervalMs);

        logger.info('Система автоматического удаления сообщений запущена', { 
            interval: this.cleanupIntervalMs 
        });
    }

    // Остановка системы очистки
    stop() {
        if (!this.isRunning) {
            logger.info('Система очистки сообщений не запущена');
            return;
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        this.isRunning = false;
        logger.info('Система автоматического удаления сообщений остановлена');
    }

    // Очистка сообщений
    async cleanupMessages() {
        try {
            const messagesToDelete = await dataManager.getMessagesToDelete();
            
            if (messagesToDelete.length === 0) {
                return;
            }

            logger.info('Найдены сообщения для удаления', { count: messagesToDelete.length });

            for (const message of messagesToDelete) {
                try {
                    await this.deleteMessage(message);
                } catch (error) {
                    logger.error('Ошибка удаления сообщения', error, { messageId: message.messageId });
                }
            }

        } catch (error) {
            logger.error('Ошибка очистки сообщений', error);
        }
    }

    // Установка экземпляра бота
    setBot(bot) {
        this.bot = bot;
        logger.info('Экземпляр бота установлен в MessageCleaner');
    }

    // Удаление конкретного сообщения
    async deleteMessage(message) {
        try {
            if (!this.bot) {
                logger.warn('Бот не установлен, пропускаем удаление сообщения', { messageId: message.messageId });
                return;
            }

            // Удаляем сообщение через Telegram API
            try {
                await this.bot.telegram.deleteMessage(message.chatId, message.messageId);
                logger.info('Сообщение удалено через Telegram API', { 
                    messageId: message.messageId,
                    chatId: message.chatId
                });
            } catch (telegramError) {
                // Если не удалось удалить через API, логируем ошибку
                logger.warn('Не удалось удалить сообщение через Telegram API', { 
                    messageId: message.messageId,
                    chatId: message.chatId,
                    error: telegramError.message
                });
            }

            // Отмечаем как удаленное в базе данных
            await dataManager.markMessageAsDeleted(message.messageId);
            
            logger.info('Сообщение отмечено как удаленное в базе данных', { 
                messageId: message.messageId,
                chatId: message.chatId,
                userId: message.userId,
                messageType: message.messageType
            });

        } catch (error) {
            logger.error('Ошибка удаления сообщения', error, { messageId: message.messageId });
        }
    }

    // Планирование удаления сообщения
    async scheduleMessageDeletion(messageId, chatId, userId, messageType = 'bot') {
        try {
            await dataManager.logMessageForDeletion(messageId, chatId, userId, messageType);
            
            logger.info('Сообщение запланировано на удаление', { 
                messageId, 
                chatId, 
                userId, 
                messageType 
            });

        } catch (error) {
            logger.error('Ошибка планирования удаления сообщения', error, { messageId, chatId, userId });
        }
    }

    // Получение статуса системы
    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.cleanupIntervalMs,
            nextCleanup: this.isRunning ? 'через 5 секунд' : 'остановлена'
        };
    }
}

// Создаем и экспортируем экземпляр
const messageCleaner = new MessageCleaner();

module.exports = messageCleaner;
