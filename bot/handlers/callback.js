const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { getUserBalance } = require('../utils/currency');
const { getReferralStats } = require('../utils/referral');
const { isAdmin } = require('../utils/admin');
const dataManager = require('../utils/dataManager');

// Состояния пользователей для создания ключей
const userStates = new Map();

// Хранилище последних сообщений бота для каждого пользователя (синхронизировано с start.js)
const lastBotMessages = new Map();

// Функция для обновления ID последнего сообщения бота для пользователя
function updateLastBotMessage(userId, messageId) {
    lastBotMessages.set(userId, messageId);
    logger.debug('Обновлен ID последнего сообщения бота', { userId, messageId });
}

// Функция для получения ID последнего сообщения бота для пользователя
function getLastBotMessage(userId) {
    return lastBotMessages.get(userId);
}

// Обработчик callback запросов
async function callbackHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const callbackData = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message?.message_id;

        logger.info('Получен callback запрос', {
            userId,
            callbackData,
            messageId,
            chatType: ctx.chat?.type,
            chatUsername: ctx.chat?.username,
            chatId: ctx.chat?.id
        });

        // Проверяем, является ли это сообщение самым последним активным сообщением пользователя
        // Исключаем каналы выплат из этой проверки, так как там обрабатываются заявки
        const isWithdrawalChannel = ctx.chat?.username === 'magnumwithdraw';
        const lastMessageId = lastBotMessages.get(userId);

        logger.info('Проверка валидности сообщения', {
            userId,
            callbackData,
            messageId,
            lastMessageId,
            isWithdrawalChannel,
            chatType: ctx.chat?.type,
            chatUsername: ctx.chat?.username
        });

        if (!isWithdrawalChannel && lastMessageId && messageId !== lastMessageId) {
            logger.warn('Попытка взаимодействия со старым сообщением', {
                userId,
                callbackData,
                oldMessageId: messageId,
                currentMessageId: lastMessageId,
                chatType: ctx.chat?.type
            });

            // Отвечаем пользователю, что сообщение устарело
            await ctx.answerCbQuery('❌ Это сообщение устарело. Используйте команду /start для обновления меню.', true);
            return;
        }
        
        // Обрабатываем различные callback'и
        switch (callbackData) {
            case 'check_subscription':
                await handleCheckSubscription(ctx);
                break;
            case 'profile':
                await handleProfile(ctx);
                break;

            case 'daily_bonus':
                await handleDailyBonus(ctx);
                break;

            case 'withdraw':
                await handleWithdraw(ctx);
                break;
            case 'create_withdrawal':
                await handleCreateWithdrawal(ctx);
                break;
            case 'my_withdrawals':
                await handleMyWithdrawals(ctx);
                break;
            case 'activate_key':
                await handleActivateKey(ctx);
                break;
                
            case 'referrals':
                await handleReferrals(ctx);
                break;
                
            case 'support':
                await handleSupport(ctx);
                break;

                
            case 'main_menu':
                await handleMainMenu(ctx);
                break;
                
            case 'admin_panel':
                await handleAdminPanel(ctx);
                break;
                
            case 'create_key':
                await handleCreateKey(ctx);
                break;
                


                
            case 'create_post':
                await handleCreatePost(ctx);
                break;



            case 'clear_cache':
                await handleClearCache(ctx);
                break;
                
            case 'cache_stats':
                await handleCacheStats(ctx);
                break;
                

                
            case 'check_missed_rewards':
                await handleCheckMissedRewards(ctx);
                break;
                
            case 'earn_money':
                await handleEarnMoney(ctx);
                break;
                
            case 'earn_stars_ads':
                await handleEarnStarsAds(ctx);
                break;
                
            case 'watch_ad':
                await handleWatchAd(ctx);
                break;
                
            default:
                // Обработка кнопок одобрения/отклонения заявок
                if (callbackData.startsWith('approve_withdrawal_')) {
                    logger.info('🔥 Вызываем handleApproveWithdrawal', { action: callbackData, userId });
                    await handleApproveWithdrawal(ctx, callbackData);
                    return;
                }
                
                if (callbackData.startsWith('reject_withdrawal_')) {
                    logger.info('🔥 Вызываем handleRejectWithdrawal', { action: callbackData, userId });
                    await handleRejectWithdrawal(ctx, callbackData);
                    return;
                }
                
                if (callbackData.startsWith('process_withdrawal_')) {
                    logger.info('🔧 Вызываем handleProcessWithdrawal', { action: callbackData, userId });
                    await handleProcessWithdrawal(ctx, callbackData);
                    return;
                }
                
                // Обработчики причин отклонения заявок
                if (callbackData.startsWith('reject_reason_')) {
                    logger.info('🚫 Вызываем handleRejectWithReason', { action: callbackData, userId });
                    await handleRejectWithReason(ctx, callbackData);
                    return;
                }
                
                // Обработка кнопок поддержки
                if (callbackData === 'create_ticket') {
                    logger.info('📝 Вызываем handleCreateTicket', { userId });
                    await handleCreateTicket(ctx);
                    return;
                }
                
                if (callbackData === 'my_tickets') {
                    logger.info('📋 Вызываем handleMyTickets', { userId });
                    await handleMyTickets(ctx);
                    return;
                }
                
                if (callbackData === 'support_faq') {
                    logger.info('📚 Вызываем handleSupportFAQ', { userId });
                    await handleSupportFAQ(ctx);
                    return;
                }
                
                // Обработка кнопок в канале поддержки
                if (callbackData.startsWith('take_ticket_')) {
                    logger.info('👨‍💼 Вызываем handleTakeTicket', { action: callbackData, userId });
                    await handleTakeTicket(ctx, callbackData);
                    return;
                }
                
                if (callbackData.startsWith('close_ticket_')) {
                    logger.info('✅ Вызываем handleCloseTicket', { action: callbackData, userId });
                    await handleCloseTicket(ctx, callbackData);
                    return;
                }
                
                if (callbackData.startsWith('reply_ticket_')) {
                    logger.info('💬 Вызываем handleReplyTicket', { action: callbackData, userId });
                    await handleReplyTicket(ctx, callbackData);
                    return;
                }
                
                if (callbackData.startsWith('cancel_reply_')) {
                    logger.info('❌ Вызываем handleCancelReply', { action: callbackData, userId });
                    await handleCancelReply(ctx, callbackData);
                    return;
                }

                // Обработка отключенных функций майнеров и титулов
                if (callbackData === 'titles') {
                    logger.info('⛔ Обработка титулов отключена', { userId });
                    await ctx.answerCbQuery('⛔ Функционал титулов отключен', false);
                    return;
                }

                if (callbackData === 'manage_titles') {
                    logger.info('⛔ Обработка управления титулами отключена', { userId });
                    await ctx.answerCbQuery('⛔ Функционал титулов отключен', false);
                    return;
                }

                if (callbackData === 'miners') {
                    logger.info('⛔ Обработка майнеров отключена', { userId });
                    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
                    return;
                }
                
                // Если команда не найдена
                logger.warn('Неизвестная команда', { userId, callbackData });
                await ctx.answerCbQuery('❌ Неизвестная команда', true);
                break;
        }
        
        // Отвечаем на callback query
        await ctx.answerCbQuery();
        
    } catch (error) {
        logger.error('Ошибка в обработчике callback', error, { userId: ctx?.from?.id });
        throw error;
    }
}

