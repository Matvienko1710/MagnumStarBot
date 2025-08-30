const { Markup } = require('telegraf');
const { inlineKeyboard, inlineKeyboardWithBack, adminPanelKeyboard, createKeyKeyboard, createTitleKeyKeyboard, minersKeyboard, buyMinerKeyboard, titlesKeyboard, changeTitleKeyboard, profileKeyboard, withdrawKeyboard, referralsKeyboard } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { getUserBalance, getUserStats, getTransactionHistory, addStars, addCoins } = require('../utils/currency');
const { isAdmin, getAdminStats, getBotStats } = require('../utils/admin');
const { activateKey, getUserKeyHistory, createKey, getKeysStats } = require('../utils/keys');
const { getUserMiners, getAvailableRewards, buyMiner, collectRewards, getMinersStats, getMinerTypes, getMinerType } = require('../utils/miners');
const { getUserCurrentTitle, getUserUnlockedTitles, setUserTitle, getUserTitlesStats, getAllTitles, getFormattedTitle, getTitleById } = require('../utils/titles');
const { getReferralStats, getLevelInfo, getNextLevel, getUserReferralCode, getUserReferrals, getTopReferrers } = require('../utils/referral');
const logger = require('../utils/logger');

// Временное хранилище состояний пользователей (в реальном проекте заменить на БД)
const userStates = new Map();

