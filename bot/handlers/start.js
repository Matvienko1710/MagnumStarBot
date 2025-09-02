const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const dataManager = require('../utils/dataManager');
const { sendSmartMessage } = require('../utils/autoDelete');
const { isAdmin } = require('../utils/admin');
const { updateLastBotMessage } = require('./callback');

// Хранилище последних сообщений бота для каждого пользователя
const lastBotMessages = new Map();



// Обработчик команды /start
async function startHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const startPayload = ctx.startPayload; // ID реферера
        
        logger.info('Получена команда /start', { userId, startPayload });
        
        // Проверяем подписку пользователя на канал
        const subscriptionCheck = await dataManager.checkUserSubscription(userId, null, ctx.telegram);
        
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
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')]
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
            
            // Отправляем сообщение о необходимости подписки (активное меню - не удаляем)
            const newMessage = await sendSmartMessage(ctx, subscriptionMessage, {
                parse_mode: 'Markdown',
                reply_markup: subscriptionKeyboard.reply_markup
            }, true);
            
            // Сохраняем ID нового сообщения
            lastBotMessages.set(userId, newMessage.message_id);
            
            logger.info('Сообщение о подписке отправлено', { userId, messageId: newMessage.message_id });
            
            return; // Прерываем выполнение, пока пользователь не подпишется
        }
        
        // Настраиваем реферальную систему для нового пользователя
        try {
            if (startPayload) {
                // Проверяем, не пытается ли пользователь использовать свою собственную реферальную ссылку
                if (startPayload === userId.toString()) {
                    logger.warn('Пользователь пытается использовать собственную реферальную ссылку', { userId, startPayload });
                    
                    // Показываем сообщение о том, что собственная ссылка не работает
                    const ownReferralMessage = `❌ **Собственная реферальная ссылка не работает!**\n\n` +
                        `🚫 Вы не можете использовать свою собственную реферальную ссылку\n` +
                        `👥 Реферальная система предназначена для приглашения других пользователей\n\n` +
                        `💡 Поделитесь своей ссылкой с друзьями, чтобы получать награды!`;
                    
                    // Отправляем сообщение о блокировке собственной ссылки (обычное сообщение - удаляем через 15 сек)
                    const ownReferralMsg = await sendSmartMessage(ctx, ownReferralMessage, { parse_mode: 'Markdown' });
                    
                    // Сохраняем ID сообщения о блокировке
                    lastBotMessages.set(userId, ownReferralMsg.message_id);
                    
                    // Создаем пользователя без реферера
                    await dataManager.setupReferral(userId, null, {
                        firstName: ctx.from.first_name,
                        username: ctx.from.username,
                        lastName: ctx.from.last_name
                    });
                    logger.info('Пользователь создан без реферера (собственная ссылка заблокирована)', { userId });
                    
                    return; // Прерываем выполнение, показываем только сообщение о блокировке
                }
                
                // Если есть ID реферера, настраиваем реферальную систему
                const referralData = await dataManager.setupReferral(userId, startPayload, {
                    firstName: ctx.from.first_name,
                    username: ctx.from.username,
                    lastName: ctx.from.last_name
                });
                logger.info('Реферальная система настроена для нового пользователя', { userId, referrerId: startPayload });
                
                // Начисляем награды и добавляем уведомление
                if (referralData.referrerId) {
                    try {
                        // Начисляем награду рефереру (5 звезд)
                        const { updateStars } = require('../utils/currency');
                        await updateStars(referralData.referrerId, 5, 'referral_bonus');

                        // Начисляем награду новому пользователю (1000 магнум коинов)
                        const { updateCoins } = require('../utils/currency');
                        await updateCoins(userId, 1000, 'referral_join');

                        logger.info('Реферальные награды начислены', {
                            newUserId: userId,
                            referrerId: referralData.referrerId,
                            newUserReward: { coins: 1000 },
                            referrerReward: { stars: 5 }
                        });

                        const referralBonusMessage = `🎉 **Реферальная награда!**\n\n` +
                            `✅ Вы зарегистрировались по реферальной ссылке\n` +
                            `💰 Получили бонус: **1000 🪙 Magnum Coins**\n` +
                            `👥 Ваш реферер получил: **5 ⭐ Stars**\n\n` +
                            `🎯 Продолжайте зарабатывать вместе!`;

                        // Отправляем сообщение о реферальной награде (обычное сообщение - удаляем через 15 сек)
                        const referralMessage = await sendSmartMessage(ctx, referralBonusMessage, { parse_mode: 'Markdown' });

                        // Сохраняем ID сообщения о реферальной награде
                        lastBotMessages.set(userId, referralMessage.message_id);

                        logger.info('Сообщение о реферальной награде отправлено и сохранено', { userId, messageId: referralMessage.message_id });

                    } catch (rewardError) {
                        logger.error('Ошибка начисления реферальной награды', rewardError, {
                            newUserId: userId,
                            referrerId: referralData.referrerId
                        });

                        // Показываем сообщение без упоминания наград, если они не начислены
                        const referralErrorMessage = `🎉 **Добро пожаловать!**\n\n` +
                            `✅ Вы зарегистрировались по реферальной ссылке\n\n` +
                            `🎯 Продолжайте зарабатывать вместе!`;

                        const referralMessage = await sendSmartMessage(ctx, referralErrorMessage, { parse_mode: 'Markdown' });
                        lastBotMessages.set(userId, referralMessage.message_id);
                    }
                }
            } else {
                // Если нет ID реферера, создаем пользователя без реферера
                await dataManager.setupReferral(userId, null, {
                    firstName: ctx.from.first_name,
                    username: ctx.from.username,
                    lastName: ctx.from.last_name
                });
                logger.info('Пользователь создан без реферера', { userId });
            }
        } catch (error) {
            logger.error('Ошибка настройки реферальной системы', error, { userId, startPayload });
            // Продолжаем выполнение, даже если реферальная система не настроена
        }
        
        // Получаем актуальный баланс пользователя
        const userBalance = await dataManager.getUserBalance(userId);

        // Получаем уровень пользователя
        const userLevel = await dataManager.getUserLevel(userId);

        // Получаем статистику бота
        const botStats = await dataManager.getBotStats();
        
        const welcomeMessage = `🚀 **Добро пожаловать в Magnum Stars!**\n` +
            `💎 Твой путь к наградам уже начался!\n\n` +
            `🎮 Играй в Magnum Stars, зарабатывай Magnum Coins, обменивай их на ⭐ и выводи прямо в боте!\n\n` +
            `👤 **Профиль**\n` +
            `├ 🆔 ID: \`${userId}\`\n` +
            `├ ✨ Имя: ${ctx.from.first_name || 'Не указано'}\n` +
            `└ 🎯 Уровень: ${userLevel.current}\n\n` +
            `💎 **Баланс**\n` +
            `├ ⭐ Stars: ${userBalance.stars}\n` +
            `└ 🪙 Magnum Coins: ${userBalance.coins}\n\n` +
            `📊 **Информация о боте**\n` +
            `├ 👤 Пользователей: ${botStats.totalUsers}\n` +
            `└ 💎 Всего выведено: ${botStats.totalStarsWithdrawn} ⭐\n\n` +
            `🔑 **Где найти ключи?**\n` +
            `Каждые 10 минут в нашем [чате](https://t.me/magnumtapchat) выходит новый промокод, который можно активировать в боте и получать бонусы.\n\n` +
            `👉 [Чат](https://t.me/magnumtapchat) • [Новости](https://t.me/magnumtap) • [Выплаты](https://t.me/magnumwithdraw)\n\n` +
            `🎯 Выберите действие и двигайтесь дальше 🚀`;
        
        // Проверяем, является ли пользователь админом
        const userIsAdmin = isAdmin(userId);
        
        // Создаем кнопку WebApp в зависимости от статуса пользователя
        const webAppButton = userIsAdmin
            ? Markup.button.webApp('Magnum Star - Beta', process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com')
            : Markup.button.callback('Magnum Star - Beta', 'webapp_coming_soon');

        // Создаем основное меню
        const mainMenuButtons = [
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), webAppButton],
            [Markup.button.callback('🌟 Вывести звезды', 'withdraw')]
        ];
        
        // Добавляем кнопку админ панели только для админов
        if (userIsAdmin) {
            mainMenuButtons.push([Markup.button.callback('⚙️ Админ панель', 'admin_panel')]);
        }
        
        const mainMenu = Markup.inlineKeyboard(mainMenuButtons);
        
        // Удаляем старое сообщение бота, если оно есть
        const lastMessageId = lastBotMessages.get(userId);
        if (lastMessageId) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                logger.info('Старое сообщение бота удалено', { userId, messageId: lastMessageId });
            } catch (error) {
                logger.warn('Не удалось удалить старое сообщение', { userId, messageId: lastMessageId, error: error.message });

                // Пробуем удалить через небольшую задержку (на случай сетевых проблем)
                setTimeout(async () => {
                    try {
                        await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                        logger.info('Старое сообщение бота удалено с задержкой', { userId, messageId: lastMessageId });
                    } catch (retryError) {
                        logger.warn('Не удалось удалить старое сообщение даже с задержкой', {
                            userId,
                            messageId: lastMessageId,
                            error: retryError.message
                        });
                    }
                }, 1000);
            }
        }

        // Очищаем старый ID из хранилища до отправки нового сообщения
        lastBotMessages.delete(userId);
        
        // Отправляем новое сообщение (главное меню - не удаляем)
        const newMessage = await sendSmartMessage(ctx, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: mainMenu.reply_markup
        }, true);
        
        // Сохраняем ID нового сообщения
        lastBotMessages.set(userId, newMessage.message_id);
        updateLastBotMessage(userId, newMessage.message_id);

        logger.info('Новое сообщение бота отправлено и сохранено', { userId, messageId: newMessage.message_id });
        
        logger.info('Команда /start успешно обработана', { userId });
        
    } catch (error) {
        const userId = ctx?.from?.id || 'unknown';
        logger.error('Ошибка в обработчике команды /start', error, { userId });

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

                // Пробуем удалить через небольшую задержку (на случай сетевых проблем)
                setTimeout(async () => {
                    try {
                        await ctx.telegram.deleteMessage(ctx.chat.id, lastMessageId);
                        logger.info('Старое сообщение бота удалено с задержкой при ошибке', { userId, messageId: lastMessageId });
                    } catch (retryError) {
                        logger.warn('Не удалось удалить старое сообщение даже с задержкой при ошибке', {
                            userId,
                            messageId: lastMessageId,
                            error: retryError.message
                        });
                    }
                }, 1000);
            }
        }

        // Очищаем старый ID из хранилища
        lastBotMessages.delete(userId);
        
        // Отправляем новое сообщение об ошибке (с кнопками - не удаляем)
        const newMessage = await sendSmartMessage(ctx, errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        }, true);
        
        // Сохраняем ID нового сообщения
        lastBotMessages.set(userId, newMessage.message_id);
        updateLastBotMessage(userId, newMessage.message_id);

        logger.info('Новое сообщение об ошибке отправлено и сохранено', { userId, messageId: newMessage.message_id });
    }
}

module.exports = startHandler;