// Обработка профиля
async function handleProfile(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка профиля', { userId });
    
    try {
        // Проверяем подписку пользователя
        const canUseBot = await dataManager.canUserUseBot(userId);
        if (!canUseBot) {
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
            
            await ctx.editMessageText(subscriptionMessage, {
                parse_mode: 'Markdown',
                reply_markup: subscriptionKeyboard.reply_markup
            });
            
            return;
        }
        
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Получаем реферальную статистику
        const referralStats = await getReferralStats(userId);
        
        const profileMessage = `🎮 **Твой профиль в Magnum Stars**\n\n` +
            `✨ Ник: ${ctx.from.first_name || 'Не указано'}\n` +
            `🆔 ID: \`${userId}\`\n\n` +
            `💎 **Баланс:**\n` +
            `⭐ Stars → ${userBalance.stars}\n` +
            `🪙 Magnum Coins → ${userBalance.coins}\n\n` +
            `👥 Друзья: ${referralStats.totalReferrals}\n` +
            `💰 Реф. доход: ${referralStats.totalEarned.stars} ⭐, ${referralStats.totalEarned.coins} 🪙`;
        
        const profileKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('👥 Рефералы', 'referrals')],
            [Markup.button.callback('🆘 Поддержка', 'support')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(profileMessage, {
            parse_mode: 'Markdown',
            reply_markup: profileKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки профиля', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки профиля**\n\n` +
            `🚫 Не удалось загрузить данные профиля\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'profile')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Функции майнеров удалены - функционал перенесен в вебапп



// Обработка магазина майнеров
async function handleMinersShop(ctx, currentMinerIndex = 0) {
    // Функционал перенесен в вебапп
    await ctx.answerCbQuery('🔄 Функционал майнеров перенесен в веб-приложение', false);
    return;
}



// Обработка "Мои майнеры"
async function handleMyMiners(ctx) {
    // Функционал перенесен в вебапп
    await ctx.answerCbQuery('🔄 Функционал майнеров перенесен в веб-приложение', false);
    return;
}

// Обработка вывода звезд
async function handleWithdraw(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка вывода звезд', { userId });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await dataManager.getUserBalance(userId);
        
        const withdrawMessage = `⭐ **Вывод Stars**\n\n` +
            `💰 **Ваш баланс:** ${userBalance.stars} ⭐ Stars\n\n` +
            `📋 **Условия вывода:**\n` +
            `├ 💰 Минимум для заявки: 50 ⭐ Stars\n` +
            `├ ⏳ Срок обработки: 24–48 часов\n` +
            `└ 🆔 Способ вывода: Telegram ID\n\n` +
            `💡 **Как вывести свои Stars:**\n` +
            `1️⃣ Нажмите кнопку «💳 Создать заявку»\n` +
            `2️⃣ Введите сумму для вывода\n` +
            `4️⃣ Подтвердите заявку и ожидайте 🚀\n\n` +
            `✨ После одобрения администратором ⭐️ будут переведены на ваш Telegram аккаунт.`;
        
        const withdrawKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💳 Создать заявку', 'create_withdrawal')],
            [Markup.button.callback('📋 Мои заявки', 'my_withdrawals')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(withdrawMessage, {
            parse_mode: 'Markdown',
            reply_markup: withdrawKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки вывода звезд', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки баланса**\n\n` +
            `🚫 Не удалось загрузить данные баланса\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'withdraw')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка запуска майнинга
async function handleStartMining(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка запуска майнинга', { userId });
    
    try {
        // Получаем майнеры пользователя
        const userMiners = await dataManager.getUserMiners(userId);
        
        if (userMiners.length === 0) {
            // Показываем уведомление
            await ctx.answerCbQuery('❌ У вас нет майнеров для запуска майнинга');
            return;
        }
        
        // Запускаем майнинг
        const miningResult = await dataManager.startMining(userId);
        
        if (miningResult.success) {
            // Показываем уведомление с наградой
            const rewardMessage = miningResult.initialReward.coins > 0 
                ? `🚀 Майнинг запущен! Получено ${miningResult.initialReward.coins} 🪙 Magnum Coins за первую минуту!`
                : '🚀 Майнинг запущен!';
            
            await ctx.answerCbQuery(rewardMessage);
            
            // Обновляем текущее сообщение с информацией о майнинге
            await showMiningInProgress(ctx, userId, miningResult.startTime);
            
        } else {
            // Показываем уведомление об ошибке
            await ctx.answerCbQuery(`❌ ${miningResult.message}`);
        }
        
    } catch (error) {
        logger.error('Ошибка запуска майнинга', error, { userId });
        
        // Показываем уведомление об ошибке
        await ctx.answerCbQuery('❌ Ошибка запуска майнинга');
    }
}

// Функция обновления таймера майнинга (функционал отключен)
async function updateMiningTimer(ctx, userId, startTime) {
    logger.info('⛔ Функционал майнеров отключен', { userId });
    // Функционал майнеров отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Показать готовность к майнингу
async function showMiningReady(ctx, userId) {
    logger.info('⛔ Функционал майнеров отключен', { userId });
    // Функционал майнеров отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Показать информацию о майнинге в процессе (функционал отключен)
async function showMiningInProgress(ctx, userId, startTime) {
    logger.info('⛔ Функционал майнеров отключен', { userId });
    // Функционал майнеров отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Показать время следующего запуска майнинга
async function showMiningTimer(ctx, userId, nextMiningTime) {
    logger.info('⛔ Функционал майнеров отключен', { userId });
    // Функционал майнеров отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Функции майнеров удалены - функционал перенесен в вебапп



// Функции майнеров удалены - функционал перенесен в вебапп

// Обработка активации ключа
async function handleActivateKey(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка активации ключа', { userId });
    
    // Устанавливаем состояние ожидания ключа
    userStates.set(userId, {
        state: 'waiting_for_key',
        timestamp: Date.now()
    });
    
    logger.userState(userId, 'set', { state: 'waiting_for_key' });
    
    const activateMessage = `🔑 **Активация ключа**\n\n` +
        `📝 Введите ключ для активации:\n\n` +
        `💡 Ключ должен содержать буквы и цифры и состоять из 16 символов.\n` +
        `❌ Не используйте пробелы в начале и конце.\n\n` +
        `🎉 При активации можно получить:\n` +
        ` • ⭐ Stars — увеличивай свой баланс и достигай новых высот!\n` +
        ` • 🪙 Magnum Coins — зарабатывай и обменивай на мощные майнеры!\n` +
        ` • ⛏️ Майнеры — добавляй к своей ферме и повышай доход!\n` +
        ` • 🔒 Секретные награды — уникальные бонусы, которые редко встречаются!\n\n` +
        `🚀 Активируй ключ и прокачай свой аккаунт прямо сейчас!`;
    
    const activateKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Отмена', 'main_menu')]
    ]);
    
    await ctx.editMessageText(activateMessage, {
        parse_mode: 'Markdown',
        reply_markup: activateKeyboard.reply_markup
    });
}

// Обработка рефералов
async function handleReferrals(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка рефералов', { userId });
    
    try {
        // Получаем реферальную статистику
        const referralStats = await getReferralStats(userId);
        
        // Убеждаемся, что referralId существует, иначе используем userId
        const referralId = referralStats.referralId || ctx.from.id;
        
        const referralsMessage = `👥 **Реферальная система**\n\n` +
            `🔗 Ваша реферальная ссылка:\n` +
            `\`https://t.me/MagnumStarBot?start=${referralId}\`\n\n` +
            `📊 Статистика:\n` +
            `├ 👥 Всего рефералов: ${referralStats.totalReferrals}\n` +
            `├ ⭐ Заработано: ${referralStats.totalEarned.stars}\n` +
            `└ 🎯 Уровень: ${referralStats.level}\n\n` +
            `💰 Награды за рефералов:\n` +
            `├ 🎁 За каждого реферала: +5 ⭐ Stars + 1000 🪙 Magnum Coins\n` +
            `└ 💡 Просто поделитесь ссылкой выше!`;
        
        const referralsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔗 Мой реферальный код', 'my_referral_code')],
            [Markup.button.callback('📊 Топ рефералов', 'top_referrers')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(referralsMessage, {
            parse_mode: 'Markdown',
            reply_markup: referralsKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки рефералов', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки рефералов**\n\n` +
            `🚫 Не удалось загрузить данные рефералов\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'referrals')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка главного меню
async function handleMainMenu(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка главного меню', { userId });
    
    try {
        // Проверяем подписку пользователя
        const canUseBot = await dataManager.canUserUseBot(userId);
        if (!canUseBot) {
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
            
            await ctx.editMessageText(subscriptionMessage, {
                parse_mode: 'Markdown',
                reply_markup: subscriptionKeyboard.reply_markup
            });
            
            return;
        }
        
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Получаем реферальную статистику
        const referralStats = await getReferralStats(userId);
        
        // Получаем статистику бота
        const botStats = await dataManager.getBotStats();
        

        
        const mainMenuMessage = `🚀 **Добро пожаловать в Magnum Stars!**\n` +
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
        
        // Создаем кнопку WebApp - теперь доступна для всех пользователей
        const webAppButton = Markup.button.webApp('🚀 Magnum Star - ДОСТУПНО!', process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com');

        // Создаем основное меню
        const mainMenuButtons = [
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), webAppButton],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')]
        ];
        
        // Добавляем кнопку админ панели только для админов
        if (isAdmin(userId)) {
            mainMenuButtons.push([Markup.button.callback('⚙️ Админ панель', 'admin_panel')]);
        }
        
        const mainMenuKeyboard = Markup.inlineKeyboard(mainMenuButtons);
        
        await ctx.editMessageText(mainMenuMessage, {
            parse_mode: 'Markdown',
            reply_markup: mainMenuKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки главного меню', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки главного меню**\n\n` +
            `🚫 Не удалось загрузить данные\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'main_menu')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка ежедневного бонуса
async function handleDailyBonus(ctx) {
    const userId = ctx.from.id;

    logger.info('Обработка ежедневного бонуса', { userId });

    try {
        // Получаем данные пользователя
        const user = await dataManager.getUser(userId);

        // Проверяем время последнего получения бонуса
        const now = Date.now();
        const lastBonusTime = user.lastDailyBonus || 0;
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
        const timeSinceLastBonus = now - lastBonusTime;

        if (timeSinceLastBonus < cooldownMs) {
            // Кулдаун еще не прошел
            const remainingMs = cooldownMs - timeSinceLastBonus;
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            const waitMessage = `⏰ **Подождите!**\n\n` +
                `🎁 Следующий ежедневный бонус будет доступен через:\n` +
                `├ ${remainingHours} часов ${remainingMinutes} минут\n\n` +
                `💡 Возвращайтесь завтра за новыми звездами! ⭐`;

            await ctx.answerCbQuery(waitMessage, true);
            return;
        }

        // Начисляем бонус
        const bonusAmount = 3.33;
        await dataManager.updateUserBalance(userId, { stars: bonusAmount });

        // Обновляем время последнего бонуса
        await dataManager.updateUser(userId, { lastDailyBonus: now });

        // Показываем уведомление об успешном получении бонуса
        const successMessage = `🎉 **Бонус получен!**\n\n` +
            `⭐ Вы получили: ${bonusAmount} звезд\n\n` +
            `💰 Ваш баланс: ${(user.balance.stars + bonusAmount).toFixed(2)} ⭐\n\n` +
            `⏰ Следующий бонус через 24 часа!`;

        await ctx.answerCbQuery(successMessage, false);

        logger.info('Ежедневный бонус успешно начислен', { userId, bonusAmount });

    } catch (error) {
        logger.error('Ошибка обработки ежедневного бонуса', error, { userId });

        const errorMessage = `❌ **Ошибка получения бонуса**\n\n` +
            `🚫 Не удалось получить ежедневный бонус\n` +
            `🔧 Попробуйте позже`;

        await ctx.answerCbQuery(errorMessage, true);
    }
}

// Обработка админ панели
async function handleAdminPanel(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка админ панели', { userId });
    
    // Проверяем, является ли пользователь админом
    if (!isAdmin(userId)) {
        await ctx.reply('❌ У вас нет доступа к админ панели');
        return;
    }
    
    try {
        // Получаем статистику бота
        const botStats = await dataManager.getBotStats();
        const totalUsers = await dataManager.getTotalUsers();
        const totalStarsWithdrawn = await dataManager.getTotalStarsWithdrawn();
        
        const adminMessage = `⚙️ **Админ панель**\n\n` +
            `🔧 Управление ботом:\n\n` +
            `📊 Статистика: ${totalUsers} пользователей\n` +
            `💰 Общий баланс: ${botStats.totalStarsWithdrawn} ⭐ Stars, ${botStats.totalCoinsEarned} 🪙 Coins\n` +
            `🔑 Активных ключей: 0\n\n` +
            `🧹 **Управление кэшем:**\n` +
            `📈 Статистика кэша доступна\n` +
            `🗑️ Очистка кэша`;
        
        const adminKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔑 Создать ключ', 'create_key')],
            [Markup.button.callback('📝 Создать пост', 'create_post')],
            [Markup.button.callback('⛏️ Проверить пропущенные награды', 'check_missed_rewards')],
            [Markup.button.callback('📊 Статистика кэша', 'cache_stats')],
            [Markup.button.callback('🗑️ Очистить кэш', 'clear_cache')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(adminMessage, {
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка загрузки админ панели', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки админ панели**\n\n` +
            `🚫 Не удалось загрузить статистику\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'admin_panel')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка создания ключа
async function handleCreateKey(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа', { userId });
    
    // Устанавливаем состояние создания ключа
    userStates.set(userId, {
        state: 'creating_key',
        currentStep: 'reward_type',
        data: {
            stars: 0,
            coins: 0,
            maxUses: 1
        },
        timestamp: Date.now()
    });
    
    logger.userState(userId, 'set', { state: 'creating_key' });
    
    const createKeyMessage = `🔑 **Создание ключа**\n\n` +
        `🎯 Выберите тип награды для ключа:\n\n` +
        `⭐ Stars - валюта для вывода\n` +
        `🪙 Magnum Coins - игровая валюта`;
    
    const createKeyKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Stars', 'key_reward_stars')],
        [Markup.button.callback('🪙 Magnum Coins', 'key_reward_coins')],
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(createKeyMessage, {
        parse_mode: 'Markdown',
        reply_markup: createKeyKeyboard.reply_markup
    });
}

// Обработка создания ключа титула
async function handleCreateTitleKey(ctx) {
    const userId = ctx.from.id;

    logger.info('⛔ Обработка создания ключа титула отключена', { userId });

    // Функционал титулов отключен
    await ctx.answerCbQuery('⛔ Функционал титулов отключен', false);
    return;
    
    // Устанавливаем состояние создания ключа титула
    userStates.set(userId, {
        state: 'creating_title_key',
        currentStep: 'description',
        data: {
            titleId: 'novice',
            stars: 50,
            coins: 25,
            maxUses: 1
        },
        timestamp: Date.now()
    });
    
    logger.userState(userId, 'set', { state: 'creating_title_key' });
    
    const createTitleKeyMessage = `👑 **Создание ключа титула**\n\n` +
        `📝 Введите описание ключа:\n\n` +
        `💡 Пример: Ключ титула "Новичок" для новых пользователей\n` +
        `❌ Не используйте пробелы в начале и конце`;
    
    const createTitleKeyKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(createTitleKeyMessage, {
        parse_mode: 'Markdown',
        reply_markup: createTitleKeyKeyboard.reply_markup
    });
}

// Обработка очистки кэша
async function handleClearCache(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка очистки кэша', { userId });
    
    // Проверяем, является ли пользователь админом
    if (!isAdmin(userId)) {
        await ctx.reply('❌ У вас нет доступа к этой функции');
        return;
    }
    
    const beforeStats = cacheManager.getStats();
    cacheManager.clear();
    const afterStats = cacheManager.getStats();
    
    const clearMessage = `🗑️ **Кэш очищен**\n\n` +
        `📊 **До очистки:**\n` +
        `├ 📈 Размер: ${beforeStats.totalSize} МБ\n` +
        `├ 🎯 Попадания: ${beforeStats.hits}\n` +
        `└ ❌ Промахи: ${beforeStats.misses}\n\n` +
        `📊 **После очистки:**\n` +
        `├ 📈 Размер: ${afterStats.totalSize} МБ\n` +
        `├ 🎯 Попадания: ${afterStats.hits}\n` +
        `└ ❌ Промахи: ${afterStats.misses}\n\n` +
        `🧹 **Освобождено памяти:** ${beforeStats.totalSize - afterStats.totalSize} МБ`;
    
    const clearKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика кэша', 'cache_stats')],
        [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(clearMessage, {
        parse_mode: 'Markdown',
        reply_markup: clearKeyboard.reply_markup
    });
}

// Обработка статистики кэша
async function handleCacheStats(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка статистики кэша', { userId });
    
    // Проверяем, является ли пользователь админом
    if (!isAdmin(userId)) {
        await ctx.reply('❌ У вас нет доступа к этой функции');
        return;
    }
    
    const stats = cacheManager.getStats();
    const memUsage = process.memoryUsage();
    
    const statsMessage = `📊 **Статистика кэша**\n\n` +
        `💾 **Общая информация:**\n` +
        `├ 📈 Размер кэша: ${stats.totalSize} МБ\n` +
        `├ 🎯 Попадания: ${stats.hits}\n` +
        `├ ❌ Промахи: ${stats.misses}\n` +
        `└ 🗑️ Удаления: ${stats.evictions}\n\n` +
        `🧠 **Память процесса:**\n` +
        `├ 💾 Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} МБ\n` +
        `├ 📊 Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} МБ\n` +
        `└ 🔄 RSS: ${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} МБ\n\n` +
        `📋 **Детали по кэшам:**\n` +
        Object.entries(stats.caches).map(([name, cache]) => 
            `├ ${name}: ${cache.size}/${cache.maxSize} (TTL: ${Math.round(cache.ttl / 1000)}с)`
        ).join('\n');
    
    const statsKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🗑️ Очистить кэш', 'clear_cache')],
        [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(statsMessage, {
        parse_mode: 'Markdown',
        reply_markup: statsKeyboard.reply_markup
    });
}

// Функции титулов удалены - функционал убран из бота

// Функция handleMyTitles удалена - функционал убран из бота
async function handleMyTitles(ctx) {
    // Функционал перенесен в вебапп
    await ctx.answerCbQuery('🔄 Функционал титулов убран из бота', false);
    return;
}





module.exports = {
    callbackHandler,
    handleKeyCreation,
    handleTitleKeyCreation,
    userStates
};

// === ФУНКЦИИ ДЛЯ СОЗДАНИЯ КЛЮЧЕЙ ===

// Обработка выбора типа награды для ключа
async function handleKeyRewardType(ctx, rewardType) {
    const userId = ctx.from.id;
    
    logger.info('Выбор типа награды для ключа', { userId, rewardType });
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    userState.currentStep = 'reward_amount';
    userState.data.rewardType = rewardType;
    
    const rewardTypeText = rewardType === 'stars' ? '⭐ Stars' : '🪙 Magnum Coins';
    
    const message = `🔑 **Создание ключа**\n\n` +
        `🎯 Тип награды: ${rewardTypeText}\n\n` +
        `💰 Введите количество ${rewardTypeText} для награды:\n\n` +
        `💡 Пример: 100`;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });
}

// Обработка создания ключа из текстового сообщения
async function handleKeyCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа из текста', { userId, text });
    
    const userState = userStates.get(userId);
    if (!userState || userState.state !== 'creating_key') return;
    
    try {
        if (userState.currentStep === 'reward_amount') {
            const amount = parseInt(text);
            if (isNaN(amount) || amount <= 0) {
                await ctx.reply('❌ Введите корректное число больше 0');
                return;
            }
            
            userState.data[userState.data.rewardType] = amount;
            userState.currentStep = 'max_uses';
            
            const rewardTypeText = userState.data.rewardType === 'stars' ? '⭐ Stars' : '🪙 Magnum Coins';
            
            const message = `🔑 **Создание ключа**\n\n` +
                `🎯 Тип награды: ${rewardTypeText}\n` +
                `💰 Количество: ${amount} ${rewardTypeText}\n\n` +
                `🔄 Введите максимальное количество активаций:\n\n` +
                `💡 Пример: 1`;
            
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Отмена', 'admin_panel')]
            ]);
            
            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });
            
        } else if (userState.currentStep === 'max_uses') {
            const maxUses = parseInt(text);
            if (isNaN(maxUses) || maxUses <= 0) {
                await ctx.reply('❌ Введите корректное число больше 0');
                return;
            }
            
            userState.data.maxUses = maxUses;
            
            // Создаем ключ в базе данных
            const { generateKey } = require('../utils/keys');
            const key = generateKey();
            
            const keyData = {
                key: key,
                type: userState.data.rewardType,
                reward: {
                    stars: userState.data.rewardType === 'stars' ? userState.data.stars : 0,
                    coins: userState.data.rewardType === 'coins' ? userState.data.coins : 0
                },
                maxUses: maxUses,
                createdBy: userId
            };
            
            try {
                const createResult = await dataManager.createKey(keyData);

                if (createResult.success) {
            const rewardTypeText = userState.data.rewardType === 'stars' ? '⭐ Stars' : '🪙 Magnum Coins';

            const successMessage = `✅ **Ключ успешно создан!**\n\n` +
                `🔑 Ключ: \`${key}\`\n` +
                `🎯 Тип: ${rewardTypeText}\n` +
                `💰 Награда: ${userState.data[userState.data.rewardType]} ${rewardTypeText}\n` +
                `🔄 Максимум активаций: ${maxUses}\n\n` +
                `💡 Пользователи могут активировать этот ключ в разделе "Активировать ключ"`;

            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🔑 Создать еще ключ', 'create_key')],
                [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
            ]);

            await ctx.reply(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });

            // Отправляем уведомление в чат
            const chatMessage = `🎉 **Новый ключ создан!**\n\n` +
                `🔑 Ключ: \`${key}\`\n` +
                `🎯 Тип награды: ${rewardTypeText}\n` +
                `💰 Размер награды: ${userState.data[userState.data.rewardType]} ${rewardTypeText}\n` +
                `🔄 Максимум активаций: ${maxUses}\n` +
                `👤 Создал: @${ctx.from.username || 'админ'}\n\n` +
                `💡 Пользователи могут активировать этот ключ в боте!`;

            const { sendChannelNotification } = require('../middleware/chatFilter');
            await sendChannelNotification(ctx, chatMessage);
                } else {
                    await ctx.reply('❌ Ошибка создания ключа в базе данных');
                }
                
            } catch (error) {
                logger.error('Ошибка создания ключа в базе данных', error, { userId, keyData });
                await ctx.reply('❌ Ошибка создания ключа в базе данных');
            }
            
            // Очищаем состояние
            userStates.delete(userId);
            
        }
        
    } catch (error) {
        logger.error('Ошибка создания ключа', error, { userId, text });
        await ctx.reply('❌ Произошла ошибка при создании ключа');
        userStates.delete(userId);
    }
}

