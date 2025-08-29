const { inlineKeyboard } = require('../keyboards/inline');
const { isAdmin } = require('../utils/admin');
const { activateKey, getUserKeyHistory, createKey } = require('../utils/keys');

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
          (result.reward.coins > 0 ? `└ 🪙 Magnum Coins: +${result.reward.coins}\n` : '') +
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
        
        const profileMessage = `👤 Профиль пользователя:

👤 Основная информация
├ ID: ${userId}
├ Имя: ${userName}
├ Username: ${user.username || 'Не указан'}
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
        
      default:
        await ctx.reply(
          'Не понимаю команду. Напишите "меню" для показа кнопок или используйте команду /info',
          inlineKeyboard(adminStatus)
        );
    }
  });
};