const { inlineKeyboard } = require('../keyboards/inline');

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - многофункциональный бот с поддержкой Telegram WebApp.\n\n' +
      'Используйте кнопку WebApp для доступа к основному функционалу:',
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