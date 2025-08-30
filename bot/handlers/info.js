const { inlineKeyboard } = require('../keyboards/inline');
const { isAdmin } = require('../utils/admin');
const { activateKey, getUserKeyHistory, createKey } = require('../utils/keys');
const { getUserMiners, getAvailableRewards, buyMiner, collectRewards, getMinersStats, getMinerTypes } = require('../utils/miners');
const { getUserCurrentTitle, getUserUnlockedTitles, setUserTitle, getUserTitlesStats, getAllTitles, getFormattedTitle } = require('../utils/titles');

// Временное хранилище состояний пользователей (в реальном проекте заменить на БД)
const userStates = new Map();

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    const adminStatus = isAdmin(ctx.from.id);
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - платформа для заработка Stars и Magnum Coins.\n\n' +
      '🎯 Основные функции:\n' +
      '• 👤 Профиль пользователя\n' +
      '• 🔑 Активация ключей (промокоды)\n' +
      '• ⛏️ Система майнеров\n' +
      '• 👑 Система титулов\n' +
      (adminStatus ? '• 🌐 WebApp (только для админов)\n' : '') +
      (adminStatus ? '• 🔧 Админ панель\n' : '') +
      '\nИспользуйте кнопки ниже для навигации:',
      inlineKeyboard(adminStatus)
    );
  });

  // Обработка команды /menu
  bot.command('menu', async (ctx) => {
    const adminStatus = isAdmin(ctx.from.id);
    await ctx.reply('Выберите действие:', inlineKeyboard(adminStatus));
  });

  // Обработка текстовых сообщений
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    const adminStatus = isAdmin(userId);
    
    // Проверяем состояние пользователя
    const userState = userStates.get(userId);
    
    if (userState && userState.state === 'waiting_for_key') {
      // Пользователь вводит ключ
      if (text.toLowerCase() === 'отмена') {
        userStates.delete(userId);
        await ctx.reply('❌ Активация ключа отменена.', inlineKeyboard(adminStatus));
        return;
      }
      
      // Проверяем формат ключа
      if (text.length !== 12 || !/^[A-Z0-9]{12}$/i.test(text)) {
        await ctx.reply(
          '❌ Неверный формат ключа!\n\n' +
          '📝 Ключ должен содержать ровно 12 символов (буквы и цифры)\n' +
          '💡 Пример: ABC123DEF456\n\n' +
          'Попробуйте еще раз или напишите "отмена" для отмены.',
          inlineKeyboard(adminStatus)
        );
        return;
      }
      
      try {
        // Активируем ключ
        const result = activateKey(text, userId);
        
        // Очищаем состояние
        userStates.delete(userId);
        
        await ctx.reply(
          `✅ Ключ успешно активирован!\n\n` +
          `🔑 Ключ: ${result.key}\n` +
          `📝 Описание: ${result.description}\n\n` +
          `🎁 Получено:\n` +
          (result.reward.stars > 0 ? `├ ⭐ Stars: +${result.reward.stars}\n` : '') +
          (result.reward.coins > 0 ? `├ 🪙 Magnum Coins: +${result.reward.coins}\n` : '') +
          (result.titleReward ? `└ 👑 Титул: ${getTitleById(result.titleReward).name}\n` : '') +
          `\n💰 Осталось использований: ${result.remainingUses}`,
          inlineKeyboard(adminStatus)
        );
      } catch (error) {
        // Очищаем состояние
        userStates.delete(userId);
        
        await ctx.reply(
          `❌ Ошибка активации ключа!\n\n` +
          `🔍 Причина: ${error.message}\n\n` +
          `Попробуйте другой ключ или напишите "отмена" для отмены.`,
          inlineKeyboard(adminStatus)
        );
      }
      return;
    }
    
    if (userState && userState.state === 'creating_title_key') {
      // Админ создает ключ титула
      if (text.toLowerCase() === 'отмена') {
        userStates.delete(userId);
        await ctx.reply('❌ Создание ключа титула отменено.', inlineKeyboard(adminStatus));
        return;
      }
      
      const step = userState.step;
      
      switch (step) {
        case 'title':
          // Ввод ID титула
          const titleId = text.toLowerCase().trim();
          const { getTitleById } = require('../utils/titles');
          const title = getTitleById(titleId);
          
          if (!title) {
            await ctx.reply(
              '❌ Неверный ID титула!\n\n' +
              '💡 Доступные титулы:\n' +
              '• novice - Новичок\n' +
              '• owner - Владелец\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.titleId = titleId;
          userState.step = 'stars';
          
          await ctx.reply(
            '👑 Создание ключа титула:\n\n' +
            `✅ Титул: ${getFormattedTitle(title)}\n\n` +
            'Шаг 2/4: Введите количество Stars для награды\n\n' +
            '💡 Пример: 50\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'stars':
          // Ввод количества Stars
          const stars = parseInt(text);
          if (isNaN(stars) || stars < 0) {
            await ctx.reply(
              '❌ Неверное количество Stars!\n\n' +
              '💡 Введите число больше или равное 0\n' +
              'Пример: 50\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.stars = stars;
          userState.step = 'coins';
          
          await ctx.reply(
            '👑 Создание ключа титула:\n\n' +
            `✅ Титул: ${getFormattedTitle(getTitleById(userState.data.titleId))}\n` +
            `✅ Stars: ${stars}\n\n` +
            'Шаг 3/4: Введите количество Magnum Coins для награды\n\n' +
            '💡 Пример: 100\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'coins':
          // Ввод количества Coins
          const coins = parseInt(text);
          if (isNaN(coins) || coins < 0) {
            await ctx.reply(
              '❌ Неверное количество Coins!\n\n' +
              '💡 Введите число больше или равное 0\n' +
              'Пример: 100\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.coins = coins;
          userState.step = 'max_uses';
          
          await ctx.reply(
            '👑 Создание ключа титула:\n\n' +
            `✅ Титул: ${getFormattedTitle(getTitleById(userState.data.titleId))}\n` +
            `✅ Stars: ${userState.data.stars}\n` +
            `✅ Coins: ${coins}\n\n` +
            'Шаг 4/4: Введите максимальное количество активаций\n\n' +
            '💡 Пример: 5\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'max_uses':
          // Ввод максимального количества использований
          const maxUses = parseInt(text);
          if (isNaN(maxUses) || maxUses < 1) {
            await ctx.reply(
              '❌ Неверное количество активаций!\n\n' +
              '💡 Введите число больше 0\n' +
              'Пример: 5\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.maxUses = maxUses;
          userState.step = 'description';
          
          await ctx.reply(
            '👑 Создание ключа титула:\n\n' +
            `✅ Титул: ${getFormattedTitle(getTitleById(userState.data.titleId))}\n` +
            `✅ Stars: ${userState.data.stars}\n` +
            `✅ Coins: ${userState.data.coins}\n` +
            `✅ Максимум активаций: ${maxUses}\n\n` +
            'Шаг 5/5: Введите описание ключа\n\n' +
            '💡 Пример: Ключ для получения титула Владелец\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'description':
          // Ввод описания
          const description = text.trim();
          if (description.length === 0) {
            await ctx.reply(
              '❌ Описание не может быть пустым!\n\n' +
              '💡 Введите описание ключа\n' +
              'Пример: Ключ для получения титула Владелец\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.description = description;
          
          // Создаем ключ титула
          try {
            const newKey = createKey(
              { stars: userState.data.stars, coins: userState.data.coins },
              userState.data.maxUses,
              userState.data.description,
              userState.data.titleId
            );
            
            // Очищаем состояние
            userStates.delete(userId);
            
            const title = getTitleById(userState.data.titleId);
            
            await ctx.reply(
              `✅ Ключ титула успешно создан!\n\n` +
              `🔑 Ключ: ${newKey}\n` +
              `👑 Титул: ${getFormattedTitle(title)}\n` +
              `📝 Описание: ${userState.data.description}\n\n` +
              `🎁 Награда:\n` +
              `├ ⭐ Stars: ${userState.data.stars}\n` +
              `├ 🪙 Magnum Coins: ${userState.data.coins}\n` +
              `└ 👑 Титул: ${title.name}\n\n` +
              `💰 Максимум активаций: ${userState.data.maxUses}`,
              inlineKeyboard(adminStatus)
            );
          } catch (error) {
            // Очищаем состояние
            userStates.delete(userId);
            
            await ctx.reply(
              `❌ Ошибка создания ключа титула!\n\n` +
              `🔍 Причина: ${error.message}`,
              inlineKeyboard(adminStatus)
            );
          }
          break;
      }
      return;
    }
    
    if (userState && userState.state === 'creating_key') {
      // Админ создает ключ
      if (text.toLowerCase() === 'отмена') {
        userStates.delete(userId);
        await ctx.reply('❌ Создание ключа отменено.', inlineKeyboard(adminStatus));
        return;
      }
      
      const step = userState.step;
      
      switch (step) {
        case 'stars':
          // Ввод количества Stars
          const stars = parseInt(text);
          if (isNaN(stars) || stars < 0) {
            await ctx.reply(
              '❌ Неверное количество Stars!\n\n' +
              '💡 Введите число больше или равное 0\n' +
              'Пример: 50\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.stars = stars;
          userState.step = 'coins';
          
          await ctx.reply(
            '🔑 Создание нового ключа:\n\n' +
            `✅ Stars: ${stars}\n\n` +
            'Шаг 2/4: Введите количество Magnum Coins для награды\n\n' +
            '💡 Пример: 100\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'coins':
          // Ввод количества Coins
          const coins = parseInt(text);
          if (isNaN(coins) || coins < 0) {
            await ctx.reply(
              '❌ Неверное количество Coins!\n\n' +
              '💡 Введите число больше или равное 0\n' +
              'Пример: 100\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.coins = coins;
          userState.step = 'max_uses';
          
          await ctx.reply(
            '🔑 Создание нового ключа:\n\n' +
            `✅ Stars: ${userState.data.stars}\n` +
            `✅ Coins: ${coins}\n\n` +
            'Шаг 3/4: Введите максимальное количество активаций\n\n' +
            '💡 Пример: 5\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'max_uses':
          // Ввод максимального количества использований
          const maxUses = parseInt(text);
          if (isNaN(maxUses) || maxUses < 1) {
            await ctx.reply(
              '❌ Неверное количество активаций!\n\n' +
              '💡 Введите число больше 0\n' +
              'Пример: 5\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.maxUses = maxUses;
          userState.step = 'description';
          
          await ctx.reply(
            '🔑 Создание нового ключа:\n\n' +
            `✅ Stars: ${userState.data.stars}\n` +
            `✅ Coins: ${userState.data.coins}\n` +
            `✅ Максимум активаций: ${maxUses}\n\n` +
            'Шаг 4/4: Введите описание ключа\n\n' +
            '💡 Пример: Тестовый ключ для новых пользователей\n' +
            '❌ Для отмены напишите "отмена"'
          );
          break;
          
        case 'description':
          // Ввод описания
          const description = text.trim();
          if (description.length === 0) {
            await ctx.reply(
              '❌ Описание не может быть пустым!\n\n' +
              '💡 Введите описание ключа\n' +
              'Пример: Тестовый ключ для новых пользователей\n\n' +
              'Попробуйте еще раз или напишите "отмена" для отмены.'
            );
            return;
          }
          
          userState.data.description = description;
          
          // Создаем ключ
          try {
            const newKey = createKey(
              { stars: userState.data.stars, coins: userState.data.coins },
              userState.data.maxUses,
              userState.data.description
            );
            
            // Очищаем состояние
            userStates.delete(userId);
            
            await ctx.reply(
              `✅ Ключ успешно создан!\n\n` +
              `🔑 Ключ: ${newKey}\n` +
              `📝 Описание: ${userState.data.description}\n\n` +
              `🎁 Награда:\n` +
              `├ ⭐ Stars: ${userState.data.stars}\n` +
              `└ 🪙 Magnum Coins: ${userState.data.coins}\n\n` +
              `💰 Максимум активаций: ${userState.data.maxUses}`,
              inlineKeyboard(adminStatus)
            );
          } catch (error) {
            // Очищаем состояние
            userStates.delete(userId);
            
            await ctx.reply(
              `❌ Ошибка создания ключа!\n\n` +
              `🔍 Причина: ${error.message}`,
              inlineKeyboard(adminStatus)
            );
          }
          break;
      }
      return;
    }
    
    // Обычная обработка команд
    const textLower = text.toLowerCase();
    
    switch (textLower) {
      case 'меню':
      case 'menu':
      case 'кнопки':
      case 'buttons':
        await ctx.reply('Выберите действие:', inlineKeyboard(adminStatus));
        break;
        
      case 'профиль':
      case 'profile':
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        
        // Получаем данные из системы валюты
        const { getUserBalance, getUserStats } = require('../utils/currency');
        const balance = getUserBalance(userId);
        const currencyStats = getUserStats(userId);
        const keyHistory = getUserKeyHistory(userId);
        
        const currentTitle = getUserCurrentTitle(userId);
        const profileMessage = `👤 Профиль пользователя:

👤 Основная информация
├ ID: ${userId}
├ Имя: ${userName}
├ Username: ${user.username || 'Не указан'}
├ Титул: ${getFormattedTitle(currentTitle)}
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
        
        await ctx.reply(profileMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'ключ':
      case 'key':
      case 'активировать':
      case 'activate':
        // Устанавливаем состояние ожидания ввода ключа
        userStates.set(userId, { state: 'waiting_for_key', timestamp: Date.now() });
        
        await ctx.reply(
          '🔑 Активация ключа:\n\n' +
          'Введите 12-значный ключ активации:\n\n' +
          '📝 Формат: XXXXXXXXXXXX\n' +
          '💡 Пример: ABC123DEF456\n\n' +
          '❌ Для отмены напишите "отмена"',
          inlineKeyboard(adminStatus)
        );
        break;
        
      case 'майнеры':
      case 'miners':
      case 'майнер':
      case 'miner':
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
        
        await ctx.reply(minersMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'купить майнер':
      case 'buy miner':
      case 'купить':
      case 'buy':
        const minerTypes = getMinerTypes();
        
        const buyMinerMessage = `⛏️ Покупка майнера:

Выберите тип майнера для покупки:

${minerTypes.map(type => 
  `🔸 ${type.name}
  ├ 💰 Цена: ${type.price} ⭐
  ├ ⚡ Доход/час: ${type.rewardPerHour} ⭐
  ├ 📈 Максимум: ${type.maxReward} ⭐
  └ 📝 ${type.description}`
).join('\n\n')}

💡 Для покупки используйте кнопки в меню или напишите:
• "базовый майнер" - купить базовый майнер
• "продвинутый майнер" - купить продвинутый майнер  
• "про майнер" - купить профессиональный майнер`;
        
        await ctx.reply(buyMinerMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'базовый майнер':
      case 'basic miner':
        try {
          const result = buyMiner(userId, 'BASIC');
          await ctx.reply(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка покупки майнера!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      case 'продвинутый майнер':
      case 'advanced miner':
        try {
          const result = buyMiner(userId, 'ADVANCED');
          await ctx.reply(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка покупки майнера!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      case 'про майнер':
      case 'pro miner':
        try {
          const result = buyMiner(userId, 'PRO');
          await ctx.reply(
            `✅ Майнер успешно куплен!

⛏️ ${result.miner.name}
💰 Стоимость: ${result.price} ⭐
📅 Дата покупки: ${new Date(result.miner.purchaseDate).toLocaleString('ru-RU')}

💎 Новый баланс: ${result.newBalance.stars} ⭐`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка покупки майнера!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      case 'забрать награды':
      case 'collect rewards':
      case 'собрать':
      case 'collect':
        try {
          const result = collectRewards(userId);
          await ctx.reply(
            `💰 Награды успешно собраны!

🎁 Собрано: ${result.collected} ⭐
💎 Новый баланс: ${result.newBalance.stars} ⭐

⏰ Следующий сбор будет доступен через час`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка сбора наград!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      case 'веб':
      case 'webapp':
      case 'web':
        if (!adminStatus) {
          await ctx.reply('❌ Доступ запрещен. Эта функция доступна только администраторам.');
          return;
        }
        
        await ctx.reply(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
          inlineKeyboard(adminStatus)
        );
        break;
        
      case 'админ':
      case 'admin':
      case 'панель':
      case 'panel':
        if (!adminStatus) {
          await ctx.reply('❌ Доступ запрещен. Админ панель доступна только администраторам.');
          return;
        }
        
        const { getAdminStats, getBotStats } = require('../utils/admin');
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
        
        await ctx.reply(adminMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'титулы':
      case 'titles':
      case 'титул':
      case 'title':
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
        
        await ctx.reply(titlesMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'сменить титул':
      case 'change title':
        const unlockedTitles = getUserUnlockedTitles(userId);
        
        if (unlockedTitles.length === 0) {
          await ctx.reply(
            '❌ У вас нет разблокированных титулов!\n\n💡 Используйте ключи для получения титулов.',
            inlineKeyboard(adminStatus)
          );
          return;
        }
        
        const changeTitleMessage = `👑 Смена титула:

Выберите титул для установки:

${unlockedTitles.map(title => 
  `🔸 ${getFormattedTitle(title)}
  └ ${title.description}`
).join('\n\n')}

💡 Для смены титула используйте кнопки в меню или напишите:
• "установить титул новичок" - установить титул Новичок
• "установить титул владелец" - установить титул Владелец`;
        
        await ctx.reply(changeTitleMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'установить титул новичок':
      case 'set title novice':
        try {
          const result = setUserTitle(userId, 'novice');
          await ctx.reply(
            `✅ Титул успешно изменен!

👑 ${getFormattedTitle(result.oldTitle)} → ${getFormattedTitle(result.newTitle)}

Теперь ваш профиль отображается с новым титулом!`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка смены титула!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      case 'установить титул владелец':
      case 'set title owner':
        try {
          const result = setUserTitle(userId, 'owner');
          await ctx.reply(
            `✅ Титул успешно изменен!

👑 ${getFormattedTitle(result.oldTitle)} → ${getFormattedTitle(result.newTitle)}

Теперь ваш профиль отображается с новым титулом!`,
            inlineKeyboard(adminStatus)
          );
        } catch (error) {
          await ctx.reply(
            `❌ Ошибка смены титула!

🔍 Причина: ${error.message}`,
            inlineKeyboard(adminStatus)
          );
        }
        break;
        
      default:
        await ctx.reply(
          'Не понимаю команду. Напишите "меню" для показа кнопок или используйте команду /info',
          inlineKeyboard(adminStatus)
        );
    }
  });
};