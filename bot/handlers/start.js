const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const { getUserBalance } = require('../utils/currency');
const { getReferralStats } = require('../utils/referral');

// Обработчик команды /start
async function startHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const username = ctx.from.username;
        
        logger.info('Команда /start', { userId, username });
        
        // Получаем баланс пользователя
        const userBalance = getUserBalance(userId);
        
        // Получаем реферальную статистику
        const referralStats = getReferralStats(userId);
        
        // Приветственное сообщение согласно новому дизайну
        const welcomeMessage = `🚀 **Добро пожаловать в Magnum Stars!**\n` +
            `💎 Твой путь к наградам уже начался!\n\n` +
            `🎮 Играй в Magnum Stars, зарабатывай Magnum Coins, обменивай их на ⭐ и выводи прямо в боте!\n\n` +
            `👤 **Профиль**\n` +
            `├ 🆔 ID: \`${userId}\`\n` +
            `└ ✨ Имя: ${ctx.from.first_name || 'Не указано'}\n\n` +
            `💎 **Баланс**\n` +
            `├ ⭐ Stars: ${userBalance.stars}\n` +
            `└ 🪙 Magnum Coins: ${userBalance.coins}\n\n` +
            `👥 **Реферальная программа**\n` +
            `├ 👥 Друзей приглашено: ${referralStats.totalReferrals}\n` +
            `└ 💰 Доход: ${referralStats.totalEarned.stars} ⭐\n\n` +
            `📊 **Информация о боте**\n` +
            `├ 👤 Пользователей: 0\n` +
            `└ 💎 Всего выведено: 0 ⭐\n\n` +
            `🎯 Выберите действие и двигайтесь дальше 🚀`;
        
        // Главное меню
        const mainMenu = Markup.inlineKeyboard([
            [Markup.button.callback('💰 Майнеры', 'miners')],
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
            [Markup.button.callback('👥 Рефералы', 'referrals')],
            [Markup.button.webApp('🌐 WebApp', 'https://magnumstarbot.onrender.com')],
            [Markup.button.callback('⚙️ Админ панель', 'admin_panel')]
        ]);
        
        // Отправляем первое сообщение
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