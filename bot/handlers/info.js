module.exports = (bot) => {
  bot.command('info', async (ctx) => {
    await ctx.reply(
      'Magnum Star Bot - многофункциональный бот с поддержкой Telegram WebApp.\n\n' +
      'Используйте меню для навигации по функциям бота.'
    );
  });
};