module.exports = (bot, safeAsync) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', safeAsync(async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const adminStatus = isAdmin(userId);
    
    logger.info('Callback query получен', { 
      userId, 
      callbackData, 
      adminStatus,
      username: ctx.from.username,
      firstName: ctx.from.first_name
    });
    
    switch (callbackData) {
      case 'profile':
        logger.info('Обработка callback: profile', { userId });
        await ctx.answerCbQuery();
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        
        // Получаем данные из системы валюты
        const balance = getUserBalance(userId);
        const currencyStats = getUserStats(userId);
                 const keyHistory = getUserKeyHistory(userId);
         
         const userCurrentTitle = getUserCurrentTitle(userId);
         const referralStats = getReferralStats(userId);
         const levelInfo = getLevelInfo(referralStats.level);
         const nextLevel = getNextLevel(referralStats.level);
         
         const profileMessage = `👤 Профиль пользователя:
 
       👤 Основная информация
       ├ ID: ${userId}
       ├ Имя: ${userName}
       ├ Username: ${user.username || 'Не указан'}
       ├ Титул: ${getFormattedTitle(userCurrentTitle)}
       └ Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}
 
       💎 Баланс
       ├ ⭐ Stars: ${balance.stars}
       └ 🪙 Magnum Coins: ${balance.coins}
 
       👥 Реферальная система
       ├ Реферальный код: ${referralStats.referralCode}
       ├ Рефералы: ${referralStats.totalReferrals}
       ├ Активные рефералы: ${referralStats.activeReferrals}
               ├ Заработано: ${referralStats.totalEarned.stars} ⭐
       ├ Уровень: ${levelInfo.name} (${referralStats.level})
       └ ${nextLevel ? `До следующего уровня: ${nextLevel.requirement - referralStats.totalEarned.stars} ⭐` : 'Максимальный уровень!'}
       
       📊 Статистика
       ├ Всего транзакций: ${currencyStats.totalTransactions}
       ├ Всего заработано Stars: ${currencyStats.totalEarned.stars}
       ├ Всего заработано Coins: ${currencyStats.totalEarned.coins}
       ├ Активировано ключей: ${keyHistory.length}
       └ Последний вход: Сегодня`;
        
        await ctx.editMessageText(profileMessage, profileKeyboard(adminStatus));
        break;
      
      case 'titles':
        await ctx.answerCbQuery();
        const titlesStats = getUserTitlesStats(userId);
        
        const titlesMessage = `👑 Титулы:

📊 Ваши титулы
├ Текущий титул: ${getFormattedTitle(titlesStats.currentTitle)}
├ Разблокировано: ${titlesStats.totalUnlocked}/${titlesStats.totalAvailable}
└ Всего титулов: ${titlesStats.unlockedTitles.length}

${titlesStats.unlockedTitles.length > 0 ? 
  `📋 Доступные титулы:
${titlesStats.unlockedTitles.map(title => 
  `├ ${getFormattedTitle(title)}
  │  └ ${title.description}`
).join('\n')}` : 
  '❌ У вас пока нет разблокированных титулов\n💡 Используйте ключи для получения титулов!'}`;
        
        await ctx.editMessageText(titlesMessage, titlesKeyboard());
        break;
      
      case 'change_title':
        await ctx.answerCbQuery();
        const unlockedTitles = getUserUnlockedTitles(userId);
        const currentTitle = getUserCurrentTitle(userId);
        
        if (unlockedTitles.length === 0) {
          await ctx.editMessageText(
            '❌ У вас нет разблокированных титулов!\n\n💡 Используйте ключи для получения титулов.',
            titlesKeyboard()
          );
          return;
        }
        
        const changeTitleMessage = `👑 Смена титула:

Выберите титул для установки:

${unlockedTitles.map(title => 
  `🔸 ${getFormattedTitle(title)}
  └ ${title.description}`
).join('\n\n')}`;
        
        await ctx.editMessageText(changeTitleMessage, changeTitleKeyboard(unlockedTitles, currentTitle.id));
        break;
      
      case 'my_titles':
        await ctx.answerCbQuery();
        const myTitlesStats = getUserTitlesStats(userId);
        
        const myTitlesMessage = `📊 Мои титулы:

${myTitlesStats.unlockedTitles.length > 0 ? 
  myTitlesStats.unlockedTitles.map(title => 
    `👑 ${getFormattedTitle(title)}
├ Описание: ${title.description}
├ Редкость: ${title.rarity === 'common' ? 'Обычный' : 'Редкий'}
└ ${title.id === myTitlesStats.currentTitle.id ? '✅ Активен' : '❌ Неактивен'}`
  ).join('\n\n') : 
  '❌ У вас пока нет разблокированных титулов\n💡 Используйте ключи для получения титулов!'}`;
        
        await ctx.editMessageText(myTitlesMessage, titlesKeyboard());
        break;
      
      case 'activate_key':
        logger.info('Обработка callback: activate_key', { userId });
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние ожидания ввода ключа
        const keyState = { state: 'waiting_for_key', timestamp: Date.now() };
        userStates.set(userId, keyState);
        logger.userState(userId, 'waiting_for_key', keyState);
        
        await ctx.editMessageText(
          '🔑 Активация ключа:\n\n' +
          'Введите 12-значный ключ активации:\n\n' +
          '📝 Формат: XXXXXXXXXXXX\n' +
          '💡 Пример: ABC123DEF456\n\n' +
          '❌ Для отмены напишите "отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'back')]
          ])
        );
        break;
      
      case 'admin_panel':
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        const adminStats = getAdminStats();
        const botStats = getBotStats();
        
        const adminMessage = `🔧 Админ панель:

👥 Администраторы
├ Всего админов: ${adminStats.totalAdmins}
├ ID админов: ${adminStats.adminIds.join(', ') || 'Не настроены'}
└ Ваш статус: Администратор

🤖 Информация о боте
├ Версия: ${adminStats.botInfo.version}
├ Время работы: ${Math.floor(adminStats.botInfo.uptime / 60)} мин
├ Платформа: ${adminStats.botInfo.platform}
└ Память: ${Math.round(adminStats.botInfo.memory.heapUsed / 1024 / 1024)} MB

📊 Статистика бота
├ Всего пользователей: ${botStats.totalUsers}
├ Активных пользователей: ${botStats.activeUsers}
├ Всего транзакций: ${botStats.totalTransactions}
└ Время сервера: ${new Date(botStats.serverTime).toLocaleString('ru-RU')}`;
        
        await ctx.editMessageText(adminMessage, adminPanelKeyboard());
        break;
      
      case 'create_key':
        logger.info('Обработка callback: create_key', { userId, adminStatus });
        if (!adminStatus) {
          logger.warn('Попытка доступа к create_key без прав администратора', { userId });
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние создания ключа
        const createKeyState = { 
          state: 'creating_key', 
          step: 'stars',
          data: {},
          timestamp: Date.now() 
        };
        userStates.set(userId, createKeyState);
        logger.userState(userId, 'creating_key', createKeyState);
        
        await ctx.editMessageText(
          '🔑 Создание нового ключа:\n\n' +
          'Шаг 1/4: Введите количество Stars для награды\n\n' +
          '💡 Пример: 50\n' +
          '❌ Для отмены напишите "отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'admin_panel')]
          ])
        );
        break;
      
      case 'keys_stats':
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        const keysStats = getKeysStats();
        
        const keysStatsMessage = `📊 Статистика ключей:

🔑 Общая информация
├ Всего ключей: ${keysStats.totalKeys}
├ Активных ключей: ${keysStats.activeKeys}
└ Всего активаций: ${keysStats.totalUses}

📋 Список ключей:
${keysStats.keys.map(key => 
  `├ ${key.key} (${key.isActive ? '✅' : '❌'})
  │  ├ Награда: ${key.reward.stars}⭐ ${key.reward.coins}🪙
  │  ├ Использований: ${key.currentUses}/${key.maxUses}
  │  └ Описание: ${key.description}`
).join('\n')}`;
        
        await ctx.editMessageText(keysStatsMessage, adminPanelKeyboard());
        break;
      
      case 'create_title_key':
        logger.info('Обработка callback: create_title_key', { userId, adminStatus });
        if (!adminStatus) {
          logger.warn('Попытка доступа к create_title_key без прав администратора', { userId });
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние создания ключа титула
        const createTitleKeyState = { 
          state: 'creating_title_key', 
          step: 'title',
          data: {},
          timestamp: Date.now() 
        };
        userStates.set(userId, createTitleKeyState);
        logger.userState(userId, 'creating_title_key', createTitleKeyState);
        
        const allTitles = getAllTitles();
        const titleOptions = allTitles.map(title => 
          `${title.color} ${title.name} (${title.id})`
        ).join('\n');
        
        await ctx.editMessageText(
          '👑 Создание ключа титула:\n\n' +
          'Шаг 1/4: Выберите титул для награды\n\n' +
          'Доступные титулы:\n' +
          titleOptions + '\n\n' +
          '💡 Введите ID титула (например: owner)\n' +
          '❌ Для отмены напишите "отмена"',
          createTitleKeyKeyboard()
        );
        break;
      
      // WebApp временно отключен
      // case 'webapp':
      //   if (!adminStatus) {
      //     await ctx.answerCbQuery('Доступ запрещен');
      //     return;
      //   }
      //   
      //   await ctx.answerCbQuery();
      //   await ctx.editMessageText(
      //     '🌐 WebApp - дополнительный функционал:\n\n' +
      //     '📱 Расширенный интерфейс\n' +
      //     '📊 Детальная статистика\n' +
      //     '🎮 Дополнительные задания\n' +
      //     '💬 Чат с поддержкой\n\n' +
      //     'Открываем WebApp...',
      //     inlineKeyboardWithBack(adminStatus)
      //   );
      //   break;
      
      case 'back':
        logger.info('Обработка callback: back', { userId });
        await ctx.answerCbQuery();
        // Очищаем состояние пользователя
        const previousState = userStates.get(userId);
        userStates.delete(userId);
        logger.userState(userId, 'deleted', previousState);
        // Возвращаемся к предыдущему меню (в данном случае к главному)
        const welcomeMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(welcomeMessage, inlineKeyboard(adminStatus));
        logger.info('Возврат в главное меню', { userId });
        break;
      
      case 'miners':
        await ctx.answerCbQuery();
        const minersStats = getMinersStats(userId);
        const availableRewards = getAvailableRewards(userId);
        
        const minersMessage = `⛏️ Майнеры:

📊 Общая статистика
├ Всего майнеров: ${minersStats.totalMiners}
├ Активных майнеров: ${minersStats.activeMiners}
├ Доступно наград: ${availableRewards.stars > 0 ? `${availableRewards.stars} ⭐` : ''} ${availableRewards.coins > 0 ? `${availableRewards.coins} 🪙` : ''}
└ Всего заработано: ${minersStats.totalEarned.stars} ⭐ ${minersStats.totalEarned.coins} 🪙

${minersStats.miners.length > 0 ? 
  `📋 Ваши майнеры:
${minersStats.miners.map(miner => {
  const { getRarityInfo } = require('../utils/miners');
  const rarityInfo = getRarityInfo(miner.rarity);
  const rewardSymbol = miner.rewardType === 'stars' ? '⭐' : '🪙';
  return `├ ${rarityInfo.color} ${miner.name} (${rarityInfo.name})
  │  ├ Доход/мин: ${miner.rewardPerMinute} ${rewardSymbol}
  │  ├ Заработано: ${miner.totalEarned}/${miner.maxReward} ${rewardSymbol}
  │  └ Осталось: ${miner.remainingReward} ${rewardSymbol}`;
}).join('\n')}` : 
  '❌ У вас пока нет майнеров\n💡 Купите свой первый майнер!'}`;
        
        await ctx.editMessageText(minersMessage, minersKeyboard());
        break;
      
      case 'buy_miner':
        await ctx.answerCbQuery();
        const { getMinerByPage } = require('../utils/miners');
        const firstMiner = getMinerByPage(1);
        
        const buyMinerMessage = `⛏️ Покупка майнера:

${firstMiner.rarityInfo.color} **${firstMiner.name}** (${firstMiner.rarityInfo.name})

💰 **Цена:** ${firstMiner.price} ${firstMiner.priceSymbol}
⚡ **Доход/мин:** ${firstMiner.rewardPerMinute} ${firstMiner.rewardSymbol}
📈 **Максимум:** ${firstMiner.maxReward} ${firstMiner.rewardSymbol}
🎯 **Доступно на сервере:** ${firstMiner.availableOnServer} шт
📝 **${firstMiner.description}**

💡 Используйте кнопки навигации для просмотра всех майнеров!`;
        
        await ctx.editMessageText(buyMinerMessage, buyMinerKeyboard(1));
        break;
      
      // Обработка постраничной навигации майнеров
      case (() => {
        const match = callbackData.match(/^miner_page_(\d+)$/);
        return match ? match[1] : null;
      })():
        if (callbackData.startsWith('miner_page_')) {
          await ctx.answerCbQuery();
          const page = parseInt(callbackData.replace('miner_page_', ''));
          const { getMinerByPage } = require('../utils/miners');
          const miner = getMinerByPage(page);
          
          if (!miner) {
            await ctx.editMessageText(
              '❌ Страница не найдена!',
              buyMinerKeyboard(1)
            );
            return;
          }
          
          const minerMessage = `⛏️ Покупка майнера:

${miner.rarityInfo.color} **${miner.name}** (${miner.rarityInfo.name})

💰 **Цена:** ${miner.price} ${miner.priceSymbol}
⚡ **Доход/мин:** ${miner.rewardPerMinute} ${miner.rewardSymbol}
📈 **Максимум:** ${miner.maxReward} ${miner.rewardSymbol}
🎯 **Доступно на сервере:** ${miner.availableOnServer} шт
📝 **${miner.description}**

💡 Используйте кнопки навигации для просмотра всех майнеров!`;
          
          await ctx.editMessageText(minerMessage, buyMinerKeyboard(page));
        }
        break;
      
      case 'miner_info':
        await ctx.answerCbQuery();
        const { getMinerTypes } = require('../utils/miners');
        const allMinerTypes = getMinerTypes();
        
        const infoMessage = `📋 **Все доступные майнеры:**

${allMinerTypes.map((type, index) => {
  const { getRarityInfo } = require('../utils/miners');
  const rarityInfo = getRarityInfo(type.rarity);
  const priceSymbol = type.priceType === 'stars' ? '⭐' : '🪙';
  const rewardSymbol = type.rewardType === 'stars' ? '⭐' : '🪙';
  return `${index + 1}. ${rarityInfo.color} **${type.name}** (${rarityInfo.name})
   ├ 💰 Цена: ${type.price} ${priceSymbol}
   ├ ⚡ Доход/мин: ${type.rewardPerMinute} ${rewardSymbol}
   ├ 📈 Максимум: ${type.maxReward} ${rewardSymbol}
   ├ 🎯 Доступно: ${type.availableOnServer} шт
   └ 📝 ${type.description}`;
}).join('\n\n')}

💡 Используйте кнопки навигации для просмотра каждого майнера отдельно!`;
        
        await ctx.editMessageText(infoMessage, buyMinerKeyboard(1));
        break;
      
      case 'buy_novice_miner':
        await ctx.answerCbQuery();
        try {
          const result = buyMiner(userId, 'NOVICE');
          const { getRarityInfo } = require('../utils/miners');
          const rarityInfo = getRarityInfo(result.miner.rarity);
          const priceSymbol = result.priceType === 'stars' ? '⭐' : '🪙';
          
          await ctx.editMessageText(
            `✅ Майнер успешно куплен!

⛏️ ${rarityInfo.color} ${result.miner.name} (${rarityInfo.name})
💰 Стоимость: ${result.price} ${priceSymbol}
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐ ${result.newBalance.coins} 🪙`,
            minersKeyboard()
          );
        } catch (error) {
          await ctx.editMessageText(
            `❌ Ошибка покупки майнера!

🔍 Причина: ${error.message}`,
            minersKeyboard()
          );
        }
        break;
      
      case 'buy_star_path_miner':
        await ctx.answerCbQuery();
        try {
          const result = buyMiner(userId, 'STAR_PATH');
          const { getRarityInfo } = require('../utils/miners');
          const rarityInfo = getRarityInfo(result.miner.rarity);
          const priceSymbol = result.priceType === 'stars' ? '⭐' : '🪙';
          
          await ctx.editMessageText(
            `✅ Майнер успешно куплен!

⛏️ ${rarityInfo.color} ${result.miner.name} (${rarityInfo.name})
💰 Стоимость: ${result.price} ${priceSymbol}
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐ ${result.newBalance.coins} 🪙`,
            minersKeyboard()
          );
        } catch (error) {
          await ctx.editMessageText(
            `❌ Ошибка покупки майнера!

🔍 Причина: ${error.message}`,
            minersKeyboard()
          );
        }
        break;
      
            case 'my_miners':
        await ctx.answerCbQuery();
        const myMinersStats = getMinersStats(userId);
        
        const myMinersMessage = `📊 Мои майнеры:

${myMinersStats.miners.length > 0 ? 
  myMinersStats.miners.map(miner => {
    const { getRarityInfo } = require('../utils/miners');
    const rarityInfo = getRarityInfo(miner.rarity);
    const rewardSymbol = miner.rewardType === 'stars' ? '⭐' : '🪙';
    return `⛏️ ${rarityInfo.color} ${miner.name} (${rarityInfo.name})
 ├ 🆔 ID: ${miner.id}
 ├ 📅 Куплен: ${new Date(miner.purchaseDate).toLocaleDateString('ru-RU')}
 ├ ⚡ Доход/мин: ${miner.rewardPerMinute} ${rewardSymbol}
 ├ 💰 Заработано: ${miner.totalEarned}/${miner.maxReward} ${rewardSymbol}
 ├ 📈 Осталось: ${miner.remainingReward} ${rewardSymbol}
 └ ${miner.isActive ? '✅ Активен' : '❌ Неактивен'}`;
  }).join('\n\n') : 
  '❌ У вас пока нет майнеров\n💡 Купите свой первый майнер!'}`;
        
        await ctx.editMessageText(myMinersMessage, minersKeyboard());
        break;
      
      case 'collect_rewards':
        await ctx.answerCbQuery();
        try {
          const result = collectRewards(userId);
          let collectedText = '';
          if (result.collected.stars > 0) {
            collectedText += `⭐ Stars: ${result.collected.stars}\n`;
          }
          if (result.collected.coins > 0) {
            collectedText += `🪙 Magnum Coins: ${result.collected.coins}\n`;
          }
          
          await ctx.editMessageText(
            `💰 Награды успешно собраны!

🎁 Собрано:
${collectedText}
💎 Новый баланс: ${result.newBalance.stars} ⭐ ${result.newBalance.coins} 🪙

⏰ Следующий сбор будет доступен через минуту`,
            minersKeyboard()
          );
        } catch (error) {
          await ctx.editMessageText(
            `❌ Ошибка сбора наград!

🔍 Причина: ${error.message}`,
            minersKeyboard()
          );
        }
        break;
      
      case 'set_title_novice':
      case 'set_title_owner':
        await ctx.answerCbQuery();
        const titleId = callbackData.replace('set_title_', '');
        
        try {
          const result = setUserTitle(userId, titleId);
          await ctx.editMessageText(
            `✅ Титул успешно изменен!

👑 ${getFormattedTitle(result.oldTitle)} → ${getFormattedTitle(result.newTitle)}

Теперь ваш профиль отображается с новым титулом!`,
            titlesKeyboard()
          );
        } catch (error) {
          await ctx.editMessageText(
            `❌ Ошибка смены титула!

🔍 Причина: ${error.message}`,
            titlesKeyboard()
          );
        }
        break;
      
      case 'withdraw_stars':
        await ctx.answerCbQuery();
        const userBalance = getUserBalance(userId);
        
        const withdrawMessage = `💰 Вывод звезд:

💎 Ваш баланс: ${userBalance.stars} ⭐

Выберите способ вывода:

💳 Указать сумму - вывести определенное количество звезд
💰 Вывести все - вывести весь доступный баланс
📊 История - посмотреть историю выводов

⚠️ Минимальная сумма для вывода: 10 ⭐`;
        
        await ctx.editMessageText(withdrawMessage, withdrawKeyboard());
        break;
      
      case 'withdraw_all_stars':
        await ctx.answerCbQuery();
        const allBalance = getUserBalance(userId);
        
        if (allBalance.stars < 10) {
          await ctx.editMessageText(
            '❌ Недостаточно звезд для вывода!\n\n' +
            '⚠️ Минимальная сумма для вывода: 10 ⭐\n' +
            `💎 Ваш баланс: ${allBalance.stars} ⭐`,
            withdrawKeyboard()
          );
          return;
        }
        
        await ctx.editMessageText(
          `💰 Вывод всех звезд:

💎 Сумма к выводу: ${allBalance.stars} ⭐
💳 Способ вывода: Банковская карта
⏰ Время обработки: 1-3 рабочих дня

⚠️ Для подтверждения вывода напишите "подтвердить"`,
          withdrawKeyboard()
        );
        break;
      
      case 'withdraw_custom_amount':
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние ожидания ввода суммы
        userStates.set(userId, { state: 'waiting_for_withdraw_amount', timestamp: Date.now() });
        
        await ctx.editMessageText(
          '💰 Вывод звезд:\n\n' +
          'Введите сумму для вывода:\n\n' +
          '💡 Пример: 100\n' +
          '⚠️ Минимальная сумма: 10 ⭐\n' +
          '❌ Для отмены напишите "отмена"',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Назад', 'withdraw_stars')]
          ])
        );
        break;
      
      case 'withdraw_history':
        await ctx.answerCbQuery();
        
        const historyMessage = `📊 История выводов:

У вас пока нет истории выводов.

💡 После первого вывода здесь появится информация о всех операциях.`;
        
        await ctx.editMessageText(historyMessage, withdrawKeyboard());
        break;
      
      case 'referrals':
        await ctx.answerCbQuery();
        const userReferralStats = getReferralStats(userId);
        const userLevelInfo = getLevelInfo(userReferralStats.level);
        
                 const referralsMessage = `👥 Реферальная система:

📊 Ваша статистика
├ Реферальный код: ${userReferralStats.referralCode}
├ Всего рефералов: ${userReferralStats.totalReferrals}
├ Активных рефералов: ${userReferralStats.activeReferrals}
        ├ Заработано: ${userReferralStats.totalEarned.stars} ⭐
        └ Текущий уровень: ${userLevelInfo.name} (${userReferralStats.level})

💡 Приглашайте друзей и получайте награды за их активность!`;
        
        await ctx.editMessageText(referralsMessage, referralsKeyboard());
        break;
      
      case 'my_referral_code':
        await ctx.answerCbQuery();
        const userReferralCode = getUserReferralCode(userId);
        
                 const referralCodeMessage = `🔗 Ваш реферальный код:

📝 Код: \`${userReferralCode}\`

💡 Как использовать:
• Отправьте этот код друзьям
• Они должны написать "реферал ${userReferralCode}"
• Вы получите награды за их активность

💰 Награды (только Stars):
• За регистрацию: 50 ⭐
• За покупку майнера: 10 ⭐
• За активацию ключа: 5 ⭐
• За сбор наград: 3 ⭐

📱 Поделитесь кодом: \`${userReferralCode}\``;
        
        await ctx.editMessageText(referralCodeMessage, referralsKeyboard());
        break;
      
      case 'my_referrals':
        await ctx.answerCbQuery();
        const userReferrals = getUserReferrals(userId);
        
        if (userReferrals.length === 0) {
          await ctx.editMessageText(
            '👥 У вас пока нет рефералов!\n\n' +
            '💡 Пригласите друзей, используя ваш реферальный код, ' +
            'и они появятся в этом списке.',
            referralsKeyboard()
          );
          return;
        }
        
                                   const myReferralsMessage = `👥 Ваши рефералы:

        📊 Всего рефералов: ${userReferrals.length}

        ${userReferrals.map((ref, index) => 
          `${index + 1}. ID: ${ref.userId}
           ├ Уровень: ${ref.level}
           ├ Заработано: ${ref.totalEarned.stars} ⭐
           └ Присоединился: ${ref.joinedAt.toLocaleDateString('ru-RU')}`
        ).join('\n\n')}

        💰 Вы заработали: ${getReferralStats(userId).totalEarned.stars} ⭐`;
        
        await ctx.editMessageText(myReferralsMessage, referralsKeyboard());
        break;
      
      case 'top_referrers':
        await ctx.answerCbQuery();
        const topReferrers = getTopReferrers(10);
        
        if (topReferrers.length === 0) {
          await ctx.editMessageText(
            '🏆 Пока нет данных о топ рефералах!\n\n' +
            '💡 Приглашайте друзей и поднимайтесь в рейтинге!',
            referralsKeyboard()
          );
          return;
        }
        
                 const topReferrersMessage = `🏆 Топ рефералов:

${topReferrers.map((ref, index) => {
  const refLevelInfo = getLevelInfo(ref.level);
  return `${index + 1}. ID: ${ref.userId}
   ├ Рефералов: ${ref.totalReferrals}
   ├ Заработано: ${ref.totalEarned.stars} ⭐
   └ Уровень: ${refLevelInfo.name} (${ref.level})`;
}).join('\n\n')}`;
        
        await ctx.editMessageText(topReferrersMessage, referralsKeyboard());
        break;
      
      case 'referral_levels':
        await ctx.answerCbQuery();
        const currentLevel = getReferralStats(userId).level;
        const nextLevelInfo = getNextLevel(currentLevel);
        const currentReferralStats = getReferralStats(userId);
        
        let levelsMessage = `📈 Уровни реферальной системы:

${Array.from({length: 10}, (_, i) => i + 1).map(level => {
  const levelData = getLevelInfo(level);
  const isCurrent = level === currentLevel;
  const isCompleted = currentReferralStats.totalEarned.stars >= levelData.requirement;
  
  let status = '';
  if (isCurrent) status = ' ✅ Текущий';
  else if (isCompleted) status = ' ✅ Достигнут';
  else status = ` ❌ Нужно: ${levelData.requirement - currentReferralStats.totalEarned.stars} ⭐`;
  
     return `${level}. ${levelData.name}
    ├ Требование: ${levelData.requirement} ⭐
    ├ Бонус: ${levelData.bonus.stars} ⭐
    └ ${status}`;
}).join('\n\n')}`;
        
        if (nextLevelInfo) {
          levelsMessage += `\n\n🎯 До следующего уровня: ${nextLevelInfo.requirement - referralStats.totalEarned.stars} ⭐`;
        }
        
        await ctx.editMessageText(levelsMessage, referralsKeyboard());
        break;
      
      case 'main_menu':
        logger.info('Обработка callback: main_menu', { userId });
        await ctx.answerCbQuery();
        // Очищаем состояние пользователя
        const mainMenuState = userStates.get(userId);
        userStates.delete(userId);
        logger.userState(userId, 'deleted', mainMenuState);
        const mainMenuMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(mainMenuMessage, inlineKeyboard(adminStatus));
        logger.info('Переход в главное меню', { userId });
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  }));
};