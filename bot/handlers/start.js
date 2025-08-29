const { inlineKeyboard } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    const welcomeMessage = generateUserProfile(ctx.from);
    await ctx.reply(welcomeMessage, inlineKeyboard());
  });
};