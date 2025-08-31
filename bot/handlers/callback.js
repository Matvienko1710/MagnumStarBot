const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { getUserBalance } = require('../utils/currency');
const { getReferralStats } = require('../utils/referral');
const { isAdmin } = require('../utils/admin');
const dataManager = require('../utils/dataManager');
const { autoDeleteReplyMessage } = require('../utils/autoDelete');

// Состояния пользователей для создания ключей
const userStates = new Map();

// Обработчик callback запросов
async function callbackHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const callbackData = ctx.callbackQuery.data;
        
        logger.info('Получен callback запрос', { userId, callbackData });
        
        // Обрабатываем различные callback'и
        switch (callbackData) {
            case 'check_subscription':
                await handleCheckSubscription(ctx);
                break;
            case 'profile':
                await handleProfile(ctx);
                break;
                
            case 'miners':
                await handleMiners(ctx);
                break;
                
            case 'miners_shop':
                await handleMinersShop(ctx);
                break;
            case (action) => action.startsWith('next_miner_shop_'):
                const minerIndex = parseInt(action.replace('next_miner_shop_', ''));
                await handleMinersShop(ctx, minerIndex);
                break;
                
            case 'my_miners':
                await handleMyMiners(ctx);
                break;
                
            case 'start_mining':
                await handleStartMining(ctx);
                break;
            case 'mining_active':
                await ctx.answerCbQuery('⏰ Майнинг уже активен! Доход начисляется автоматически.');
                break;
                
            case 'buy_miner':
                await handleBuyMiner(ctx);
                break;
                
            case 'next_miner':
                await handleNextMiner(ctx);
                break;
                
            case 'buy_miner_novice':
                await handleBuyMiner(ctx, 'novice');
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
            case (action) => action.startsWith('approve_withdrawal_'):
                await handleApproveWithdrawal(ctx, action);
                break;
            case (action) => action.startsWith('reject_withdrawal_'):
                await handleRejectWithdrawal(ctx, action);
                break;
                
            case 'activate_key':
                await handleActivateKey(ctx);
                break;
                
            case 'referrals':
                await handleReferrals(ctx);
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
                
            case 'create_title_key':
                await handleCreateTitleKey(ctx);
                break;

            case 'create_miner_key':
                await handleCreateMinerKey(ctx);
                break;

            case 'miner_key_novice':
                await handleMinerKeyType(ctx, 'novice');
                break;

            case 'miner_key_star_path':
                await handleMinerKeyType(ctx, 'star_path');
                break;

            case 'clear_cache':
                await handleClearCache(ctx);
                break;
                
            case 'cache_stats':
                await handleCacheStats(ctx);
                break;
                
            case 'titles':
                await handleTitles(ctx);
                break;
                
            case 'my_titles':
                await handleMyTitles(ctx);
                break;
                
            case 'key_reward_stars':
                await handleKeyRewardType(ctx, 'stars');
                break;
                
            case 'key_reward_coins':
                await handleKeyRewardType(ctx, 'coins');
                break;
                
            case 'manage_titles':
                await handleManageTitles(ctx);
                break;
                
            case 'check_missed_rewards':
                await handleCheckMissedRewards(ctx);
                break;
                
            default:
                await ctx.reply('❌ Неизвестная команда');
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
        
        // Получаем текущий титул пользователя
        const { getUserCurrentTitle } = require('../utils/titles');
        const currentTitle = await getUserCurrentTitle(userId);
        
        const profileMessage = `🎮 **Твой профиль в Magnum Stars**\n\n` +
            `✨ Ник: ${ctx.from.first_name || 'Не указано'}\n` +
            `🆔 ID: \`${userId}\`\n` +
            `🏅 Титул: ${currentTitle.name}\n\n` +
            `💎 **Баланс:**\n` +
            `⭐ Stars → ${userBalance.stars}\n` +
            `🪙 Magnum Coins → ${userBalance.coins}\n\n` +
            `👥 Друзья: ${referralStats.totalReferrals}\n` +
            `💰 Реф. доход: ${referralStats.totalEarned.stars} ⭐`;
        
        const profileKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('👑 Титулы', 'titles')],
            [Markup.button.callback('👥 Рефералы', 'referrals')],
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

