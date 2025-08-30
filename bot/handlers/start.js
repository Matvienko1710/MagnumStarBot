const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const dataManager = require('../utils/dataManager');

// Обработчик команды /start
async function startHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const startPayload = ctx.startPayload; // ID реферера
        
        logger.info('Получена команда /start', { userId, startPayload });
        
        // Настраиваем реферальную систему для нового пользователя
        try {
            if (startPayload) {
                // Если есть ID реферера, настраиваем реферальную систему
                const referralData = await dataManager.setupReferral(userId, startPayload);
                logger.info('Реферальная система настроена для нового пользователя', { userId, referrerId: startPayload });
                
                // Добавляем уведомление о реферальной награде
                if (referralData.referrerId) {
                    const referralBonusMessage = `🎉 **Реферальная награда!**\n\n` +
                        `✅ Вы зарегистрировались по реферальной ссылке\n` +
                        `💰 Получили бонус: **1000 🪙 Magnum Coins**\n` +
                        `👥 Ваш реферер получил: **5 ⭐ Stars**\n\n` +
                        `🎯 Продолжайте зарабатывать вместе!`;
                    
                    await ctx.reply(referralBonusMessage, { parse_mode: 'Markdown' });
                }
            } else {
                // Если нет ID реферера, создаем пользователя без реферера
                await dataManager.setupReferral(userId);
                logger.info('Пользователь создан без реферера', { userId });
            }
        } catch (error) {
            logger.error('Ошибка настройки реферальной системы', error, { userId, startPayload });
            // Продолжаем выполнение, даже если реферальная система не настроена
        }
        
        const welcomeMessage = `🚀 **Добро пожаловать в Magnum Stars!**\n\n` +
            `💎 Твой путь к наградам уже начался!\n\n` +
            `🎮 Играй в Magnum Stars, зарабатывай Magnum Coins, обменивай их на ⭐ и выводи прямо в боте!\n\n` +
            `👤 **Профиль**\n` +
            `├ 🆔 ID: \`${userId}\`\n` +
            `└ ✨ Имя: ${ctx.from.first_name || 'Не указано'}\n\n` +
            `💎 **Баланс**\n` +
            `├ ⭐ Stars: 0\n` +
            `└ 🪙 Magnum Coins: 0\n\n` +
            `📊 **Информация о боте**\n` +
            `├ 👤 Пользователей: 0\n` +
            `└ 💎 Всего выведено: 0 ⭐\n\n` +
            `🎯 Выберите действие и двигайтесь дальше 🚀`;
        
        const mainMenu = Markup.inlineKeyboard([
            [Markup.button.callback('💰 Майнеры', 'miners')],
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
            [Markup.button.callback('👥 Рефералы', 'referrals')],
            [Markup.button.webApp('🌐 WebApp', 'https://magnumstarbot.onrender.com')],
            [Markup.button.callback('⚙️ Админ панель', 'admin_panel')]
        ]);
        
        await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: mainMenu.reply_markup
        });
        
        logger.info('Команда /start успешно обработана', { userId });
        
    } catch (error) {
        logger.error('Ошибка в обработчике команды /start', error, { userId: ctx?.from?.id });
        
        const errorMessage = `❌ **Ошибка запуска бота**\n\n` +
            `🚫 Не удалось запустить бота\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'start')]
        ]);
        
        await ctx.reply(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

module.exports = startHandler;