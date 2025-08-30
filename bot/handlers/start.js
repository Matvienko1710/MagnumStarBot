const { inlineKeyboard } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { isAdmin } = require('../utils/admin');
const logger = require('../utils/logger');

module.exports = (bot, safeAsync) => {
  bot.start(safeAsync(async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'Unknown';
    
    logger.info('Команда /start', { userId, userName });
    
    try {
      const welcomeMessage = generateUserProfile(ctx.from);
      const adminStatus = isAdmin(userId);
      
      logger.debug('Генерация профиля пользователя', { userId, adminStatus });
      
      await ctx.reply(welcomeMessage, inlineKeyboard(adminStatus));
      
      logger.info('Приветственное сообщение отправлено', { userId, adminStatus });
    } catch (error) {
      logger.error('Ошибка в обработчике /start', error, { userId });
      throw error; // Передаем ошибку в safeAsync
    }
  }));
};