// Обработка создания ключа титула из текстового сообщения
async function handleTitleKeyCreation(ctx, text) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания ключа титула из текста', { userId, text });
    
    const userState = userStates.get(userId);
    if (!userState || userState.state !== 'creating_title_key') return;
    
    try {
        if (userState.currentStep === 'description') {
            if (text.trim().length < 3) {
                await ctx.reply('❌ Описание должно содержать минимум 3 символа');
                return;
            }
            
            // Создаем ключ титула
            const { generateKey } = require('../utils/keys');
            const key = generateKey();
            
            const successMessage = `✅ **Ключ титула успешно создан!**\n\n` +
                `🔑 Ключ: \`${key}\`\n` +
                `👑 Титул: Новичок\n` +
                `📝 Описание: ${text.trim()}\n` +
                `💰 Награда: 50 ⭐ Stars, 25 🪙 Magnum Coins\n` +
                `🔄 Максимум активаций: 1\n\n` +
                `💡 Пользователи могут активировать этот ключ в разделе "Активировать ключ"`;
            
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback('👑 Создать еще ключ титула', 'create_title_key')],
                [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
            ]);
            
            await ctx.reply(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: keyboard.reply_markup
            });
            
            // Очищаем состояние
            userStates.delete(userId);
        }
        
    } catch (error) {
        logger.error('Ошибка создания ключа титула', error, { userId, text });
        await ctx.reply('❌ Произошла ошибка при создании ключа титула');
        userStates.delete(userId);
    }
}

