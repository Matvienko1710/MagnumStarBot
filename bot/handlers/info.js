const { inlineKeyboard } = require('../keyboards/inline');

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - платформа для заработка Stars и Magnum Coins.\n\n' +
      '🎯 Основные функции:\n' +
      '• 👤 Профиль пользователя\n' +
      '• 🌐 WebApp (дополнительно)\n\n' +
      'Используйте кнопки ниже для навигации:',
      inlineKeyboard()
    );
  });

  // Обработка команды /menu
  bot.command('menu', async (ctx) => {
    await ctx.reply('Выберите действие:', inlineKeyboard());
  });

  // Обработка текстовых сообщений
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    switch (text) {
      case 'меню':
      case 'menu':
      case 'кнопки':
      case 'buttons':
        await ctx.reply('Выберите действие:', inlineKeyboard());
        break;
        
      case 'профиль':
      case 'profile':
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        const userId = user.id;
        const userStars = 0; // Пока ставим 0, потом можно подключить БД
        const userCoins = 0; // Пока ставим 0, потом можно подключить БД
        const referrals = 0; // Пока ставим 0, потом можно подключить БД
        const earnedFromRefs = 0; // Пока ставим 0, потом можно подключить БД
        
        const profileMessage = `👤 Профиль пользователя:

👤 Основная информация
├ ID: ${userId}
├ Имя: ${userName}
├ Username: ${user.username || 'Не указан'}
└ Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}

💎 Баланс
├ ⭐ Stars: ${userStars}
└ 🪙 Magnum Coins: ${userCoins}

👥 Реферальная система
├ Рефералы: ${referrals}
├ Заработано: ${earnedFromRefs} Stars
└ Уровень: Новичок

📊 Статистика
├ Заданий выполнено: 0
├ Время в боте: 0 мин
└ Последний вход: Сегодня

🎯 Достижения
├ 🏆 Первые шаги (зарегистрировался)
└ 🔄 В процессе: Ежедневный вход (0/7 дней)`;
        
        await ctx.reply(profileMessage, inlineKeyboard());
        break;
        
      case 'веб':
      case 'webapp':
      case 'web':
        await ctx.reply(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
          inlineKeyboard()
        );
        break;
        
      default:
        await ctx.reply(
          'Не понимаю команду. Напишите "меню" для показа кнопок или используйте команду /info',
          inlineKeyboard()
        );
    }
  });
};