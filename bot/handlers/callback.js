const { inlineKeyboard, inlineKeyboardWithBack, adminPanelKeyboard, createKeyKeyboard, minersKeyboard, buyMinerKeyboard, titlesKeyboard, changeTitleKeyboard, profileKeyboard, withdrawKeyboard } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { getUserBalance, getUserStats, getTransactionHistory } = require('../utils/currency');
const { isAdmin, getAdminStats, getBotStats } = require('../utils/admin');
const { activateKey, getUserKeyHistory, createKey, getKeysStats } = require('../utils/keys');
const { getUserMiners, getAvailableRewards, buyMiner, collectRewards, getMinersStats, getMinerTypes, getMinerType } = require('../utils/miners');
const { getUserCurrentTitle, getUserUnlockedTitles, setUserTitle, getUserTitlesStats, getAllTitles, getFormattedTitle } = require('../utils/titles');

// Временное хранилище состояний пользователей (в реальном проекте заменить на БД)
const userStates = new Map();

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const adminStatus = isAdmin(userId);
    
    switch (callbackData) {
      case 'profile':
        await ctx.answerCbQuery();
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        
        // Получаем данные из системы валюты
        const balance = getUserBalance(userId);
        const currencyStats = getUserStats(userId);
        const keyHistory = getUserKeyHistory(userId);
        
        const userCurrentTitle = getUserCurrentTitle(userId);
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
├ Рефералы: 0
├ Заработано: 0 Stars
└ Уровень: Новичок

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
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние ожидания ввода ключа
        userStates.set(userId, { state: 'waiting_for_key', timestamp: Date.now() });
        
        await ctx.editMessageText(
          '🔑 Активация ключа:\n\n' +
          'Введите 12-значный ключ активации:\n\n' +
          '📝 Формат: XXXXXXXXXXXX\n' +
          '💡 Пример: ABC123DEF456\n\n' +
          '❌ Для отмены напишите "отмена"',
          inlineKeyboardWithBack(adminStatus)
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
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние создания ключа
        userStates.set(userId, { 
          state: 'creating_key', 
          step: 'stars',
          data: {},
          timestamp: Date.now() 
        });
        
        await ctx.editMessageText(
          '🔑 Создание нового ключа:\n\n' +
          'Шаг 1/4: Введите количество Stars для награды\n\n' +
          '💡 Пример: 50\n' +
          '❌ Для отмены напишите "отмена"',
          createKeyKeyboard()
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
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        
        // Устанавливаем состояние создания ключа титула
        userStates.set(userId, { 
          state: 'creating_title_key', 
          step: 'title',
          data: {},
          timestamp: Date.now() 
        });
        
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
          createKeyKeyboard()
        );
        break;
      
      case 'webapp':
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
          inlineKeyboardWithBack(adminStatus)
        );
        break;
      
      case 'back':
        await ctx.answerCbQuery();
        // Очищаем состояние пользователя
        userStates.delete(userId);
        // Возвращаемся к предыдущему меню (в данном случае к главному)
        const welcomeMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(welcomeMessage, inlineKeyboard(adminStatus));
        break;
      
      case 'miners':
        await ctx.answerCbQuery();
        const minersStats = getMinersStats(userId);
        const availableRewards = getAvailableRewards(userId);
        
        const minersMessage = `⛏️ Майнеры:

📊 Общая статистика
├ Всего майнеров: ${minersStats.totalMiners}
├ Активных майнеров: ${minersStats.activeMiners}
├ Доступно наград: ${availableRewards} ⭐
└ Всего заработано: ${minersStats.totalEarned.stars} ⭐

${minersStats.miners.length > 0 ? 
  `📋 Ваши майнеры:
${minersStats.miners.map(miner => 
  `├ ${miner.name}
  │  ├ Доход/час: ${miner.rewardPerHour} ⭐
  │  ├ Заработано: ${miner.totalEarned}/${miner.maxReward} ⭐
  │  └ Осталось: ${miner.remainingReward} ⭐`
).join('\n')}` : 
  '❌ У вас пока нет майнеров\n💡 Купите свой первый майнер!'}`;
        
        await ctx.editMessageText(minersMessage, minersKeyboard());
        break;
      
      case 'buy_miner':
        await ctx.answerCbQuery();
        const minerTypes = getMinerTypes();
        
        const buyMinerMessage = `⛏️ Покупка майнера:

Выберите тип майнера для покупки:

${minerTypes.map(type => 
  `🔸 ${type.name}
  ├ 💰 Цена: ${type.price} ⭐
  ├ ⚡ Доход/час: ${type.rewardPerHour} ⭐
  ├ 📈 Максимум: ${type.maxReward} ⭐
  └ 📝 ${type.description}`
).join('\n\n')}`;
        
        await ctx.editMessageText(buyMinerMessage, buyMinerKeyboard());
        break;
      
      case 'buy_basic_miner':
        await ctx.answerCbQuery();
        try {
          const result = buyMiner(userId, 'BASIC');
          await ctx.editMessageText(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
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
      
      case 'buy_advanced_miner':
        await ctx.answerCbQuery();
        try {
          const result = buyMiner(userId, 'ADVANCED');
          await ctx.editMessageText(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
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
      
      case 'buy_pro_miner':
        await ctx.answerCbQuery();
        try {
          const result = buyMiner(userId, 'PRO');
          await ctx.editMessageText(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
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
  myMinersStats.miners.map(miner => 
    `⛏️ ${miner.name}
├ 🆔 ID: ${miner.id}
├ 📅 Куплен: ${new Date(miner.purchaseDate).toLocaleDateString('ru-RU')}
├ ⚡ Доход/час: ${miner.rewardPerHour} ⭐
├ 💰 Заработано: ${miner.totalEarned}/${miner.maxReward} ⭐
├ 📈 Осталось: ${miner.remainingReward} ⭐
└ ${miner.isActive ? '✅ Активен' : '❌ Неактивен'}`
  ).join('\n\n') : 
  '❌ У вас пока нет майнеров\n💡 Купите свой первый майнер!'}`;
        
        await ctx.editMessageText(myMinersMessage, minersKeyboard());
        break;
      
      case 'collect_rewards':
        await ctx.answerCbQuery();
        try {
          const result = collectRewards(userId);
          await ctx.editMessageText(
            `💰 Награды успешно собраны!

🎁 Собрано: ${result.collected} ⭐
💎 Новый баланс: ${result.newBalance.stars} ⭐

⏰ Следующий сбор будет доступен через час`,
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
          withdrawKeyboard()
        );
        break;
      
      case 'withdraw_history':
        await ctx.answerCbQuery();
        
        const historyMessage = `📊 История выводов:

У вас пока нет истории выводов.

💡 После первого вывода здесь появится информация о всех операциях.`;
        
        await ctx.editMessageText(historyMessage, withdrawKeyboard());
        break;
      
      case 'main_menu':
        await ctx.answerCbQuery();
        // Очищаем состояние пользователя
        userStates.delete(userId);
        const mainMenuMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(mainMenuMessage, inlineKeyboard(adminStatus));
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};