// Обработка создания заявки на вывод
async function handleCreateWithdrawal(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания заявки на вывод', { userId });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await dataManager.getUserBalance(userId);
        
        if (userBalance.stars < 50) {
            const insufficientMessage = `❌ **Недостаточно звезд**\n\n` +
                `💰 Ваш баланс: ${userBalance.stars} ⭐ Stars\n` +
                `📋 Минимальная сумма для вывода: 50 ⭐ Stars\n\n` +
                `💡 Заработайте больше звезд, чтобы создать заявку на вывод`;
            
            const insufficientKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🏠 В главное меню', 'main_menu')],
                [Markup.button.callback('🔙 Назад к выводу', 'withdraw')]
            ]);
            
            await ctx.editMessageText(insufficientMessage, {
                parse_mode: 'Markdown',
                reply_markup: insufficientKeyboard.reply_markup
            });
            return;
        }
        
        // Устанавливаем состояние ожидания суммы
        userStates.set(userId, {
            state: 'waiting_for_withdrawal_amount',
            timestamp: Date.now()
        });
        
        const createMessage = `💳 **Создание заявки на вывод**\n\n` +
            `💰 **Ваш баланс:** ${userBalance.stars} ⭐ Stars\n` +
            `📋 **Минимальная сумма:** 50 ⭐ Stars\n\n` +
            `📝 **Введите сумму для вывода:**\n` +
            `💡 Пример: 100 (для вывода 100 ⭐ Stars)`;
        
        const createKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Отмена', 'withdraw')]
        ]);
        
        await ctx.editMessageText(createMessage, {
            parse_mode: 'Markdown',
            reply_markup: createKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка создания заявки на вывод', error, { userId });
        
        const errorMessage = `❌ **Ошибка создания заявки**\n\n` +
            `🚫 Не удалось создать заявку на вывод\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'create_withdrawal')],
            [Markup.button.callback('🔙 Назад к выводу', 'withdraw')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка просмотра заявок пользователя
async function handleMyWithdrawals(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка просмотра заявки пользователя', { userId });
    
    try {
        // Получаем заявки пользователя
        const requests = await dataManager.db.collection('withdrawals')
            .find({ userId: Number(userId) })
            .sort({ createdAt: -1 })
            .toArray();
        
        if (requests.length === 0) {
            const noRequestsMessage = `📋 **Мои заявки на вывод**\n\n` +
                `❌ У вас пока нет заявок на вывод\n\n` +
                `💡 Создайте первую заявку, нажав "💳 Создать заявку"`;
            
            const noRequestsKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('💳 Создать заявку', 'create_withdrawal')],
                [Markup.button.callback('🔙 Назад к выводу', 'withdraw')]
            ]);
            
            await ctx.editMessageText(noRequestsMessage, {
                parse_mode: 'Markdown',
                reply_markup: noRequestsKeyboard.reply_markup
            });
            return;
        }
        
        let requestsMessage = `📋 **Мои заявки на вывод**\n\n`;
        
        for (const request of requests) {
            const status = request.status === 'pending' ? '⏳ Ожидает' : 
                          request.status === 'approved' ? '✅ Одобрена' : '❌ Отклонена';
            
            const date = new Date(request.createdAt).toLocaleDateString('ru-RU');
            const time = new Date(request.createdAt).toLocaleTimeString('ru-RU');
            
            requestsMessage += `📋 **Заявка #${request.id}**\n` +
                `├ 💰 Сумма: ${request.amount} ⭐ Stars\n` +
                `├ 📅 Дата: ${date} ${time}\n` +
                `├ 📊 Статус: ${status}\n`;
            
            if (request.status !== 'pending') {
                const processedDate = new Date(request.processedAt).toLocaleDateString('ru-RU');
                const processedTime = new Date(request.processedAt).toLocaleTimeString('ru-RU');
                requestsMessage += `├ ⏰ Обработана: ${processedDate} ${processedTime}\n`;
                
                if (request.comment) {
                    requestsMessage += `└ 💬 Комментарий: ${request.comment}\n`;
                } else {
                    requestsMessage += `└ 💬 Комментарий: Нет\n`;
                }
            } else {
                requestsMessage += `└ ⏰ Обработка: 24-48 часов\n`;
            }
            
            requestsMessage += '\n';
        }
        
        const requestsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💳 Создать новую заявку', 'create_withdrawal')],
            [Markup.button.callback('🔙 Назад к выводу', 'withdraw')]
        ]);
        
        await ctx.editMessageText(requestsMessage, {
            parse_mode: 'Markdown',
            reply_markup: requestsKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка просмотра заявок пользователя', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки заявок**\n\n` +
            `🚫 Не удалось загрузить ваши заявки\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'my_withdrawals')],
            [Markup.button.callback('🔙 Назад к выводу', 'withdraw')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка одобрения заявки на вывод (только для админов)
async function handleApproveWithdrawal(ctx, action) {
    const userId = ctx.from.id;
    const requestId = action.replace('approve_withdrawal_', '');
    const messageId = ctx.callbackQuery?.message?.message_id;
    const chatId = ctx.chat?.id;

    logger.info('🚀 НАЧАЛО ОБРАБОТКИ ОДОБРЕНИЯ ЗАЯВКИ', {
        userId,
        requestId,
        messageId,
        chatId,
        chatType: ctx.chat?.type,
        chatUsername: ctx.chat?.username,
        action: action,
        callbackData: ctx.callbackQuery?.data,
        timestamp: new Date().toISOString()
    });

    try {
        // Отвечаем на callback-запрос сразу, чтобы избежать таймаута
        await ctx.answerCbQuery('⏳ Обрабатываем заявку...', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для одобрения заявок', true);
            return;
        }
        
        // Обрабатываем заявку
        const result = await dataManager.processWithdrawalRequest(requestId, 'approve', userId);
        
        if (result.success) {
            // Обновляем сообщение в канале
            const updatedMessage = `📋 **Заявка на вывод ОДОБРЕНА** ✅\n\n` +
                `👤 **Пользователь:**\n` +
                `├ 🆔 ID: \`${result.request.userId}\`\n` +
                `├ 👤 Имя: ${result.request.firstName}\n` +
                `└ 🏷️ Username: ${result.request.username}\n\n` +
                `💰 **Детали заявки:**\n` +
                `├ 🆔 ID заявки: \`${result.request.id}\`\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `├ 📅 Дата: ${new Date(result.request.createdAt).toLocaleDateString('ru-RU')}\n` +
                `└ ⏰ Время: ${new Date(result.request.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
                `✅ **Одобрено:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}`;

            // Обновляем сообщение в канале
            try {
                await ctx.editMessageText(updatedMessage, { parse_mode: 'Markdown' });
                logger.info('Сообщение в канале успешно обновлено (одобрение)', {
                    userId,
                    requestId,
                    messageId,
                    chatId
                });
            } catch (editError) {
                logger.error('Ошибка обновления сообщения в канале (одобрение)', editError, {
                    userId,
                    requestId,
                    messageId,
                    chatId
                });
                // Не возвращаем ошибку, продолжаем выполнение
            }
            
            // Уведомляем пользователя
            await ctx.telegram.sendMessage(result.request.userId, 
                `🎉 **Ваша заявка на вывод одобрена!**\n\n` +
                `📋 **Детали заявки:**\n` +
                `├ 🆔 ID: \`${result.request.id}\`\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `└ ✅ Статус: Одобрена\n\n` +
                `⏰ **Время одобрения:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n\n` +
                `💡 **Что дальше:** Ожидайте выплаты в течение 24-48 часов`
            );
            
            logger.info('Заявка на вывод одобрена', { userId, requestId, adminId: userId });

            // Отвечаем на callback-запрос об успешном одобрении
            await ctx.answerCbQuery('✅ Заявка одобрена!', false);

        } else {
            await ctx.answerCbQuery(`❌ ${result.message}`);
            return;
        }

    } catch (error) {
        logger.error('Ошибка одобрения заявки на вывод', error, { userId, requestId });
        await ctx.answerCbQuery('❌ Ошибка при одобрении заявки');
    }
}

// Обработка отклонения заявки на вывод (только для админов)
async function handleRejectWithdrawal(ctx, action) {
    const userId = ctx.from.id;
    const requestId = action.replace('reject_withdrawal_', '');
    const messageId = ctx.callbackQuery?.message?.message_id;
    const chatId = ctx.chat?.id;

    logger.info('🚫 НАЧАЛО ОБРАБОТКИ ОТКЛОНЕНИЯ ЗАЯВКИ', {
        userId,
        requestId,
        messageId,
        chatId,
        chatType: ctx.chat?.type,
        chatUsername: ctx.chat?.username,
        action: action,
        callbackData: ctx.callbackQuery?.data,
        hasEditMessageText: !!ctx.editMessageText,
        hasReply: !!ctx.reply,
        timestamp: new Date().toISOString()
    });

    try {
        // Отвечаем на callback-запрос сразу, чтобы избежать таймаута
        await ctx.answerCbQuery('🚫 Выберите причину отклонения', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для отклонения заявок', true);
            return;
        }
        
        // Импортируем dataManager
        const { dataManager } = require('../utils/dataManager');
        
        // Получаем информацию о заявке
        const withdrawalRequest = await dataManager.db.collection('withdrawals').findOne({ id: requestId });
        
        if (!withdrawalRequest) {
            return;
        }
        
        // Обновляем сообщение в канале с кнопками причин отклонения
        const updatedMessage = `📋 **Заявка на вывод - ВЫБОР ПРИЧИНЫ ОТКЛОНЕНИЯ** 🚫\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${withdrawalRequest.userId}\`\n` +
            `├ 👤 Имя: ${withdrawalRequest.firstName}\n` +
            `└ 🏷️ Username: ${withdrawalRequest.username}\n\n` +
            `💰 **Детали заявки:**\n` +
            `├ 🆔 ID заявки: №${withdrawalRequest.id}\n` +
            `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
            `├ 📅 Дата: ${new Date(withdrawalRequest.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(withdrawalRequest.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `🚫 **Выберите причину отклонения:**`;
        
        // Создаем клавиатуру с причинами отклонения
        const rejectionKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '🔍 Махинации',
                        callback_data: `reject_reason_fraud_${withdrawalRequest.id}`,
                        web_app: undefined
                    },
                    {
                        text: '🤖 Ферма аккаунтов',
                        callback_data: `reject_reason_farm_${withdrawalRequest.id}`,
                        web_app: undefined
                    }
                ],
                [
                    {
                        text: '🔄 Повторите попытку',
                        callback_data: `reject_reason_retry_${withdrawalRequest.id}`,
                        web_app: undefined
                    },
                    {
                        text: '❌ Без объяснений',
                        callback_data: `reject_reason_no_comment_${withdrawalRequest.id}`,
                        web_app: undefined
                    }
                ]
            ]
        };
        
        // Обновляем сообщение в канале
        try {
            // Проверяем, есть ли у нас доступ к editMessageText
            if (ctx.editMessageText) {
            await ctx.editMessageText(updatedMessage, {
                parse_mode: 'Markdown',
                reply_markup: rejectionKeyboard
            });
            } else {
                // Если нет доступа к editMessageText, отправляем новое сообщение
                await ctx.reply(updatedMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: rejectionKeyboard
                });
            }
            
            logger.info('Показаны кнопки причин отклонения', { 
                userId, 
                requestId,
                hasEditMessageText: !!ctx.editMessageText
            });
            
        } catch (editError) {
            logger.error('Ошибка обновления сообщения в канале', editError, { userId, requestId });
            
            // Попробуем отправить новое сообщение как fallback
            try {
                await ctx.reply(updatedMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: rejectionKeyboard
                });
                logger.info('Отправлено новое сообщение с кнопками причин отклонения', { userId, requestId });
            } catch (fallbackError) {
                logger.error('Ошибка отправки fallback сообщения', fallbackError, { userId, requestId });
            }
        }

    } catch (error) {
        logger.error('Ошибка отклонения заявки на вывод', error, { userId, requestId });
        await ctx.answerCbQuery('❌ Ошибка при отклонении заявки');
    }
}

