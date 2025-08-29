const { inlineKeyboard } = require('../keyboards/inline');

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    switch (callbackData) {
      case 'webapp':
        await ctx.answerCbQuery();
        await ctx.reply('Открываем WebApp', inlineKeyboard());
        break;
      
      case 'about':
        await ctx.answerCbQuery();
        await ctx.reply('О боте: Magnum Star Bot - многофункциональный Telegram бот.');
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};