// Обработка майнеров - главное меню
async function handleMiners(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка майнеров - главное меню', { userId });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Получаем информацию о майнерах пользователя
        const userMiners = await dataManager.getUserMiners(userId);
        
        // Рассчитываем общий доход
        let totalCoinsPerMin = 0;
        let totalStarsPerMin = 0;
        
        userMiners.forEach(miner => {
            if (miner.isActive) {
                totalCoinsPerMin += miner.speed.coins;
                totalStarsPerMin += miner.speed.stars;
            }
        });
        
        const totalIncome = { coins: totalCoinsPerMin, stars: totalStarsPerMin };
        
        // Получаем информацию о лимитах майнеров
        const minerAvailability = await dataManager.getMinerAvailability('novice');
        const userMinerCount = await dataManager.getUserMinerCount(userId, 'novice');
        
        const minersMessage = `⛏️ **Главное меню майнеров**\n\n` +
            `💰 **Ваш баланс:**\n` +
            `├ 🪙 Magnum Coins: ${userBalance.coins}\n` +
            `└ ⭐ Stars: ${userBalance.stars}\n\n` +
            `⛏️ **Ваши майнеры:**\n` +
            `├ 📊 Всего майнеров: ${userMiners.length}\n` +
            `├ ⚡ Общий доход: ${totalIncome.coins} 🪙/мин\n` +
            `└ 💎 Доход в Stars: ${totalIncome.stars} ⭐/мин\n\n` +
            `📊 **Лимиты:**\n` +
            `├ 👤 У вас: ${userMinerCount}/${minerAvailability.maxPerUser} майнеров\n` +
            `├ 🌐 Активные майнеры на сервере: ${minerAvailability.activeCount}/${minerAvailability.globalLimit}\n` +
            `└ 🆕 Можно купить еще: ${Math.max(0, minerAvailability.maxPerUser - userMinerCount)} майнеров\n\n` +
            `🎯 **Выберите действие:**`;
    
    const minersKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Магазин майнеров', 'miners_shop')],
            [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
            [Markup.button.callback('🚀 Запустить майнинг', 'start_mining')],
        [Markup.button.callback('🏠 Главное меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(minersMessage, {
        parse_mode: 'Markdown',
        reply_markup: minersKeyboard.reply_markup
    });
        
    } catch (error) {
        logger.error('Ошибка обработки главного меню майнеров', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки майнеров**\n\n` +
            `🚫 Не удалось загрузить данные майнеров\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'miners')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}



// Обработка магазина майнеров
async function handleMinersShop(ctx, currentMinerIndex = 0) {
    const userId = ctx.from.id;
    
    logger.info('Обработка магазина майнеров', { userId, currentMinerIndex });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Список доступных майнеров
        const availableMiners = [
            {
                id: 'novice',
                name: 'Новичок',
                price: { coins: 100, stars: 0 },
                speed: { coins: 1, stars: 0 }, // 1 Magnum Coin в минуту
                rarity: 'Обычный',
                description: 'Первый майнер для начинающих. Добывает 1 🪙 Magnum Coin в минуту'
            }
        ];
        
        // Проверяем, что индекс в допустимых пределах
        if (currentMinerIndex >= availableMiners.length) {
            currentMinerIndex = 0;
        }
        
        const currentMiner = availableMiners[currentMinerIndex];
        
        // Получаем информацию о доступности майнера
        const minerAvailability = await dataManager.getMinerAvailability(currentMiner.id);
        const userMinerCount = await dataManager.getUserMinerCount(userId, currentMiner.id);
        
        // Формируем сообщение о текущем майнере
        const priceText = currentMiner.price.coins > 0 
            ? `${currentMiner.price.coins} 🪙 Magnum Coins`
            : `${currentMiner.price.stars} ⭐ Stars`;
            
        const speedText = currentMiner.speed.coins > 0
            ? `${currentMiner.speed.coins} 🪙/мин`
            : `${currentMiner.speed.stars} ⭐/мин`;
        
        const shopMessage = `🛒 **Магазин майнеров**\n\n` +
            `💰 **Ваш баланс:**\n` +
            `├ 🪙 Magnum Coins: ${userBalance.coins}\n` +
            `└ ⭐ Stars: ${userBalance.stars}\n\n` +
            `🎯 **${currentMiner.name}**\n` +
            `├ 💰 Цена: ${priceText}\n` +
            `├ ⚡ Скорость: ${speedText}\n` +
            `├ 🎯 Редкость: ${currentMiner.rarity}\n` +
            `├ 📝 Описание: ${currentMiner.description}\n\n` +
            `📊 **Лимиты сервера:**\n` +
            `├ 👤 У вас: ${userMinerCount}/${minerAvailability.maxPerUser} майнеров\n` +
            `├ 🌐 На сервере: ${minerAvailability.globalCount}/${minerAvailability.globalLimit} майнеров\n` +
            `└ 🆕 Доступно для покупки: ${minerAvailability.available} майнеров\n\n` +
            `🎯 **Выберите действие:**`;
        
        // Проверяем, можно ли купить майнер
        const canBuy = minerAvailability.isAvailable && 
                      userMinerCount < minerAvailability.maxPerUser &&
                      userBalance.coins >= currentMiner.price.coins;
        
        // Создаем клавиатуру с кнопками
        const shopKeyboard = [];
        
        // Кнопка покупки (активна только если можно купить)
        if (canBuy) {
            shopKeyboard.push([Markup.button.callback(
                `🛒 Купить ${currentMiner.name}`, 
                `buy_miner_${currentMiner.id}`
            )]);
        } else {
            // Показываем причину недоступности
            let reason = '';
            if (!minerAvailability.isAvailable) {
                reason = '❌ Достигнут общий лимит на сервере';
            } else if (userMinerCount >= minerAvailability.maxPerUser) {
                reason = '❌ Достигнут лимит на пользователя';
            } else if (userBalance.coins < currentMiner.price.coins) {
                reason = '❌ Недостаточно средств';
            }
            
            shopKeyboard.push([Markup.button.callback(
                reason, 
                'miners_shop'
            )]);
        }
        
        // Навигационные кнопки
        shopKeyboard.push([
            Markup.button.callback('🔙 Назад к майнерам', 'miners'),
            Markup.button.callback('🏠 Главное меню', 'main_menu')
        ]);
        
        await ctx.editMessageText(shopMessage, {
            parse_mode: 'Markdown',
            reply_markup: Markup.inlineKeyboard(shopKeyboard).reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки магазина майнеров', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки магазина**\n\n` +
            `🚫 Не удалось загрузить данные магазина\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}



// Обработка "Мои майнеры"
async function handleMyMiners(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка "Мои майнеры"', { userId });
    
    try {
        // Получаем майнеры пользователя
        const userMiners = await dataManager.getUserMiners(userId);
        
        if (userMiners.length === 0) {
            const noMinersMessage = `📊 **Мои майнеры**\n\n` +
                `❌ У вас пока нет майнеров\n\n` +
                `💡 Купите свой первый майнер в магазине, чтобы начать зарабатывать!`;
            
            const noMinersKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🛒 Магазин майнеров', 'miners_shop')],
                [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]);
            
            await ctx.editMessageText(noMinersMessage, {
                parse_mode: 'Markdown',
                reply_markup: noMinersKeyboard.reply_markup
            });
            return;
        }
        
        // Рассчитываем общий доход
        let totalCoinsPerMin = 0;
        let totalStarsPerMin = 0;
        
        userMiners.forEach(miner => {
            if (miner.isActive) {
                totalCoinsPerMin += miner.speed.coins;
                totalStarsPerMin += miner.speed.stars;
            }
        });
        
        // Получаем информацию о лимитах майнеров
        const minerAvailability = await dataManager.getMinerAvailability('novice');
        const userMinerCount = await dataManager.getUserMinerCount(userId, 'novice');
        
        const myMinersMessage = `📊 **Мои майнеры**\n\n` +
            `⛏️ **Всего майнеров:** ${userMiners.length}\n\n` +
            `💰 **Общий доход:**\n` +
            `├ 🪙 Magnum Coins: ${totalCoinsPerMin.toFixed(2)}/мин\n` +
            `└ ⭐ Stars: ${totalStarsPerMin.toFixed(2)}/мин\n\n` +
            `📊 **Лимиты:**\n` +
            `├ 👤 У вас: ${userMinerCount}/${minerAvailability.maxPerUser} майнеров\n` +
            `├ 🌐 Активные майнеры на сервере: ${minerAvailability.activeCount}/${minerAvailability.globalLimit}\n` +
            `└ 🆕 Можно купить еще: ${Math.max(0, minerAvailability.maxPerUser - userMinerCount)} майнеров\n\n` +
            `🎯 **Выберите действие:**`;
        
        const myMinersKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Запустить майнинг', 'start_mining')],
            [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(myMinersMessage, {
            parse_mode: 'Markdown',
            reply_markup: myMinersKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка обработки "Мои майнеры"', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки майнеров**\n\n` +
            `🚫 Не удалось загрузить данные майнеров\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'my_miners')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка вывода звезд
async function handleWithdraw(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка вывода звезд', { userId });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await dataManager.getUserBalance(userId);
        
        const withdrawMessage = `⭐ **Вывод звезд**\n\n` +
            `💰 **Ваш баланс:** ${userBalance.stars} ⭐ Stars\n\n` +
            `📋 **Условия вывода:**\n` +
            `├ 💰 Минимальная сумма: 50 ⭐ Stars\n` +
            `├ ⏰ Обработка: 24-48 часов\n` +
            `└ 💳 Способ: По заявке\n\n` +
            `💡 **Как вывести:**\n` +
            `1️⃣ Нажмите "💳 Создать заявку"\n` +
            `2️⃣ Введите сумму для вывода\n` +
            `3️⃣ Отправьте заявку\n` +
            `4️⃣ Ожидайте одобрения админа`;
        
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

// Функция обновления таймера майнинга
async function updateMiningTimer(ctx, userId, startTime) {
    try {
        // Рассчитываем время до следующего запуска (4 часа = 14400000 мс)
        const cooldownTime = 4 * 60 * 60 * 1000; // 4 часа в миллисекундах
        const nextMiningTime = new Date(startTime).getTime() + cooldownTime;
        const now = Date.now();
        
        if (now >= nextMiningTime) {
            // Время истекло, показываем кнопку "Запустить майнинг"
            await showMiningReady(ctx, userId);
        } else {
            // Показываем время следующего запуска (без обновления каждую секунду)
            await showMiningTimer(ctx, userId, nextMiningTime);
        }
        
    } catch (error) {
        logger.error('Ошибка обновления таймера майнинга', error, { userId });
    }
}

// Показать готовность к майнингу
async function showMiningReady(ctx, userId) {
    try {
        const userMiners = await dataManager.getUserMiners(userId);
        
        let totalCoinsPerMin = 0;
        let totalStarsPerMin = 0;
        
        userMiners.forEach(miner => {
            if (miner.isActive) {
                totalCoinsPerMin += miner.speed.coins;
                totalStarsPerMin += miner.speed.stars;
            }
        });
        
        const myMinersMessage = `📊 **Мои майнеры**\n\n` +
            `⛏️ **Всего майнеров:** ${userMiners.length}\n\n` +
            `💰 **Общий доход:**\n` +
            `├ 🪙 Magnum Coins: ${totalCoinsPerMin.toFixed(2)}/мин\n` +
            `└ ⭐ Stars: ${totalStarsPerMin.toFixed(2)}/мин\n\n` +
            `🎯 **Выберите действие:**`;
        
        const myMinersKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Запустить майнинг', 'start_mining')],
            [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(myMinersMessage, {
            parse_mode: 'Markdown',
            reply_markup: myMinersKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа готовности к майнингу', error, { userId });
    }
}

// Показать информацию о майнинге в процессе
async function showMiningInProgress(ctx, userId, startTime) {
    try {
        const userMiners = await dataManager.getUserMiners(userId);
        
        let totalCoinsPerMin = 0;
        let totalStarsPerMin = 0;
        
        userMiners.forEach(miner => {
            if (miner.isActive) {
                totalCoinsPerMin += miner.speed.coins;
                totalStarsPerMin += miner.speed.stars;
            }
        });
        
        // Рассчитываем время следующего запуска (4 часа = 14400000 мс)
        const cooldownTime = 4 * 60 * 60 * 1000; // 4 часа в миллисекундах
        const nextMiningTime = new Date(startTime).getTime() + cooldownTime;
        
        // Форматируем время следующего запуска
        const nextMiningDate = new Date(nextMiningTime);
        const nextMiningTimeString = nextMiningDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const myMinersMessage = `📊 **Мои майнеры**\n\n` +
            `⛏️ **Всего майнеров:** ${userMiners.length}\n\n` +
            `💰 **Общий доход:**\n` +
            `├ 🪙 Magnum Coins: ${totalCoinsPerMin.toFixed(2)}/мин\n` +
            `└ ⭐ Stars: ${totalStarsPerMin.toFixed(2)}/мин\n\n` +
            `⏰ **Майнинг в процессе...**\n` +
            `🔄 **Следующий запуск в:** ${nextMiningTimeString}\n\n` +
            `💡 Доход начисляется автоматически каждую минуту!`;
        
        const myMinersKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`⏰ Майнинг в процессе (${nextMiningTimeString})`, 'mining_active')],
            [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(myMinersMessage, {
            parse_mode: 'Markdown',
            reply_markup: myMinersKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа информации о майнинге в процессе', error, { userId });
    }
}

// Показать время следующего запуска майнинга
async function showMiningTimer(ctx, userId, nextMiningTime) {
    try {
        const userMiners = await dataManager.getUserMiners(userId);
        
        let totalCoinsPerMin = 0;
        let totalStarsPerMin = 0;
        
        userMiners.forEach(miner => {
            if (miner.isActive) {
                totalCoinsPerMin += miner.speed.coins;
                totalStarsPerMin += miner.speed.stars;
            }
        });
        
        // Форматируем время следующего запуска
        const nextMiningDate = new Date(nextMiningTime);
        const nextMiningTimeString = nextMiningDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const myMinersMessage = `📊 **Мои майнеры**\n\n` +
            `⛏️ **Всего майнеров:** ${userMiners.length}\n\n` +
            `💰 **Общий доход:**\n` +
            `├ 🪙 Magnum Coins: ${totalCoinsPerMin.toFixed(2)}/мин\n` +
            `└ ⭐ Stars: ${totalStarsPerMin.toFixed(2)}/мин\n\n` +
            `⏰ **Майнинг активен**\n` +
            `🔄 **Следующий запуск в:** ${nextMiningTimeString}\n\n` +
            `💡 Доход начисляется автоматически каждую минуту!`;
        
        const myMinersKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`⏰ Майнинг активен (${nextMiningTimeString})`, 'mining_active')],
            [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')],
            [Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]);
        
        await ctx.editMessageText(myMinersMessage, {
            parse_mode: 'Markdown',
            reply_markup: myMinersKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка показа таймера майнинга', error, { userId });
    }
}

// Обработка покупки майнера
async function handleBuyMiner(ctx, minerType) {
    const userId = ctx.from.id;
    
    logger.info('Обработка покупки майнера', { userId, minerType });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Получаем информацию о майнере
        const minerInfo = dataManager.getMinerInfo(minerType);
        
        if (!minerInfo) {
            await ctx.reply('❌ Майнер не найден');
            return;
        }
        
        // Проверяем, хватает ли средств
        const canAfford = (userBalance.coins >= minerInfo.price.coins) && 
                         (userBalance.stars >= minerInfo.price.stars);
        
        if (!canAfford) {
            const insufficientFundsMessage = `❌ **Недостаточно средств**\n\n` +
                `💰 **Цена майнера:**\n` +
                `├ 🪙 Magnum Coins: ${minerInfo.price.coins}\n` +
                `└ ⭐ Stars: ${minerInfo.price.stars}\n\n` +
                `💳 **Ваш баланс:**\n` +
                `├ 🪙 Magnum Coins: ${userBalance.coins}\n` +
                `└ ⭐ Stars: ${userBalance.stars}\n\n` +
                `💡 Пополните баланс или выберите другой майнер`;
            
            const insufficientFundsKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🛒 Магазин майнеров', 'miners_shop')],
                [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
            ]);
            
            await ctx.editMessageText(insufficientFundsMessage, {
                parse_mode: 'Markdown',
                reply_markup: insufficientFundsKeyboard.reply_markup
            });
            return;
        }
        
        // Выполняем реальную покупку майнера
        const purchasedMiner = await dataManager.buyMiner(userId, minerType);
        
        const successMessage = `✅ **Майнер успешно куплен!**\n\n` +
            `⛏️ **${minerInfo.name}**\n` +
            `├ 🆔 ID: ${purchasedMiner.id}\n` +
            `├ 💰 Цена: ${minerInfo.price.coins > 0 ? minerInfo.price.coins + ' 🪙' : minerInfo.price.stars + ' ⭐'}\n` +
            `├ ⚡ Скорость: ${minerInfo.speed.coins > 0 ? minerInfo.speed.coins + ' 🪙/мин' : minerInfo.speed.stars + ' ⭐/мин'}\n` +
            `├ 🎯 Редкость: ${minerInfo.rarity}\n` +
            `└ 📅 Дата покупки: ${new Date().toLocaleDateString('ru-RU')}\n\n` +
            `🎉 Теперь вы можете запустить майнинг и получать доход автоматически!`;
        
        const successKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Запустить майнинг', 'start_mining')],
            [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
            [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
        ]);
        
        await ctx.editMessageText(successMessage, {
            parse_mode: 'Markdown',
            reply_markup: successKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка покупки майнера', error, { userId, minerType });
        
        const errorMessage = `❌ **Ошибка покупки майнера**\n\n` +
            `🚫 Не удалось купить майнер\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'miners_shop')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}



// Обработка следующего майнера (заглушка)
async function handleNextMiner(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка следующего майнера', { userId });
    
    // Пока заглушка
    await ctx.reply('🔄 Функция "Следующий майнер" в разработке');
}

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
            `├ 🥇 1 уровень: +5 ⭐ Stars\n` +
            `├ 🥈 2 уровень: +3 ⭐ Stars\n` +
            `└ 🥉 3 уровень: +1 ⭐ Stars`;
        
        const referralsKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📊 Детальная статистика', 'referral_stats')],
            [Markup.button.callback('🏆 Топ рефералов', 'top_referrers')],
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
        
        // Создаем основное меню
        const mainMenuButtons = [
            [Markup.button.callback('💰 Майнеры', 'miners'), Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), Markup.button.webApp('🌐 WebApp', process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com')],
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
            [Markup.button.callback('👑 Выдать/забрать титул', 'manage_titles')],
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
    
    logger.info('Обработка создания ключа титула', { userId });
    
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

// Обработка титулов
async function handleTitles(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка титулов', { userId });
    
    const titlesMessage = `👑 **Доступные титулы**\n\n` +
            `🎯 **Всего титулов:** 7\n\n` +
            `🆕 **Новичок** (Обычный)\n` +
            `├ 📝 Первый титул для новых пользователей\n` +
        `├ 🎯 Требования: Уровень 1\n` +
        `└ ✅ Статус: Разблокирован\n\n` +
            `⛏️ **Майнер** (Обычный)\n` +
            `├ 📝 Титул для активных майнеров\n` +
            `├ 🎯 Требования: Уровень 5, 100 ⭐, 500 🪙\n` +
            `└ 🔒 Статус: Заблокирован\n\n` +
            `💼 **Трейдер** (Редкий)\n` +
            `├ 📝 Титул для опытных трейдеров\n` +
            `├ 🎯 Требования: Уровень 10, 500 ⭐, 1000 🪙\n` +
            `└ 🔒 Статус: Заблокирован\n\n` +
            `💰 **Инвестор** (Эпический)\n` +
            `├ 📝 Титул для крупных инвесторов\n` +
            `├ 🎯 Требования: Уровень 20, 1000 ⭐, 5000 🪙\n` +
            `└ 🔒 Статус: Заблокирован\n\n` +
            `🎭 **Мастер** (Легендарный)\n` +
            `├ 📝 Титул для мастеров своего дела\n` +
            `├ 🎯 Требования: Уровень 30, 2500 ⭐, 10000 🪙\n` +
            `└ 🔒 Статус: Заблокирован\n\n` +
            `🌟 **Легенда** (Мифический)\n` +
            `├ 📝 Титул для легендарных игроков\n` +
            `├ 🎯 Требования: Уровень 50, 5000 ⭐, 25000 🪙\n` +
            `└ 🔒 Статус: Заблокирован\n\n` +
            `👑 **Владелец** (Эксклюзивный)\n` +
            `├ 📝 Эксклюзивный титул владельца бота\n` +
            `├ 🎯 Требования: Уровень 100, 10000 ⭐, 50000 🪙\n` +
        `└ 🔒 Статус: Заблокирован`;
    
    const titlesKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Мои титулы', 'my_titles')],
        [Markup.button.callback('👤 Профиль', 'profile')],
        [Markup.button.callback('🏠 Главное меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(titlesMessage, {
        parse_mode: 'Markdown',
        reply_markup: titlesKeyboard.reply_markup
    });
}

// Обработка моих титулов
async function handleMyTitles(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка моих титулов', { userId });
    
    const myTitlesMessage = `👑 **Мои титулы**\n\n` +
        `🎯 Текущий активный титул:\n\n` +
        `🆕 **Новичок**\n` +
        `├ 📝 Описание: Первый титул для новых пользователей\n` +
        `├ 🎯 Требования: Уровень 1\n` +
        `└ ✅ Статус: Активен\n\n` +
        `📊 **Статистика титулов:**\n` +
        `├ 🎯 Всего титулов: 1\n` +
        `├ ✅ Разблокировано: 1\n` +
        `└ 🔒 Заблокировано: 1`;
    
    const myTitlesKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👑 Доступные титулы', 'titles')],
        [Markup.button.callback('👤 Профиль', 'profile')],
        [Markup.button.callback('🏠 Главное меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(myTitlesMessage, {
        parse_mode: 'Markdown',
        reply_markup: myTitlesKeyboard.reply_markup
    });
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
                [Markup.button.callback('💰 Майнеры', 'miners')],
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
    
    logger.info('Попытка одобрения заявки на вывод', { userId, requestId });
    
    try {
        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для одобрения заявок');
            return;
        }
        
        // Обрабатываем заявку
        const result = await dataManager.processWithdrawalRequest(requestId, 'approve', userId, 'Одобрено администратором');
        
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
                `✅ **Одобрено:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n` +
                `👨‍💼 **Админ:** ${ctx.from.first_name || 'Не указано'}\n` +
                `💬 **Комментарий:** ${result.request.comment}`;
            
            // Обновляем сообщение в канале
            await ctx.editMessageText(updatedMessage, { parse_mode: 'Markdown' });
            
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
            
        } else {
            await ctx.answerCbQuery(`❌ ${result.message}`);
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
    
    logger.info('Попытка отклонения заявки на вывод', { userId, requestId });
    
    try {
        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для отклонения заявок');
            return;
        }
        
        // Обрабатываем заявку
        const result = await dataManager.processWithdrawalRequest(requestId, 'reject', userId, 'Отклонено администратором');
        
        if (result.success) {
            // Обновляем сообщение в канале
            const updatedMessage = `📋 **Заявка на вывод ОТКЛОНЕНА** ❌\n\n` +
                `👤 **Пользователь:**\n` +
                `├ 🆔 ID: \`${result.request.userId}\`\n` +
                `├ 👤 Имя: ${result.request.firstName}\n` +
                `└ 🏷️ Username: ${result.request.username}\n\n` +
                `💰 **Детали заявки:**\n` +
                `├ 🆔 ID заявки: \`${result.request.id}\`\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `├ 📅 Дата: ${new Date(result.request.createdAt).toLocaleDateString('ru-RU')}\n` +
                `└ ⏰ Время: ${new Date(result.request.createdAt).toLocaleTimeString('ru-RU')}\n\n` +
                `❌ **Отклонено:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n` +
                `👨‍💼 **Админ:** ${ctx.from.first_name || 'Не указано'}\n` +
                `💬 **Комментарий:** ${result.request.comment}\n\n` +
                `💰 **Звезды возвращены пользователю**`;
            
            // Обновляем сообщение в канале
            await ctx.editMessageText(updatedMessage, { parse_mode: 'Markdown' });
            
            // Уведомляем пользователя
            await ctx.telegram.sendMessage(result.request.userId, 
                `❌ **Ваша заявка на вывод отклонена**\n\n` +
                `📋 **Детали заявки:**\n` +
                `├ 🆔 ID: \`${result.request.id}\`\n` +
                `├ 💰 Сумма: ${result.request.amount} ⭐ Stars\n` +
                `└ ❌ Статус: Отклонена\n\n` +
                `⏰ **Время отклонения:** ${new Date(result.request.processedAt).toLocaleDateString('ru-RU')} ${new Date(result.request.processedAt).toLocaleTimeString('ru-RU')}\n` +
                `💬 **Комментарий:** ${result.request.comment}\n\n` +
                `💰 **Звезды возвращены на ваш баланс**\n\n` +
                `💡 **Что дальше:** Вы можете создать новую заявку на вывод`
            );
            
            logger.info('Заявка на вывод отклонена', { userId, requestId, adminId: userId });
            
        } else {
            await ctx.answerCbQuery(`❌ ${result.message}`);
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
            
            // Создаем основное меню
            const mainMenuButtons = [
                [Markup.button.callback('💰 Майнеры', 'miners'), Markup.button.callback('👤 Профиль', 'profile')],
                [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), Markup.button.webApp('🌐 WebApp', process.env.WEBAPP_URL || 'https://magnumstarbot.onrender.com')],
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
async function handleManageTitles(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка управления титулами', { userId });
    
    try {
        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для управления титулами');
            return;
        }
        
        const manageTitlesMessage = `👑 **Управление титулами**\n\n` +
            `🎯 **Доступные действия:**\n` +
            `├ 👑 Выдать титул пользователю\n` +
            `├ ❌ Забрать титул у пользователя\n` +
            `└ 📊 Просмотр титулов пользователя\n\n` +
            `💡 **Выберите действие:**`;
        
        const manageTitlesKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('👑 Выдать титул', 'grant_title')],
            [Markup.button.callback('❌ Забрать титул', 'revoke_title')],
            [Markup.button.callback('📊 Просмотр титулов', 'view_user_titles')],
            [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
        ]);
        
        await ctx.editMessageText(manageTitlesMessage, {
            parse_mode: 'Markdown',
            reply_markup: manageTitlesKeyboard.reply_markup
        });
        
    } catch (error) {
        logger.error('Ошибка управления титулами', error, { userId });
        
        const errorMessage = `❌ **Ошибка загрузки управления титулами**\n\n` +
            `🚫 Не удалось загрузить интерфейс управления\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'manage_titles')],
            [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка проверки пропущенных наград за майнинг
async function handleCheckMissedRewards(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка проверки пропущенных наград', { userId });
    
    try {
        // Проверяем, является ли пользователь админом
        if (!isAdmin(userId)) {
            await ctx.answerCbQuery('❌ У вас нет прав для проверки пропущенных наград');
            return;
        }
        
        // Показываем сообщение о начале проверки
        const startMessage = `⛏️ **Проверка пропущенных наград за майнинг**\n\n` +
            `🔄 Начинаем проверку всех пользователей...\n` +
            `⏳ Это может занять некоторое время\n\n` +
            `💡 Проверяются награды за последние 4 часа майнинга`;
        
        await ctx.editMessageText(startMessage, {
            parse_mode: 'Markdown'
        });
        
        // Запускаем проверку пропущенных наград
        const result = await dataManager.processAllMissedMiningRewards();
        
        if (result.success) {
            const successMessage = `✅ **Проверка пропущенных наград завершена!**\n\n` +
                `📊 **Результаты:**\n` +
                `├ 👥 Пользователей обработано: ${result.totalUsersProcessed}\n` +
                `├ 🪙 Magnum Coins начислено: ${result.totalCoinsAwarded}\n` +
                `├ ⭐ Stars начислено: ${result.totalStarsAwarded}\n` +
                `└ ⏰ Минут обработано: ${result.totalMinutesProcessed}\n\n` +
                `🎉 Все пропущенные награды успешно начислены!`;
            
            const successKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Админ панель', 'admin_panel')],
                [Markup.button.callback('🏠 Главное меню', 'main_menu')]
            ]);
            
            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: successKeyboard.reply_markup
            });
            
            logger.info('Проверка пропущенных наград завершена успешно', { userId, result });
            
        } else {
            const errorMessage = `❌ **Ошибка проверки пропущенных наград**\n\n` +
                `🚫 Не удалось выполнить проверку\n` +
                `🔍 Ошибка: ${result.error}\n\n` +
                `💡 Попробуйте позже или обратитесь к администратору`;
            
            const errorKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Попробовать снова', 'check_missed_rewards')],
                [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
            ]);
            
            await ctx.editMessageText(errorMessage, {
                parse_mode: 'Markdown',
                reply_markup: errorKeyboard.reply_markup
            });
            
            logger.error('Ошибка проверки пропущенных наград', { userId, error: result.error });
        }
        
    } catch (error) {
        logger.error('Ошибка обработки проверки пропущенных наград', error, { userId });
        
        const errorMessage = `❌ **Ошибка проверки пропущенных наград**\n\n` +
            `🚫 Не удалось выполнить проверку\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'check_missed_rewards')],
            [Markup.button.callback('🔙 Админ панель', 'admin_panel')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
    }
}

// Обработка создания ключа майнера
async function handleCreateMinerKey(ctx) {
    const userId = ctx.from.id;

    logger.info('Обработка создания ключа майнера', { userId });

    // Проверяем, является ли пользователь админом
    if (!isAdmin(userId)) {
        await ctx.reply('❌ У вас нет доступа к этой функции');
        return;
    }

    const createMinerKeyMessage = `⛏️ **Создание ключа майнера**\n\n` +
        `🎯 Выберите тип майнера для ключа:\n\n` +
        `⛏️ **Новичок**\n` +
        `├ 💰 Цена: 100 🪙 Magnum Coins\n` +
        `├ ⚡ Доход: 1 🪙/мин\n` +
        `└ 🎯 Редкость: Обычный\n\n` +
        `⭐ **Путь к звездам**\n` +
        `├ 💰 Цена: 100 ⭐ Stars\n` +
        `├ ⚡ Доход: 0.01 ⭐/мин\n` +
        `└ 🎯 Редкость: Редкий\n\n` +
        `💡 **Выберите тип майнера:**`;

    const createMinerKeyKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⛏️ Новичок (100 🪙)', 'miner_key_novice')],
        [Markup.button.callback('⭐ Путь к звездам (100 ⭐)', 'miner_key_star_path')],
        [Markup.button.callback('🔙 Отмена', 'admin_panel')]
    ]);

    await ctx.editMessageText(createMinerKeyMessage, {
        parse_mode: 'Markdown',
        reply_markup: createMinerKeyKeyboard.reply_markup
    });
}

