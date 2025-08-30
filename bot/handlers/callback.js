const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');
const { getUserBalance } = require('../utils/currency');
const { getReferralStats } = require('../utils/referral');
const { isAdmin } = require('../utils/admin');

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
            case 'profile':
                await handleProfile(ctx);
                break;
                
            case 'miners':
                await handleMiners(ctx);
                break;
                
            case 'withdraw':
                await handleWithdraw(ctx);
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

// Обработка майнеров
async function handleMiners(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка майнеров', { userId });
    
    const minersMessage = `⛏️ **Магазин майнеров**\n\n` +
        `💰 Выберите майнер для покупки:\n\n` +
        `🆕 **Новичок**\n` +
        `├ 💰 Цена: 100 🪙 Magnum Coins\n` +
        `├ ⚡ Скорость: 0.25 🪙/мин\n` +
        `├ 🎯 Редкость: Обычный\n` +
        `└ 📦 Доступно: 100 шт\n\n` +
        `⭐ **Путь к звездам**\n` +
        `├ 💰 Цена: 100 ⭐ Stars\n` +
        `├ ⚡ Скорость: 0.01 ⭐/мин\n` +
        `├ 🎯 Редкость: Редкий\n` +
        `└ 📦 Доступно: 100 шт`;
    
    const minersKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🆕 Купить Новичок', 'buy_miner_novice')],
        [Markup.button.callback('⭐ Купить Путь к звездам', 'buy_miner_star_path')],
        [Markup.button.callback('🏠 Главное меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(minersMessage, {
        parse_mode: 'Markdown',
        reply_markup: minersKeyboard.reply_markup
    });
}

// Обработка вывода звезд
async function handleWithdraw(ctx) {
    const userId = ctx.from.id;
    
    logger.info('Обработка вывода звезд', { userId });
    
    try {
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        const withdrawMessage = `⭐ **Вывод звезд**\n\n` +
            `💰 Ваш баланс: ${userBalance.stars} ⭐ Stars\n\n` +
            `💳 Для вывода звезд обратитесь к администратору\n` +
            `📧 Email: admin@magnumstar.com\n` +
            `💬 Telegram: @admin`;
        
        const withdrawKeyboard = Markup.inlineKeyboard([
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
        
        const referralsMessage = `👥 **Реферальная система**\n\n` +
            `🔗 Ваша реферальная ссылка:\n` +
            `\`https://t.me/MagnumStarBot?start=${userId}\`\n\n` +
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
        // Получаем баланс пользователя
        const userBalance = await getUserBalance(userId);
        
        // Получаем реферальную статистику
        const referralStats = await getReferralStats(userId);
        
        // Получаем статистику бота
        const dataManager = require('../utils/dataManager');
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
            `👥 **Реферальная программа**\n` +
            `├ 👥 Друзей приглашено: ${referralStats.totalReferrals}\n` +
            `└ 💰 Доход: ${referralStats.totalEarned.stars} ⭐\n\n` +
            `📊 **Информация о боте**\n` +
            `├ 👤 Пользователей: ${botStats.totalUsers}\n` +
            `└ 💎 Всего выведено: ${botStats.totalStarsWithdrawn} ⭐\n\n` +
            `🎯 Выберите действие и двигайтесь дальше 🚀`;
        
        const mainMenuKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💰 Майнеры', 'miners')],
            [Markup.button.callback('👤 Профиль', 'profile')],
            [Markup.button.callback('⭐ Вывести звезды', 'withdraw')],
            [Markup.button.callback('🔑 Активировать ключ', 'activate_key')],
            [Markup.button.webApp('🌐 WebApp', 'https://magnumstarbot.onrender.com')],
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
        const dataManager = require('../utils/dataManager');
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
    handleTitleKeyCreation
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