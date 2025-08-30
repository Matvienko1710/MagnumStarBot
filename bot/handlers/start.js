const { Markup } = require('telegraf');
const logger = require('../utils/logger');

// Обработчик команды /start
async function startHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const username = ctx.from.username;
        
        logger.info('Команда /start', { userId, username });
        
        // Создаем профиль пользователя
        const userProfile = {
            userId: userId,
            username: username || 'Unknown',
            firstName: ctx.from.first_name || 'Unknown',
            lastName: ctx.from.last_name || '',
            joinDate: new Date(),
            stars: 0,
            coins: 0,
            level: 1,
            experience: 0
        };
        
        logger.debug('Профиль пользователя создан', { userId, profile: userProfile });
        
        // Приветственное сообщение
        const welcomeMessage = `🎉 Добро пожаловать в **Magnum Star Bot**!\n\n` +
            `👋 Привет, ${userProfile.firstName}!\n\n` +
            `⭐ **Stars** и 🪙 **Magnum Coins** ждут тебя!\n\n` +
            `🚀 Начни зарабатывать прямо сейчас!`;
        
        // Главное меню
        const mainMenu = Markup.inlineKeyboard([
            [Markup.button.callback('💰 Майнеры', 'miners')],
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
            [Markup.button.callback('👥 Рефералы', 'referrals')]
        ]);
        
        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: mainMenu.reply_markup
        });
        
        logger.info('Приветственное сообщение отправлено', { userId });
        
    } catch (error) {
        logger.error('Ошибка в обработчике /start', error, { userId: ctx?.from?.id });
        throw error;
    }
}

module.exports = startHandler;