// Обработка проверки подписки
async function handleCheckSubscription(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Проверка подписки пользователя', { userId });
    
    try {
        // Проверяем подписку пользователя
        const subscriptionCheck = await dataManager.checkUserSubscription(userId, null, ctx.telegram);
        
        if (subscriptionCheck.isSubscribed) {
            // Подписка подтверждена - показываем главное меню
            const successMessage = `✅ **Подписка подтверждена!**\n\n` +
                `🎉 Теперь вы можете использовать все функции бота!\n\n` +
                `🚀 Добро пожаловать в Magnum Stars!`;
            
            // Проверяем, является ли пользователь админом
            const userIsAdmin = isAdmin(userId);

            // Создаем кнопку WebApp - теперь доступна для всех пользователей
            const webAppButton = Markup.button.webApp('🚀 Magnum Star - ДОСТУПНО!', process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com');

            // Создаем основное меню
            const mainMenuButtons = [
                [Markup.button.callback('👤 Профиль', 'profile')],
                [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), webAppButton],
                [Markup.button.callback('⭐ Вывести звезды', 'withdraw')]
            ];
            
            // Добавляем кнопку админ панели только для админов
            if (userIsAdmin) {
                mainMenuButtons.push([Markup.button.callback('⚙️ Админ панель', 'admin_panel')]);
            }
            
            const mainMenu = Markup.inlineKeyboard(mainMenuButtons);
            
            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: mainMenu.reply_markup
            });
            
            logger.info('Подписка пользователя подтверждена, показано главное меню', { userId });
            
        } else {
            // Подписка не подтверждена - показываем мотивирующее сообщение
            const errorMessage = `🚀 **Перед началом использования Magnum Stars подпишись на наших спонсоров!**\n\n` +
                `📢 Это обязательное условие для доступа к функциям бота.\n\n` +
                `✅ **После подписки жми «Проверить» и продолжай игру!**`;
            
            const subscriptionKeyboard = Markup.inlineKeyboard([
                [Markup.button.url('📢 Подписаться на канал', 'https://t.me/magnumtap')],
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')]
            ]);
            
            await ctx.editMessageText(errorMessage, {
                parse_mode: 'Markdown',
                reply_markup: subscriptionKeyboard.reply_markup
            });
            
            logger.info('Подписка пользователя не подтверждена', { userId });
        }
        
    } catch (error) {
        logger.error('Ошибка проверки подписки', error, { userId });
        
        const errorMessage = `❌ **Ошибка проверки подписки**\n\n` +
            `🚫 Не удалось проверить подписку\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'check_subscription')],
            [Markup.button.callback('🏠 Главное меню', 'start')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка управления титулами
// Функция handleManageTitles удалена - функционал убран из бота
async function handleManageTitles(ctx) {
    // Функционал убран из бота
    await ctx.answerCbQuery('🔄 Функционал титулов убран из бота', false);
    return;
}

// Обработка проверки пропущенных наград за майнинг
async function handleCheckMissedRewards(ctx) {
    const userId = ctx.from.id;

    logger.info('⛔ Обработка проверки пропущенных наград отключена', { userId });

    // Функционал майнинга отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Обработка создания поста
async function handleCreatePost(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка создания поста', { userId });
    
    // Устанавливаем состояние создания поста
    userStates.set(userId, {
        state: 'creating_post',
        currentStep: 'text',
        data: {
            text: '',
            buttonText: '',
            buttonUrl: '',
            hasScreenshot: false
        },
        timestamp: Date.now()
    });
    
    logger.userState(userId, 'set', { state: 'creating_post' });
    
    const createPostMessage = `📝 **Создание поста в канал новостей**\n\n` +
        `📢 Пост будет опубликован в канале @magnumtap\n\n` +
        `📋 **Что нужно указать:**\n` +
        `1️⃣ Текст поста\n` +
        `2️⃣ Название кнопки (опционально)\n` +
        `3️⃣ Ссылка для кнопки (опционально)\n` +
        `4️⃣ Скриншот (опционально)\n\n` +
        `💬 **Отправьте текст поста в чат:**`;
    
    const createPostKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);
    
    await ctx.editMessageText(createPostMessage, {
        parse_mode: 'Markdown',
        reply_markup: createPostKeyboard.reply_markup
    });
}

// Обработка создания ключа майнера
async function handleCreateMinerKey(ctx) {
    const userId = ctx.from.id;

    logger.info('⛔ Обработка создания ключа майнера отключена', { userId });

    // Функционал майнинга отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;
}

// Обработка выбора типа майнера для ключа
async function handleMinerKeyType(ctx, minerType) {
    const userId = ctx.from.id;

    logger.info('⛔ Обработка выбора типа майнера для ключа отключена', { userId, minerType });

    // Функционал майнинга отключен
    await ctx.answerCbQuery('⛔ Функционал майнеров отключен', false);
    return;

    // Устанавливаем состояние создания ключа майнера
    userStates.set(userId, {
        state: 'creating_miner_key',
        currentStep: 'max_uses',
        data: {
            minerType: minerType,
            maxUses: 1
        },
        timestamp: Date.now()
    });

    logger.userState(userId, 'set', { state: 'creating_miner_key' });

    const displayMinerName = minerType === 'novice' ? 'Новичок' : 'Путь к звездам';
    const displayPriceSymbol = minerType === 'novice' ? '🪙' : '⭐';
    const displayRewardSymbol = minerType === 'novice' ? '🪙' : '⭐';

    const message = `⛏️ **Создание ключа майнера**\n\n` +
        `🎯 Тип майнера: ${displayMinerName}\n` +
        `💰 Цена майнера: 100 ${displayPriceSymbol}\n` +
        `⚡ Доход: ${minerType === 'novice' ? '1' : '0.01'} ${displayRewardSymbol}/мин\n\n` +
        `🔄 Введите максимальное количество активаций:\n\n` +
        `💡 Пример: 1`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);

    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });
}

// Обработка создания ключа майнера из текстового сообщения
async function handleMinerKeyCreation(ctx, text) {
    const userId = ctx.from.id;

    logger.info('⛔ Обработка создания ключа майнера из текста отключена', { userId, text });

    // Функционал майнинга отключен
    return;

    try {
        if (userState.currentStep === 'max_uses') {
            const maxUses = parseInt(text);
            if (isNaN(maxUses) || maxUses <= 0) {
                await ctx.reply('❌ Введите корректное число больше 0');
                return;
            }

            userState.data.maxUses = maxUses;

            // Создаем ключ майнера
            const { generateKey } = require('../utils/keys');
            const key = generateKey();

            const keyData = {
                key: key,
                type: 'miner',
                minerType: userState.data.minerType,
                maxUses: maxUses,
                createdBy: userId,
                createdAt: new Date()
            };

            try {
                const createResult = await dataManager.createMinerKey(keyData);

                if (createResult.success) {
                    const minerDisplayName = userState.data.minerType === 'novice' ? 'Новичок' : 'Путь к звездам';
                    const successPriceSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';
                    const successRewardSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';

                    const successMessage = `✅ **Ключ майнера успешно создан!**\n\n` +
                        `🔑 Ключ: \`${key}\`\n` +
                        `⛏️ Майнер: ${minerDisplayName}\n` +
                        `💰 Цена: 100 ${successPriceSymbol}\n` +
                        `⚡ Доход: ${userState.data.minerType === 'novice' ? '1' : '0.01'} ${successRewardSymbol}/мин\n` +
                        `🔄 Максимум активаций: ${maxUses}\n\n` +
                        `💡 Пользователи могут активировать этот ключ в разделе "Активировать ключ"`;

                    const keyboard = Markup.inlineKeyboard([
                        [Markup.button.callback('⛏️ Создать еще ключ майнера', 'create_miner_key')],
                        [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
                    ]);

                    await ctx.reply(successMessage, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard.reply_markup
                    });

                    // Отправляем уведомление в чат
                    const chatMinerName = userState.data.minerType === 'novice' ? 'Новичок' : 'Путь к звездам';
                    const chatPriceSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';
                    const chatRewardSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';
                    const incomeRate = userState.data.minerType === 'novice' ? '1' : '0.01';

                    const chatMessage = `🎉 **Новый ключ доступен!**\n\n` +
                        `🔑 **Код:** \`${key}\`\n` +
                        `💰 **Награда:** ⛏️ ${chatMinerName} (100 ${chatPriceSymbol})\n` +
                        `🔄 **Доступно:** ${maxUses} активаций\n\n` +
                        `⚡ Успей активировать ключ в боте и забери бонус первым!`;

                    const { sendChannelNotification } = require('../middleware/chatFilter');
                    await sendChannelNotification(ctx, chatMessage);
                } else {
                    await ctx.reply('❌ Ошибка создания ключа майнера в базе данных');
                }

            } catch (error) {
                logger.error('Ошибка создания ключа майнера в базе данных', error, { userId, keyData });
                await ctx.reply('❌ Ошибка создания ключа майнера в базе данных');
            }

            // Очищаем состояние
            userStates.delete(userId);

        }

    } catch (error) {
        logger.error('Ошибка создания ключа майнера', error, { userId, text });
        await ctx.reply('❌ Произошла ошибка при создании ключа майнера');
        userStates.delete(userId);
    }
}




// Обработка статистики титулов (только админы)
// Функция handleTitlesStats удалена - функционал убран из бота


// Обработка раздела титулов
// Функция handleTitles (дубликат) удалена - функционал убран из бота


