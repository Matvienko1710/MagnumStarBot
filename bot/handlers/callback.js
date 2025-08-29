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
      
      case 'statistics':
        await ctx.answerCbQuery();
        await ctx.reply(
          '📊 Статистика бота:\n\n' +
          '👥 Всего пользователей: 0\n' +
          '📱 Активных сессий: 0\n' +
          '🔄 Запросов сегодня: 0\n' +
          '⭐ Рейтинг: 5.0/5.0',
          inlineKeyboard()
        );
        break;
      
      case 'about':
        await ctx.answerCbQuery();
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
      
      case 'settings':
        await ctx.answerCbQuery();
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
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};