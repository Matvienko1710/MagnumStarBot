const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const dataManager = require('../utils/dataManager');

// Хранилище последних сообщений бота для каждого пользователя
const lastBotMessages = new Map();

// Обработчик команды /start
async function startHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const startPayload = ctx.startPayload; // ID реферера
        
        logger.info('Получена команда /start', { userId, startPayload });
        
        // Проверяем подписку пользователя на канал
        const subscriptionCheck = await dataManager.checkUserSubscription(userId);
        
        if (!subscriptionCheck.isSubscribed) {
            // Пользователь не подписан - показываем экран подписки
            const subscriptionMessage = `🔒 **Требуется подписка на канал**\n\n` +
                `📢 Для использования бота необходимо подписаться на канал **@magnumtap**\n\n` +
                `📋 **Что нужно сделать:**\n` +
                `1️⃣ Нажмите кнопку "📢 Подписаться на канал"\n` +
                `2️⃣ Подпишитесь на канал @magnumtap\n` +
                `3️⃣ Вернитесь в бот и нажмите "✅ Проверить подписку"\n\n` +
                `💡 После подтверждения подписки вы получите доступ ко всем функциям бота!`;
            
            const subscriptionKeyboard = Markup.inlineKeyboard([
                [Markup.button.url('📢 Подписаться на канал', 'https://t.me/magnumtap')],
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')],
                [Markup.button.callback('🔄 Попробовать снова', 'start')]
            ]);
            
            // Удаляем старое сообщение бота, если оно есть
            const lastMessageId = lastBotMessages.get(userId);
            if (lastMessageId) {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                    logger.info('Старое сообщение бота удалено', { userId, messageId: lastMessageId });
                } catch (error) {
                    logger.warn('Не удалось удалить старое сообщение', { userId, messageId: lastMessageId, error: error.message });
                }
            }
            
            // Отправляем сообщение о необходимости подписки
            const newMessage = await ctx.reply(subscriptionMessage, {
                parse_mode: 'Markdown',
                reply_markup: subscriptionKeyboard.reply_markup
            });
            
            // Сохраняем ID нового сообщения
            lastBotMessages.set(userId, newMessage.message_id);
            logger.info('Сообщение о подписке отправлено', { userId, messageId: newMessage.message_id });
            
            return; // Прерываем выполнение, пока пользователь не подпишется
        }
        
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
                    
                    // Отправляем сообщение о реферальной награде
                    const referralMessage = await ctx.reply(referralBonusMessage, { parse_mode: 'Markdown' });
                    
                    // Сохраняем ID сообщения о реферальной награде
                    lastBotMessages.set(userId, referralMessage.message_id);
                    logger.info('Сообщение о реферальной награде отправлено и сохранено', { userId, messageId: referralMessage.message_id });
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
        
        // Получаем актуальный баланс пользователя
        const userBalance = await dataManager.getUserBalance(userId);
        
        // Получаем статистику бота
        const botStats = await dataManager.getBotStats();
        
        const welcomeMessage = `🚀 **Добро пожаловать в Magnum Stars!**\n\n` +
            `💎 Твой путь к наградам уже начался!\n\n` +
            `🎮 Играй в Magnum Stars, зарабатывай Magnum Coins, обменивай их на ⭐ и выводи прямо в боте!\n\n` +
            `👤 **Профиль**\n` +
            `├ 🆔 ID: \`${userId}\`\n` +
            `└ ✨ Имя: ${ctx.from.first_name || 'Не указано'}\n\n` +
            `💎 **Баланс**\n` +
            `├ ⭐ Stars: ${userBalance.stars}\n` +
            `└ 🪙 Magnum Coins: ${userBalance.coins}\n\n` +
            `📊 **Информация о боте**\n` +
            `├ 👤 Пользователей: ${botStats.totalUsers}\n` +
            `└ 💎 Всего выведено: ${botStats.totalStarsWithdrawn} ⭐\n\n` +
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
        
        // Удаляем старое сообщение бота, если оно есть
        const lastMessageId = lastBotMessages.get(userId);
        if (lastMessageId) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                logger.info('Старое сообщение бота удалено', { userId, messageId: lastMessageId });
            } catch (error) {
                logger.warn('Не удалось удалить старое сообщение', { userId, messageId: lastMessageId, error: error.message });
            }
        }
        
        // Отправляем новое сообщение
        const newMessage = await ctx.reply(welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: mainMenu.reply_markup
        });
        
        // Сохраняем ID нового сообщения
        lastBotMessages.set(userId, newMessage.message_id);
        logger.info('Новое сообщение бота отправлено и сохранено', { userId, messageId: newMessage.message_id });
        
        logger.info('Команда /start успешно обработана', { userId });
        
    } catch (error) {
        logger.error('Ошибка в обработчике команды /start', error, { userId: ctx?.from?.id });
        
        const errorMessage = `❌ **Ошибка запуска бота**\n\n` +
            `🚫 Не удалось запустить бота\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'start')]
        ]);
        
        // Удаляем старое сообщение бота, если оно есть
        const lastMessageId = lastBotMessages.get(userId);
        if (lastMessageId) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                logger.info('Старое сообщение бота удалено при ошибке', { userId, messageId: lastMessageId });
            } catch (error) {
                logger.warn('Не удалось удалить старое сообщение при ошибке', { userId, messageId: lastMessageId, error: error.message });
            }
        }
        
        // Отправляем новое сообщение об ошибке
        const newMessage = await ctx.reply(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
        
        // Сохраняем ID нового сообщения
        lastBotMessages.set(userId, newMessage.message_id);
        logger.info('Новое сообщение об ошибке отправлено и сохранено', { userId, messageId: newMessage.message_id });
    }
}

module.exports = startHandler;