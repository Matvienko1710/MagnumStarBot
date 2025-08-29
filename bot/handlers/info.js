const { inlineKeyboard } = require('../keyboards/inline');

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - платформа для заработка Stars и Magnum Coins.\n\n' +
      '🎯 Основные функции:\n' +
      '• 📊 Статистика и отслеживание прогресса\n' +
      '• 💎 Баланс Stars и Magnum Coins\n' +
      '• 👥 Реферальная система\n' +
      '• 🎯 Выполнение заданий\n' +
      '• ⚙️ Настройки профиля\n' +
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
        
      case 'статистика':
      case 'statistics':
        await ctx.reply(
          '📊 Статистика бота:\n\n' +
          '👥 Всего пользователей: 1,234\n' +
          '📱 Активных сессий: 567\n' +
          '🔄 Запросов сегодня: 89\n' +
          '⭐ Рейтинг: 4.8/5.0\n\n' +
          '🎯 Ваша статистика:\n' +
          '├ Заданий выполнено: 0\n' +
          '├ Рефералов приглашено: 0\n' +
          '└ Время в боте: 0 мин',
          inlineKeyboard()
        );
        break;
        
      case 'баланс':
      case 'balance':
        await ctx.reply(
          '💎 Ваш баланс:\n\n' +
          '⭐ Stars: 0\n' +
          '🪙 Magnum Coins: 0\n\n' +
          '💰 Курс обмена:\n' +
          '├ 1 Star = 10 Magnum Coins\n' +
          '└ 100 Magnum Coins = 1 Star\n\n' +
          '💡 Заработайте Stars выполняя задания!',
          inlineKeyboard()
        );
        break;
        
      case 'рефералы':
      case 'referrals':
        const userId = ctx.from.id;
        const refLink = `https://t.me/your_bot_username?start=ref${userId}`;
        await ctx.reply(
          '👥 Реферальная система:\n\n' +
          '📊 Ваши рефералы: 0\n' +
          '💰 Заработано с рефералов: 0 Stars\n\n' +
          '🔗 Ваша реферальная ссылка:\n' +
          `${refLink}\n\n` +
          '💡 За каждого приглашенного друга получаете 5 Stars!',
          inlineKeyboard()
        );
        break;
        
      case 'задания':
      case 'tasks':
        await ctx.reply(
          '🎯 Доступные задания:\n\n' +
          '✅ Ежедневный вход (1 Star)\n' +
          '├ Выполнено: 0/1\n' +
          '└ Награда: 1 Star\n\n' +
          '✅ Пригласить друга (5 Stars)\n' +
          '├ Выполнено: 0/∞\n' +
          '└ Награда: 5 Stars\n\n' +
          '✅ Использовать WebApp (2 Stars)\n' +
          '├ Выполнено: 0/1\n' +
          '└ Награда: 2 Stars\n\n' +
          '💡 Выполняйте задания для заработка Stars!',
          inlineKeyboard()
        );
        break;
        
      case 'настройки':
      case 'settings':
        await ctx.reply(
          '⚙️ Настройки:\n\n' +
          '🔔 Уведомления: Включены\n' +
          '🌙 Тема: Авто\n' +
          '🌍 Язык: Русский\n' +
          '📱 Версия: 1.0.0\n\n' +
          '🔧 Дополнительные настройки:\n' +
          '├ Авто-обмен: Выключен\n' +
          '├ Уведомления о заданиях: Включены\n' +
          '└ Статистика: Публичная\n\n' +
          'Настройки пока не доступны для изменения.',
          inlineKeyboard()
        );
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