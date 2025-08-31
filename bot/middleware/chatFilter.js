// Middleware для фильтрации типов чатов
const privateChatOnly = (handler) => {
    return async (ctx, next) => {
        // Проверяем тип чата
        const chatType = ctx.chat?.type;
        const chatId = ctx.chat?.id;
        const userId = ctx.from?.id;

        // Разрешаем только личные сообщения
        if (chatType !== 'private') {
            // Исключение: разрешаем администраторам работать в канале выплат
            const chatUsername = ctx.chat?.username;
            const isAdminChannel = chatUsername === 'magnumwithdraw' ||
                                 chatId?.toString().includes('magnumwithdraw') ||
                                 ctx.chat?.title?.includes('выплат');

            if (isAdminChannel) {
                // Проверяем, является ли пользователь администратором
                try {
                    const { isAdmin } = require('../utils/admin');
                    const userIsAdmin = await isAdmin(userId);

                    if (userIsAdmin) {
                        console.log(`✅ Администратор ${userId} работает в канале выплат`, {
                            chatId,
                            chatUsername,
                            userId
                        });
                        // Продолжаем обработку для администраторов
                        return handler(ctx, next);
                    } else {
                        console.log(`🚫 Не-администратор ${userId} пытается использовать команды в канале выплат`, {
                            chatId,
                            chatUsername,
                            userId
                        });
                    }
                } catch (error) {
                    console.error('Ошибка проверки администратора в канале выплат:', error);
                }
            }

            console.log(`🚫 Попытка использовать команду в ${chatType} чате`, {
                userId: ctx.from?.id,
                chatId: ctx.chat?.id,
                chatUsername: ctx.chat?.username,
                chatTitle: ctx.chat?.title,
                chatType: chatType,
                message: ctx.message?.text || 'callback',
                callbackData: ctx.callbackQuery?.data
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