// Обработка раздела рефералов
async function handleReferrals(ctx) {
    const userId = ctx.from.id;

    logger.info('Обработка раздела рефералов', { userId });

    try {
        // Получаем реферальную статистику
        const referralStats = await getReferralStats(userId);

        // Получаем реферальный код пользователя
        const referralCode = await dataManager.getUserReferralCode(userId);

        // Создаем сообщение о рефералах
        const referralsMessage = `👥 **Ваши рефералы**\n\n` +
            `🔗 **Ваш реферальный код:** \`${referralCode}\`\n\n` +
            `📊 **Статистика:**\n` +
            `├ 👥 Всего рефералов: ${referralStats.totalReferrals}\n` +
            `├ ✅ Активных: ${referralStats.activeReferrals}\n` +
            `├ 💰 Реферальный доход: ${referralStats.totalEarned.stars} ⭐, ${referralStats.totalEarned.coins} 🪙\n` +
            `└ 🎯 Уровень: ${referralStats.level}\n\n` +
            `🎁 **Награды за приглашение:**\n` +
            `├ 💰 Новый пользователь получает: 1000 🪙 Magnum Coins\n` +
            `└ ⭐ Вы получаете: 5 ⭐ Stars + 1000 🪙 Magnum Coins\n\n` +
            `📋 **Как пригласить друзей:**\n` +
            `1️⃣ Скопируйте вашу реферальную ссылку\n` +
            `2️⃣ Отправьте друзьям: https://t.me/MagnumStarBot?start=${referralCode}\n` +
            `3️⃣ Когда друг зарегистрируется, вы получите награду!`;

        const referralsKeyboard = Markup.inlineKeyboard([
            [Markup.button.switchToChat('🔗 Скопировать реферальную ссылку', `https://t.me/MagnumStarBot?start=${referralCode}`)],
            [Markup.button.callback('📊 Топ рефералов', 'top_referrers')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);

        await ctx.editMessageText(referralsMessage, {
            parse_mode: 'Markdown',
            reply_markup: referralsKeyboard.reply_markup
        });

    } catch (error) {
        logger.error('Ошибка обработки раздела рефералов', error, { userId });

        const errorMessage = `❌ **Ошибка загрузки рефералов**\n\n` +
            `🚫 Не удалось загрузить данные рефералов\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;

        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'referrals')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);

        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}










// Обработка раздела поддержки
async function handleSupport(ctx) {
    const userId = ctx.from.id;

    logger.info('Обработка раздела поддержки', { userId });

    try {
        // Импортируем dataManager
        const dataManager = require('../utils/dataManager');

        // Проверяем, инициализирован ли dataManager и подключена ли база данных
        if (!dataManager.isInitialized) {
            throw new Error('Система поддержки временно недоступна. Попробуйте позже.');
        }

        const db = dataManager.getDb();
        if (!db) {
            throw new Error('База данных недоступна');
        }

        // Получаем активные тикеты пользователя
        const activeTickets = await db.collection('support_tickets')
            .find({ userId: Number(userId), status: { $in: ['open', 'in_progress'] } })
            .sort({ createdAt: -1 })
            .toArray();
        
        const supportMessage = `🆘 **Центр поддержки Magnum Stars**\n\n` +
            `💬 **Как мы можем помочь?**\n\n` +
            `📋 **Ваши активные тикеты:** ${activeTickets.length}\n\n` +
            `🎯 **Доступные действия:**\n` +
            `├ 📝 Создать новый тикет\n` +
            `├ 📋 Мои тикеты\n` +
            `└ 📚 FAQ и инструкции\n\n` +
            `💡 **Совет:** Опишите проблему подробно, приложите скриншоты если нужно`;
        
        const supportKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📝 Создать тикет', 'create_ticket')],
            [Markup.button.callback('📋 Мои тикеты', 'my_tickets')],
            [Markup.button.callback('📚 FAQ', 'support_faq')],
            [Markup.button.callback('🔙 Назад к профилю', 'profile')]
        ]);
        
        await ctx.editMessageText(supportMessage, {
            parse_mode: 'Markdown',
            reply_markup: supportKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки раздела поддержки', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки поддержки**\n\n` +
            `🚫 Не удалось загрузить данные\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'support')],
            [Markup.button.callback('🔙 Назад к профилю', 'profile')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Создание нового тикета поддержки
async function handleCreateTicket(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Создание нового тикета поддержки', { userId });
    
    try {
        // Устанавливаем состояние создания тикета
        const { userStates } = require('./callback');
        userStates.set(userId, {
            state: 'creating_support_ticket',
            currentStep: 'waiting_description',
            data: {
                description: '',
                attachments: []
            },
            timestamp: Date.now()
        });
        
        const createTicketMessage = `📝 **Создание тикета поддержки**\n\n` +
            `💬 **Опишите вашу проблему:**\n\n` +
            `💡 **Советы:**\n` +
            `├ 📝 Будьте конкретны и подробны\n` +
            `├ 🖼️ Можете приложить скриншоты\n` +
            `└ ⏰ Ответим в течение 24 часов\n\n` +
            `📝 **Отправьте описание проблемы в чат:**`;
        
        const createTicketKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Отмена', 'support')]
        ]);
        
        await ctx.editMessageText(createTicketMessage, {
            parse_mode: 'Markdown',
            reply_markup: createTicketKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка создания тикета поддержки', error, { userId });
        await ctx.reply('❌ Ошибка при создании тикета. Попробуйте позже.');
    }
}

// Просмотр тикетов пользователя
async function handleMyTickets(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Просмотр тикетов пользователя', { userId });
    
    try {
        // Импортируем dataManager
        const dataManager = require('../utils/dataManager');
        
        const tickets = await dataManager.db.collection('support_tickets')
            .find({ userId: Number(userId) })
            .sort({ createdAt: -1 })
            .toArray();
        
        if (tickets.length === 0) {
            const noTicketsMessage = `📋 **Мои тикеты**\n\n` +
                `❌ У вас пока нет тикетов\n\n` +
                `💡 Создайте первый тикет, нажав "📝 Создать тикет"`;
            
            const noTicketsKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📝 Создать тикет', 'create_ticket')],
                [Markup.button.callback('🔙 Назад к поддержке', 'support')]
            ]);
            
            await ctx.editMessageText(noTicketsMessage, {
                parse_mode: 'Markdown',
                reply_markup: noTicketsKeyboard.reply_markup
            });
            return;
        }
        
        let ticketsMessage = `📋 **Мои тикеты**\n\n`;
        
        for (const ticket of tickets) {
            const status = ticket.status === 'open' ? '🆕 Открыт' : 
                          ticket.status === 'in_progress' ? '⏳ В работе' : 
                          ticket.status === 'closed' ? '✅ Закрыт' : '❓ Неизвестно';
            
            const date = new Date(ticket.createdAt).toLocaleDateString('ru-RU');
            const time = new Date(ticket.createdAt).toLocaleTimeString('ru-RU');
            
            ticketsMessage += `📋 **Тикет #${ticket.id}**\n` +
                `├ 📝 Описание: ${ticket.description.substring(0, 50)}${ticket.description.length > 50 ? '...' : ''}\n` +
                `├ 📅 Дата: ${date} ${time}\n` +
                `├ 📊 Статус: ${status}\n`;
            
            if (ticket.status === 'closed') {
                const closedDate = new Date(ticket.closedAt).toLocaleDateString('ru-RU');
                const closedTime = new Date(ticket.closedAt).toLocaleTimeString('ru-RU');
                ticketsMessage += `└ ⏰ Закрыт: ${closedDate} ${closedTime}\n`;
            } else {
                ticketsMessage += `└ ⏰ Ожидает ответа\n`;
            }
            
            ticketsMessage += '\n';
        }
        
        const ticketsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📝 Создать новый тикет', 'create_ticket')],
            [Markup.button.callback('🔙 Назад к поддержке', 'support')]
        ]);
        
        await ctx.editMessageText(ticketsMessage, {
            parse_mode: 'Markdown',
            reply_markup: ticketsKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка просмотра тикетов', error, { userId });
        await ctx.reply('❌ Ошибка при загрузке тикетов. Попробуйте позже.');
    }
}

// FAQ поддержки
async function handleSupportFAQ(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Просмотр FAQ поддержки', { userId });
    
    try {
        const faqMessage = `📚 **FAQ - Часто задаваемые вопросы**\n\n` +
            `❓ **Как создать тикет?**\n` +
            `├ 📝 Нажмите "📝 Создать тикет"\n` +
            `├ 💬 Опишите проблему подробно\n` +
            `└ 🖼️ Приложите скриншоты если нужно\n\n` +
            `❓ **Сколько ждать ответа?**\n` +
            `├ ⏰ Обычно в течение 24 часов\n` +
            `├ 🚀 В рабочее время быстрее\n` +
            `└ 📱 Вы получите уведомление\n\n` +
            `❓ **Что делать если тикет не решен?**\n` +
            `├ 💬 Напишите в тикет дополнительную информацию\n` +
            `├ 🖼️ Приложите новые скриншоты\n` +
            `└ 📞 Обратитесь к администратору\n\n` +
            `❓ **Как закрыть тикет?**\n` +
            `├ ✅ Администратор закроет тикет\n` +
            `├ 💬 После решения проблемы\n` +
            `└ 📋 Вы получите уведомление`;
        
        const faqKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📝 Создать тикет', 'create_ticket')],
            [Markup.button.callback('🔙 Назад к поддержке', 'support')]
        ]);
        
        await ctx.editMessageText(faqMessage, {
            parse_mode: 'Markdown',
            reply_markup: faqKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа FAQ', error, { userId });
        await ctx.reply('❌ Ошибка при загрузке FAQ. Попробуйте позже.');
    }
}

// Взятие тикета в работу
async function handleTakeTicket(ctx, action) {
    const userId = ctx.from.id;
    const ticketId = action.replace('take_ticket_', '');

    logger.info('👨‍💼 Взятие тикета в работу', { userId, ticketId });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery('👨‍💼 Тикет взят в работу!', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            return;
        }
        
        // Получаем информацию о тикете
        const { dataManager } = require('../utils/dataManager');
        const ticket = await dataManager.db.collection('support_tickets').findOne({ id: ticketId });
        
        if (!ticket) {
            return;
        }
        
        // Обновляем статус тикета
        await dataManager.db.collection('support_tickets').updateOne(
            { id: ticketId },
            { 
                $set: { 
                    status: 'in_progress',
                    assignedTo: userId,
                    assignedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
        
        // Обновляем сообщение в канале
        const updatedMessage = `🆘 **Тикет поддержки - В РАБОТЕ** ⏳\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${ticket.userId}\`\n` +
            `├ 👤 Имя: ${ticket.firstName}\n` +
            `└ 🏷️ Username: ${ticket.username ? `@${ticket.username}` : '@username'}\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID тикета: \`${ticket.id}\`\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 200)}${ticket.description.length > 200 ? '...' : ''}\n` +
            `├ 📅 Дата: ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(ticket.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `👨‍💼 **Взят в работу:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n` +
            `👤 **Админ:** ${ctx.from.first_name || 'Не указано'}\n\n` +
            `💬 **Теперь вы можете отвечать на тикет**`;
        
        // Создаем клавиатуру, видимую только админам
        const updatedKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '💬 Ответить на тикет',
                        callback_data: `reply_ticket_${ticketId}`,
                        web_app: undefined
                    }
                ],
                [
                    {
                        text: '✅ Закрыть тикет',
                        callback_data: `close_ticket_${ticketId}`,
                        web_app: undefined
                    }
                ]
            ]
        };
        
        try {
            await ctx.editMessageText(updatedMessage, {
                parse_mode: 'Markdown',
                reply_markup: updatedKeyboard
            });
        } catch (editError) {
            logger.error('Ошибка обновления сообщения в канале', editError, { userId, ticketId });
        }
        
        // Уведомляем пользователя
        await ctx.telegram.sendMessage(ticket.userId, 
            `⏳ **Ваш тикет взят в работу!**\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID: \`${ticket.id}\`\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}\n` +
            `└ ⏳ Статус: В работе\n\n` +
            `👨‍💼 **Администратор работает над решением**\n` +
            `⏰ **Время ответа:** В ближайшее время`
        );
        
        logger.info('Тикет успешно взят в работу', { userId, ticketId });
        
    } catch (error) {
        logger.error('Ошибка взятия тикета в работу', error, { userId, ticketId });
    }
}

// Закрытие тикета
async function handleCloseTicket(ctx, action) {
    const userId = ctx.from.id;
    const ticketId = action.replace('close_ticket_', '');

    logger.info('✅ Закрытие тикета', { userId, ticketId });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery('✅ Тикет закрыт!', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            return;
        }
        
        // Получаем информацию о тикете
        const dataManager = require('../utils/dataManager');
        const ticket = await dataManager.db.collection('support_tickets').updateOne(
            { id: ticketId },
            { 
                $set: { 
                    status: 'closed',
                    closedAt: new Date(),
                    closedBy: userId,
                    updatedAt: new Date()
                }
            }
        );
        
        // Обновляем сообщение в канале
        const finalMessage = `🆘 **Тикет поддержки - ЗАКРЫТ** ✅\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${ticket.userId}\`\n` +
            `├ 👤 Имя: ${ticket.firstName}\n` +
            `└ 🏷️ Username: ${ticket.username ? `@${ticket.username}` : '@username'}\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID тикета: \`${ticket.id}\`\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 200)}${ticket.description.length > 200 ? '...' : ''}\n` +
            `├ 📅 Дата: ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(ticket.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `✅ **Закрыт:** ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}\n` +
            `👨‍💼 **Админ:** ${ctx.from.first_name || 'Не указано'}\n\n` +
            `🎉 **Тикет успешно решен!**`;
        
        try {
            await ctx.editMessageText(finalMessage, { parse_mode: 'Markdown' });
        } catch (editError) {
            logger.error('Ошибка обновления финального сообщения', editError, { userId, ticketId });
        }
        
        // Уведомляем пользователя
        await ctx.telegram.sendMessage(ticket.userId, 
            `✅ **Ваш тикет закрыт!**\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID: \`${ticket.id}\`\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}\n` +
            `└ ✅ Статус: Закрыт\n\n` +
            `🎉 **Проблема решена!**\n` +
            `💡 Если у вас есть еще вопросы, создайте новый тикет`
        );
        
        logger.info('Тикет успешно закрыт', { userId, ticketId });
        
    } catch (error) {
        logger.error('Ошибка закрытия тикета', error, { userId, ticketId });
    }
}

