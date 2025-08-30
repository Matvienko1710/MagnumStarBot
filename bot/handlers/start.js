const { inlineKeyboard } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { isAdmin } = require('../utils/admin');

module.exports = (bot, safeAsync) => {
  bot.start(safeAsync(async (ctx) => {
    const welcomeMessage = generateUserProfile(ctx.from);
    const adminStatus = isAdmin(ctx.from.id);
    await ctx.reply(welcomeMessage, inlineKeyboard(adminStatus));
  }));
};