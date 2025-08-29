const { inlineKeyboard, inlineKeyboardWithBack } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    switch (callbackData) {
      case 'webapp':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          'Открываем WebApp',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'main_menu':
        await ctx.answerCbQuery();
        const welcomeMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(welcomeMessage, inlineKeyboard());
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};