// Ответ на тикет поддержки
async function handleReplyTicket(ctx, action) {
    const userId = ctx.from.id;
    const ticketId = action.replace('reply_ticket_', '');

    logger.info('💬 Ответ на тикет поддержки', { userId, ticketId });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery('💬 Готовим форму для ответа...', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            return;
        }
        
        // Получаем информацию о тикете
        const dataManager = require('../utils/dataManager');
        const ticket = await dataManager.db.collection('support_tickets').findOne({ id: ticketId });
        
        if (!ticket) {
            return;
        }
        
        // Показываем инструкцию для ответа
        const replyMessage = `💬 **Ответ на тикет поддержки**\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID: \`${ticket.id}\`\n` +
            `├ 👤 Пользователь: ${ticket.firstName}\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}\n` +
            `└ 📅 Дата: ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}\n\n` +
            `💬 **Инструкция:**\n` +
            `1️⃣ Напишите ответ пользователю\n` +
            `2️⃣ Или отправьте скриншот\n` +
            `3️⃣ Ответ будет автоматически отправлен\n\n` +
            `💡 **Важно:** Отправляйте ответ прямо в этот чат!`;
        
        const replyKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('❌ Отмена', `cancel_reply_${ticketId}`)]
        ]);
        
        // Обновляем сообщение в канале
        try {
            await ctx.editMessageText(replyMessage, {
                parse_mode: 'Markdown',
                reply_markup: replyKeyboard.reply_markup
            });
            
            // Устанавливаем состояние ожидания ответа для админа
            const { userStates } = require('./callback');
            userStates.set(userId, {
                state: 'replying_to_ticket',
                currentStep: 'waiting_reply',
                data: {
                    ticketId: ticketId,
                    ticketData: ticket
                },
                timestamp: Date.now()
            });
            
            logger.info('Админ переведен в состояние ответа на тикет', { 
                userId, 
                ticketId, 
                state: 'replying_to_ticket' 
            });
            
        } catch (editError) {
            logger.error('Ошибка обновления сообщения в канале (ответ)', editError, {
                userId,
                ticketId
            });
            
            // Отправляем новое сообщение если не удалось обновить
            await ctx.reply(replyMessage, {
                parse_mode: 'Markdown',
                reply_markup: replyKeyboard.reply_markup
            });
        }
        
    } catch (error) {
        logger.error('Ошибка подготовки ответа на тикет', error, { userId, ticketId });
        await ctx.answerCbQuery('❌ Ошибка при подготовке формы для ответа');
    }
}