// Обработка выбора типа майнера для ключа
async function handleMinerKeyType(ctx, minerType) {
    const userId = ctx.from.id;

    logger.info('Выбор типа майнера для ключа', { userId, minerType });

    // Проверяем, является ли пользователь админом
    if (!isAdmin(userId)) {
        await ctx.reply('❌ У вас нет доступа к этой функции');
        return;
    }

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

    const minerName = minerType === 'novice' ? 'Новичок' : 'Путь к звездам';
    const priceSymbol = minerType === 'novice' ? '🪙' : '⭐';
    const rewardSymbol = minerType === 'novice' ? '🪙' : '⭐';

    const message = `⛏️ **Создание ключа майнера**\n\n` +
        `🎯 Тип майнера: ${minerName}\n` +
        `💰 Цена майнера: 100 ${priceSymbol}\n` +
        `⚡ Доход: ${minerType === 'novice' ? '1' : '0.01'} ${rewardSymbol}/мин\n\n` +
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

    logger.info('Обработка создания ключа майнера из текста', { userId, text });

    const userState = userStates.get(userId);
    if (!userState || userState.state !== 'creating_miner_key') return;

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
                    const minerName = userState.data.minerType === 'novice' ? 'Новичок' : 'Путь к звездам';
                    const priceSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';
                    const rewardSymbol = userState.data.minerType === 'novice' ? '🪙' : '⭐';

                    const successMessage = `✅ **Ключ майнера успешно создан!**\n\n` +
                        `🔑 Ключ: \`${key}\`\n` +
                        `⛏️ Майнер: ${minerName}\n` +
                        `💰 Цена: 100 ${priceSymbol}\n` +
                        `⚡ Доход: ${userState.data.minerType === 'novice' ? '1' : '0.01'} ${rewardSymbol}/мин\n` +
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

module.exports = {
    callbackHandler,
    handleKeyCreation,
    handleTitleKeyCreation,
    handleMinerKeyCreation,
    userStates
};
