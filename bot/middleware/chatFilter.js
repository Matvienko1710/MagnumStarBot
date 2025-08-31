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

            try {
                await ctx.reply('❌ Команды бота доступны только в личных сообщениях!\n\n📱 Перейдите в @magnumtapbot для использования бота.', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '💬 Открыть бота',
                            url: 'https://t.me/magnumtapbot'
                        }]]
                    }
                });
            } catch (error) {
                console.error('Не удалось отправить сообщение о запрете команд в чате', error);
            }

            return; // Прерываем обработку
        }

        // Если личное сообщение - продолжаем обработку
        return handler(ctx, next);
    };
};

module.exports = { privateChatOnly };