// Отмена ответа на тикет
async function handleCancelReply(ctx, action) {
    const userId = ctx.from.id;
    const ticketId = action.replace('cancel_reply_', '');

    logger.info('❌ Отмена ответа на тикет', { userId, ticketId });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery('❌ Ответ отменен', false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            return;
        }
        
        // Получаем информацию о тикете
        const dataManager = require('../utils/dataManager');
        const ticket = await dataManager.db.collection('support_tickets').findOne({ id: ticketId });
        
        if (!ticket) {
            return;
        }
        
        // Возвращаем исходное сообщение с тикетом
        const originalMessage = `🆘 **Тикет поддержки - В РАБОТЕ** ⏳\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${ticket.userId}\`\n` +
            `├ 👤 Имя: ${ticket.firstName}\n` +
            `└ 🏷️ Username: ${ticket.username ? `@${ticket.username}` : '@username'}\n\n` +
            `📋 **Детали тикета:**\n` +
            `├ 🆔 ID тикета: \`${ticket.id}\`\n` +
            `├ 📝 Описание: ${ticket.description.substring(0, 200)}${ticket.description.length > 200 ? '...' : ''}\n` +
            `├ 📅 Дата: ${new Date(ticket.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(ticket.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `👨‍💼 **Взят в работу:** ${new Date(ticket.assignedAt).toLocaleDateString('ru-RU')} ${new Date(ticket.assignedAt).toLocaleTimeString('ru-RU')}\n` +
            `👤 **Админ:** ${ctx.from.first_name || 'Не указано'}\n\n` +
            `💬 **Теперь вы можете отвечать на тикет**`;
        
        // Создаем клавиатуру, видимую только админам
        const originalKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '💬 Ответить на тикет',
                        callback_data: `reply_ticket_${ticket.id}`,
                        web_app: undefined
                    }
                ],
                [
                    {
                        text: '✅ Закрыть тикет',
                        callback_data: `close_ticket_${ticket.id}`,
                        web_app: undefined
                    }
                ]
            ]
        };
        
        // Обновляем сообщение в канале
        try {
            await ctx.editMessageText(originalMessage, {
                parse_mode: 'Markdown',
                reply_markup: originalKeyboard
            });
        } catch (editError) {
            logger.error('Ошибка восстановления исходного сообщения', editError, { userId, ticketId });
        }
        
        // Очищаем состояние админа
        const { userStates } = require('./callback');
        userStates.delete(userId);
        
        logger.info('Состояние админа очищено, возвращено исходное сообщение', { userId, ticketId });
        
    } catch (error) {
        logger.error('Ошибка отмены ответа на тикет', error, { userId, ticketId });
    }
}

// Обработка заявки на вывод - показ кнопок одобрения/отклонения
async function handleProcessWithdrawal(ctx, action) {
    const userId = ctx.from.id;
    const requestId = action.replace('process_withdrawal_', '');

    logger.info('🔧 ОБРАБОТКА ЗАЯВКИ НА ВЫВОД', {
        userId,
        requestId,
        timestamp: new Date().toISOString()
    });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery('🔧 Заявка взята в обработку', false);

        // Проверяем, является ли пользователь админом
        const isUserAdmin = isAdmin(userId);
        logger.info('🔍 Проверка прав админа для обработки заявки', {
            userId,
            isUserAdmin,
            chatId: ctx.chat?.id,
            chatType: ctx.chat?.type,
            callbackData: action
        });

        if (!isUserAdmin) {
            logger.warn('🚫 Пользователь не является админом', {
                userId,
                chatId: ctx.chat?.id,
                chatType: ctx.chat?.type
            });
            await ctx.answerCbQuery('❌ У вас нет прав для обработки заявок', true);
            return;
        }

        logger.info('✅ Админ подтвердил права, продолжаем обработку', {
            userId,
            requestId,
            chatId: ctx.chat?.id
        });

        // Импортируем dataManager
        const dataManager = require('../utils/dataManager');

        // Проверяем инициализацию dataManager
        if (!dataManager.isInitialized) {
            logger.error('dataManager не инициализирован', { userId, requestId });
            await ctx.answerCbQuery('❌ Система временно недоступна', true);
            return;
        }

        const db = dataManager.getDb();
        if (!db) {
            logger.error('База данных недоступна', { userId, requestId });
            await ctx.answerCbQuery('❌ База данных недоступна', true);
            return;
        }

        // Получаем информацию о заявке
        logger.info('Ищем заявку в базе данных', { requestId });
        const withdrawalRequest = await db.collection('withdrawals').findOne({ id: requestId });

        if (!withdrawalRequest) {
            logger.warn('Заявка не найдена', { requestId });
            await ctx.answerCbQuery('❌ Заявка не найдена', true);
            return;
        }

        logger.info('Заявка найдена', { requestId, userId: withdrawalRequest.userId });
        
        // Обновляем сообщение в канале с кнопками одобрения/отклонения
        const updatedMessage = `📋 **Заявка на вывод - В ОБРАБОТКЕ** 🔧\n\n` +
            `👤 **Пользователь:**\n` +
            `├ 🆔 ID: \`${withdrawalRequest.userId}\`\n` +
            `├ 👤 Имя: ${withdrawalRequest.firstName}\n` +
            `└ 🏷️ Username: ${withdrawalRequest.username}\n\n` +
            `💰 **Детали заявки:**\n` +
            `├ 🆔 ID заявки: №${withdrawalRequest.id}\n` +
            `├ 💰 Сумма: ${withdrawalRequest.amount} ⭐ Stars\n` +
            `├ 📅 Дата: ${new Date(withdrawalRequest.createdAt).toLocaleDateString('ru-RU')}\n` +
            `└ ⏰ Время: ${new Date(withdrawalRequest.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
            `🎯 **Действия:**`;
        
        // Создаем клавиатуру с кнопками одобрения/отклонения
        const updatedKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Одобрить',
                        callback_data: `approve_withdrawal_${withdrawalRequest.id}`,
                        web_app: undefined
                    },
                    {
                        text: '❌ Отклонить',
                        callback_data: `reject_withdrawal_${withdrawalRequest.id}`,
                        web_app: undefined
                    }
                ]
            ]
        };
        
        // Обновляем сообщение в канале
        logger.info('Пытаемся обновить сообщение в канале', {
            userId,
            requestId,
            chatId: ctx.chat?.id,
            messageId: ctx.callbackQuery?.message?.message_id
        });

        try {
            await ctx.editMessageText(updatedMessage, {
                parse_mode: 'Markdown',
                reply_markup: updatedKeyboard
            });

            logger.info('✅ Заявка взята в обработку, показаны кнопки одобрения/отклонения', {
                userId,
                requestId,
                chatId: ctx.chat?.id,
                messageId: ctx.callbackQuery?.message?.message_id
            });

        } catch (editError) {
            logger.error('❌ Ошибка обновления сообщения в канале', editError, {
                userId,
                requestId,
                chatId: ctx.chat?.id,
                messageId: ctx.callbackQuery?.message?.message_id,
                errorMessage: editError.message,
                errorCode: editError.code
            });

            // Проверяем тип ошибки
            if (editError.code === 400 || editError.message?.includes('message is not modified')) {
                // Сообщение уже имеет такой же текст, просто отвечаем
                try {
                    await ctx.answerCbQuery('🔧 Заявка уже в обработке', false);
                    logger.info('Сообщение уже в обработке, пропускаем обновление', { userId, requestId });
                } catch (answerError) {
                    logger.error('Не удалось отправить уведомление', answerError);
                }
            } else if (editError.code === 403 || editError.message?.includes('bot was blocked')) {
                // Бот заблокирован или не имеет прав
                try {
                    await ctx.answerCbQuery('❌ Бот не имеет прав на редактирование в этом канале', true);
                    logger.warn('Бот не имеет прав на редактирование в канале', { userId, requestId });
                } catch (answerError) {
                    logger.error('Не удалось отправить уведомление об отсутствии прав', answerError);
                }
            } else if (editError.code === 429) {
                // Слишком много запросов
                try {
                    await ctx.answerCbQuery('⏳ Слишком много запросов, попробуйте позже', true);
                    logger.warn('Слишком много запросов при обработке заявки', { userId, requestId });
                } catch (answerError) {
                    logger.error('Не удалось отправить уведомление о rate limit', answerError);
                }
            } else {
                // Другая ошибка
                try {
                    await ctx.answerCbQuery(`❌ Ошибка: ${editError.message}`, true);
                    logger.error('Неизвестная ошибка при обновлении сообщения', editError);
            } catch (answerError) {
                logger.error('Не удалось отправить уведомление об ошибке', answerError);
                }
            }
        }
        
    } catch (error) {
        logger.error('Ошибка обработки заявки на вывод', error, { userId, requestId });
    }
}

// Обработка отклонения заявки с указанием причины
async function handleRejectWithReason(ctx, action) {
    const userId = ctx.from.id;
    
    // Парсим action для получения причины и ID заявки
    let reason = '';
    let requestId = '';
    
    if (action.startsWith('reject_reason_fraud_')) {
        reason = 'Махинации';
        requestId = action.replace('reject_reason_fraud_', '');
    } else if (action.startsWith('reject_reason_farm_')) {
        reason = 'Ферма аккаунтов';
        requestId = action.replace('reject_reason_farm_', '');
    } else if (action.startsWith('reject_reason_retry_')) {
        reason = 'Повторите попытку';
        requestId = action.replace('reject_reason_retry_', '');
    } else if (action.startsWith('reject_reason_no_comment_')) {
        reason = 'Без объяснений';
        requestId = action.replace('reject_reason_no_comment_', '');
    }

    logger.info('🚫 ОТКЛОНЕНИЕ ЗАЯВКИ С ПРИЧИНОЙ', {
        userId,
        requestId,
        reason,
        timestamp: new Date().toISOString()
    });

    try {
        // Отвечаем на callback-запрос
        await ctx.answerCbQuery(`🚫 Заявка отклонена: ${reason}`, false);

        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            return;
        }
        
        // Обрабатываем заявку
        const result = await dataManager.processWithdrawalRequest(requestId, 'reject', userId, reason);
        
        if (result.success) {
            // Обновляем сообщение в канале
            const updatedMessage = `📋 **Заявка на вывод ОТКЛОНЕНА** ❌\n\n` +
                `👤 **Пользователь:**\n` +
                `├ 🆔 ID: \`${result.request.userId}\`\n` +
                `├ 👤 Имя: ${result.request.firstName}\n` +
                `└ 🏷️ Username: ${result.request.username}\n\n` +
                `💰 **Детали заявки:**\n` +
                `├ 🆔 ID заявки: №${result.request.id}\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `├ 📅 Дата: ${new Date(result.request.createdAt).toLocaleDateString('ru-RU')}\n` +
                `└ ⏰ Время: ${new Date(result.request.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
                `🚫 **Причина отклонения:** ${reason}\n` +
                `❌ **Отклонено:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n\n` +
                `💰 **Звезды возвращены пользователю**`;

            // Обновляем сообщение в канале
            try {
                await ctx.editMessageText(updatedMessage, { parse_mode: 'Markdown' });
                logger.info('Сообщение в канале успешно обновлено (отклонение с причиной)', {
                    userId,
                    requestId,
                    reason
                });
            } catch (editError) {
                logger.error('Ошибка обновления сообщения в канале (отклонение)', editError, {
                    userId,
                    requestId,
                    reason
                });
            }
            
            // Уведомляем пользователя с указанием причины
            await ctx.telegram.sendMessage(result.request.userId, 
                `❌ **Ваша заявка на вывод отклонена**\n\n` +
                `📋 **Детали заявки:**\n` +
                `├ 🆔 ID: \`${result.request.id}\`\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `└ ❌ Статус: Отклонена\n\n` +
                `🚫 **Причина:** ${reason}\n` +
                `⏰ **Время отклонения:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n\n` +
                `💰 **Звезды возвращены на ваш баланс**\n\n` +
                `💡 **Что дальше:** Вы можете создать новую заявку на вывод`
            );
            
            logger.info('Заявка на вывод отклонена с причиной', { userId, requestId, reason, adminId: userId });

        } else {
            await ctx.answerCbQuery(`❌ ${result.message}`);
            return;
        }

    } catch (error) {
        logger.error('Ошибка отклонения заявки на вывод с причиной', error, { userId, requestId, reason });
        await ctx.answerCbQuery('❌ Ошибка при отклонении заявки');
    }
}

// Функция обработки кнопки "Заработать"
async function handleEarnMoney(ctx) {
    const userId = ctx.from.id;
    
    logger.info('💰 Показываем страницу заработка', { userId });
    
    try {
        const message = `💰 **Заработать**\n\n` +
            `🎯 Выберите способ заработка:\n\n` +
            `📺 **Просмотр рекламы** - зарабатывайте Stars за просмотр рекламных роликов\n` +
            `🎮 **Игры** - скоро будут доступны мини-игры\n` +
            `📱 **Задания** - выполняйте задания и получайте награды\n\n` +
            `💡 Все способы заработка абсолютно бесплатны!`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📺 Заработать звезды', 'earn_stars_ads')],
            [Markup.button.callback('🎮 Игры (скоро)', 'earn_games')],
            [Markup.button.callback('📱 Задания (скоро)', 'earn_tasks')],
            [Markup.button.callback('🔙 Назад', 'main_menu')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа страницы заработка', error, { userId });
        await ctx.answerCbQuery('❌ Ошибка при загрузке страницы');
    }
}

// Функция обработки кнопки "Заработать звезды"
async function handleEarnStarsAds(ctx) {
    const userId = ctx.from.id;
    
    logger.info('📺 Показываем страницу просмотра рекламы', { userId });
    
    try {
        const message = `📺 **Заработать звезды**\n\n` +
            `🎬 Просматривайте рекламные ролики и получайте Stars!\n\n` +
            `💰 **Награда:** 0.1 ⭐ за каждый просмотр\n` +
            `⏰ **Время:** ~30 секунд на ролик\n` +
            `🔄 **Лимит:** 10 роликов в день\n\n` +
            `🚀 Нажмите кнопку ниже, чтобы начать просмотр!`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🎬 Смотреть рекламу', 'watch_ad')],
            [Markup.button.callback('🔙 Назад', 'earn_money')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа страницы просмотра рекламы', error, { userId });
        await ctx.answerCbQuery('❌ Ошибка при загрузке страницы');
    }
}

// Функция обработки кнопки "Смотреть рекламу"
async function handleWatchAd(ctx) {
    const userId = ctx.from.id;
    
    logger.info('🎬 Обработка просмотра рекламы', { userId });
    
    try {
        // Пока что показываем заглушку, позже здесь будет встроена реклама
        const message = `🎬 **Просмотр рекламы**\n\n` +
            `📺 Реклама будет встроена здесь в ближайшее время!\n\n` +
            `💰 **Награда:** 0.1 ⭐\n` +
            `⏰ **Время:** ~30 секунд\n\n` +
            `🚀 Пока что вы можете:\n` +
            `• Кликать по монете в WebApp\n` +
            `• Получать ежедневные бонусы\n` +
            `• Приглашать друзей по реферальной ссылке\n\n` +
            `💡 Следите за обновлениями!`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'earn_stars_ads')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
        });
        
        await ctx.answerCbQuery('📺 Реклама будет добавлена в ближайшее время!');
        
    } catch (error) {
        logger.error('Ошибка обработки просмотра рекламы', error, { userId });
        await ctx.answerCbQuery('❌ Ошибка при загрузке рекламы');
    }
}

module.exports = {
    callbackHandler,
    updateLastBotMessage,
    getLastBotMessage,
    handleKeyCreation,

    handleReferrals,
    handleApproveWithdrawal,
    handleRejectWithdrawal,
    handleSupport,
    handleCreateTicket,
    handleMyTickets,
    handleSupportFAQ,
    handleTakeTicket,
    handleCloseTicket,
    handleReplyTicket,
    handleCancelReply,
    userStates,
    handleProcessWithdrawal,
    handleRejectWithReason,
    handleCreatePost,
    handleEarnMoney,
    handleEarnStarsAds,
    handleWatchAd
};
