const { inlineKeyboard } = require('../keyboards/inline');

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - многофункциональный бот с поддержкой Telegram WebApp.\n\n' +
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
          '👥 Всего пользователей: 0\n' +
          '📱 Активных сессий: 0\n' +
          '🔄 Запросов сегодня: 0\n' +
          '⭐ Рейтинг: 5.0/5.0',
          inlineKeyboard()
        );
        break;
        
      case 'информация':
      case 'about':
      case 'о боте':
        await ctx.reply(
          'ℹ️ О боте:\n\n' +
          'Magnum Star Bot - многофункциональный Telegram бот.\n\n' +
          '🔧 Возможности:\n' +
          '• Интерактивные кнопки\n' +
          '• WebApp интерфейс\n' +
          '• Статистика и настройки\n' +
          '• Удобная навигация',
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
          'Настройки пока не доступны для изменения.',
          inlineKeyboard()
        );
        break;
        
      case 'веб':
      case 'webapp':
      case 'web':
        await ctx.reply('Открываем WebApp:', inlineKeyboard());
        break;
        
      default:
        await ctx.reply(
          'Не понимаю команду. Напишите "меню" для показа кнопок или используйте команду /info',
          inlineKeyboard()
        );
    }
  });
};