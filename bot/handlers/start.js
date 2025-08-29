const { mainMenu } = require('../keyboards/mainMenu');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    const userName = ctx.from.first_name || 'пользователь';
    await ctx.reply(
      `Привет, ${userName}! Добро пожаловать в Magnum Star Bot.`,
      mainMenu()
    );
  });
};