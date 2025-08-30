const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { getUserBalance } = require('../utils/currency');
const { getReferralStats } = require('../utils/referral');
const { isAdmin } = require('../utils/admin');
const dataManager = require('../utils/dataManager');

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
                
            case 'buy_miner':
                await handleBuyMiner(ctx);
                break;
                
            case 'next_miner':
                await handleNextMiner(ctx);
                break;
                
            case 'buy_miner_novice':
                await handleBuyMiner(ctx, 'novice');
                break;
                
            case 'buy_miner_star_path':
                await handleBuyMiner(ctx, 'star_path');
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
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')],
                [Markup.button.callback('🔄 Попробовать снова', 'start')]
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
        
        const minersMessage = `⛏️ **Главное меню майнеров**\n\n` +
            `💰 **Ваш баланс:**\n` +
            `├ 🪙 Magnum Coins: ${userBalance.coins}\n` +
            `└ ⭐ Stars: ${userBalance.stars}\n\n` +
            `⛏️ **Ваши майнеры:**\n` +
            `├ 📊 Всего майнеров: ${userMiners.length}\n` +
            `├ ⚡ Общий доход: ${totalIncome.coins} 🪙/мин\n` +
            `└ 💎 Доход в Stars: ${totalIncome.stars} ⭐/мин\n\n` +
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
                speed: { coins: 0.25, stars: 0 },
                rarity: 'Обычный',
                description: 'Первый майнер для начинающих'
            },
            {
                id: 'star_path',
                name: 'Путь к звездам',
                price: { coins: 0, stars: 100 },
                speed: { coins: 0, stars: 0.01 },
                rarity: 'Редкий',
                description: 'Майнер для добычи Stars'
            }
        ];
        
        // Проверяем, что индекс в допустимых пределах
        if (currentMinerIndex >= availableMiners.length) {
            currentMinerIndex = 0;
        }
        
        const currentMiner = availableMiners[currentMinerIndex];
        const isLastMiner = currentMinerIndex === availableMiners.length - 1;
        
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
            `⛏️ **Майнер ${currentMinerIndex + 1} из ${availableMiners.length}**\n\n` +
            `🎯 **${currentMiner.name}**\n` +
            `├ 💰 Цена: ${priceText}\n` +
            `├ ⚡ Скорость: ${speedText}\n` +
            `├ 🎯 Редкость: ${currentMiner.rarity}\n` +
            `├ 📝 Описание: ${currentMiner.description}\n` +
            `└ 📦 Доступно: 100 шт\n\n` +
            `🎯 **Выберите действие:**`;
        
        // Создаем клавиатуру с кнопками
        const shopKeyboard = [];
        
        // Кнопка покупки
        shopKeyboard.push([Markup.button.callback(
            `🛒 Купить ${currentMiner.name}`, 
            `buy_miner_${currentMiner.id}`
        )]);
        
        // Кнопка следующего майнера (если не последний)
        if (!isLastMiner) {
            shopKeyboard.push([Markup.button.callback(
                '⏭️ Следующий майнер', 
                `next_miner_shop_${currentMinerIndex + 1}`
            )]);
        } else {
            // Если последний майнер, показываем кнопку "Первый майнер"
            shopKeyboard.push([Markup.button.callback(
                '⏮️ Первый майнер', 
                'next_miner_shop_0'
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
            const noMinersMessage = `⛏️ **Запуск майнинга**\n\n` +
                `❌ У вас нет майнеров для запуска майнинга\n\n` +
                `💡 Купите майнер в магазине, чтобы начать зарабатывать!`;
            
            const noMinersKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('🛒 Магазин майнеров', 'miners_shop')],
                [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
            ]);
            
            await ctx.editMessageText(noMinersMessage, {
                parse_mode: 'Markdown',
                reply_markup: noMinersKeyboard.reply_markup
            });
            return;
        }
        
        // Запускаем майнинг
        const miningResult = await dataManager.startMining(userId);
        
        if (miningResult.success) {
            const successMessage = `🚀 **Майнинг запущен!**\n\n` +
                `⛏️ **Статус:** Майнинг активен\n` +
                `💰 **Доход:** Начисляется каждую минуту автоматически\n` +
                `⏰ **Время запуска:** ${new Date(miningResult.startTime).toLocaleTimeString('ru-RU')}\n` +
                `🔄 **Следующий запуск:** Через 4 часа\n\n` +
                `💡 Теперь ваши майнеры работают и приносят доход!`;
            
            const successKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
                [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
                [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
            ]);
            
            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: successKeyboard.reply_markup
            });
        } else {
            const errorMessage = `⏰ **Майнинг не запущен**\n\n` +
                `❌ ${miningResult.message}\n\n` +
                `💡 Майнинг можно запускать раз в 4 часа`;
            
            const errorKeyboard = Markup.inlineKeyboard([
                [Markup.button.callback('📊 Мои майнеры', 'my_miners')],
                [Markup.button.callback('🛒 Купить еще майнер', 'miners_shop')],
                [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
            ]);
            
            await ctx.editMessageText(errorMessage, {
                parse_mode: 'Markdown',
                reply_markup: errorKeyboard.reply_markup
            });
        }
        
    } catch (error) {
        logger.error('Ошибка запуска майнинга', error, { userId });
        
        const errorMessage = `❌ **Ошибка запуска майнинга**\n\n` +
            `🚫 Не удалось запустить майнинг\n` +
            `🔧 Попробуйте позже или обратитесь к администратору`;
        
        const errorKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'start_mining')],
            [Markup.button.callback('🔙 Назад к майнерам', 'miners')]
        ]);
        
        await ctx.editMessageText(errorMessage, {
            parse_mode: 'Markdown',
            reply_markup: errorKeyboard.reply_markup
        });
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
        `💡 Ключ должен содержать буквы и цифры\n` +
        `❌ Не используйте пробелы в начале и конце`;
    
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
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')],
                [Markup.button.callback('🔄 Попробовать снова', 'start')]
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
        
        const mainMenuKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💰 Майнеры', 'miners'), Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), Markup.button.webApp('🌐 WebApp', 'https://magnumstarbot.onrender.com')],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
            [Markup.button.callback('⚙️ Админ панель', 'admin_panel')]
        ]);
        
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
            [Markup.button.callback('👑 Создать ключ титула', 'create_title_key')],
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
        `🎯 Выберите титул для просмотра:\n\n` +
        `🆕 **Новичок**\n` +
        `├ 📝 Описание: Первый титул для новых пользователей\n` +
        `├ 🎯 Требования: Уровень 1\n` +
        `└ ✅ Статус: Разблокирован\n\n` +
        `👑 **Владелец**\n` +
        `├ 📝 Описание: Титул для владельцев бота\n` +
        `├ 🎯 Требования: Уровень 10\n` +
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
            
            // Создаем ключ
            const { generateKey } = require('../utils/keys');
            const key = generateKey();
            
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
        const user = await dataManager.getUser(userId);
        if (!user.isAdmin) {
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
        const user = await dataManager.getUser(userId);
        if (!user.isAdmin) {
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
        const subscriptionCheck = await dataManager.checkUserSubscription(userId);
        
        if (subscriptionCheck.isSubscribed) {
            // Подписка подтверждена - показываем главное меню
            const successMessage = `✅ **Подписка подтверждена!**\n\n` +
                `🎉 Теперь вы можете использовать все функции бота!\n\n` +
                `🚀 Добро пожаловать в Magnum Stars!`;
            
            const mainMenu = Markup.inlineKeyboard([
                [Markup.button.callback('💰 Майнеры', 'miners'), Markup.button.callback('👤 Профиль', 'profile')],
                [Markup.button.callback('🔑 Активировать ключ', 'activate_key'), Markup.button.webApp('🌐 WebApp', 'https://magnumstarbot.onrender.com')],
                [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
                [Markup.button.callback('⚙️ Админ панель', 'admin_panel')]
            ]);
            
            await ctx.editMessageText(successMessage, {
                parse_mode: 'Markdown',
                reply_markup: mainMenu.reply_markup
            });
            
            logger.info('Подписка пользователя подтверждена, показано главное меню', { userId });
            
        } else {
            // Подписка не подтверждена - показываем сообщение об ошибке
            const errorMessage = `❌ **Подписка не подтверждена**\n\n` +
                `📢 Вы не подписаны на канал **@magnumtap**\n\n` +
                `📋 **Что нужно сделать:**\n` +
                `1️⃣ Нажмите кнопку "📢 Подписаться на канал"\n` +
                `2️⃣ Подпишитесь на канал @magnumtap\n` +
                `3️⃣ Вернитесь в бот и нажмите "✅ Проверить подписку"\n\n` +
                `💡 После подписки на канал вы получите доступ ко всем функциям бота!`;
            
            const subscriptionKeyboard = Markup.inlineKeyboard([
                [Markup.button.url('📢 Подписаться на канал', 'https://t.me/magnumtap')],
                [Markup.button.callback('✅ Проверить подписку', 'check_subscription')],
                [Markup.button.callback('🔄 Попробовать снова', 'start')]
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

module.exports = {
    callbackHandler,
    handleKeyCreation,
    handleTitleKeyCreation,
    userStates
};