// Middleware для фильтрации типов чатов
const privateChatOnly = (handler) => {
    return async (ctx, next) => {
        // Проверяем тип чата
        const chatType = ctx.chat?.type;

        // Разрешаем только личные сообщения
        if (chatType !== 'private') {
            console.log(`🚫 Попытка использовать команду в ${chatType} чате`, {
                userId: ctx.from?.id,
                chatId: ctx.chat?.id,
                chatType: chatType,
                message: ctx.message?.text || 'callback'
            });

            // В групповых чатах НЕ отправляем никаких сообщений бота
            // Это предотвратит любые автоматические ответы, уведомления и т.д.
            return; // Прерываем обработку без отправки сообщений
        }

        // Если личное сообщение - продолжаем обработку
        return handler(ctx, next);
    };
};

// Специальная функция для отправки уведомлений ТОЛЬКО в определенный канал
const sendChannelNotification = async (ctx, message, channelUsername = '@magnumtapchat') => {
    try {
        // Проверяем, что это именно канал для уведомлений
        if (channelUsername !== '@magnumtapchat') {
            console.warn('🚫 Попытка отправить уведомление не в разрешенный канал', { channelUsername });
            return false;
        }

        await ctx.telegram.sendMessage(channelUsername, message, {
            parse_mode: 'Markdown'
        });

        console.log('✅ Уведомление отправлено в канал', { channelUsername });
        return true;

    } catch (error) {
        console.error('❌ Не удалось отправить уведомление в канал:', error);
        return false;
    }
};

module.exports = { privateChatOnly, sendChannelNotification };
