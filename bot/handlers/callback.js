const { inlineKeyboard, inlineKeyboardWithBack } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    switch (callbackData) {
      case 'statistics':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '📊 Статистика бота:\n\n' +
          '👥 Всего пользователей: 1,234\n' +
          '📱 Активных сессий: 567\n' +
          '🔄 Запросов сегодня: 89\n' +
          '⭐ Рейтинг: 4.8/5.0\n\n' +
          '🎯 Ваша статистика:\n' +
          '├ Заданий выполнено: 0\n' +
          '├ Рефералов приглашено: 0\n' +
          '└ Время в боте: 0 мин',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'balance':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '💎 Ваш баланс:\n\n' +
          '⭐ Stars: 0\n' +
          '🪙 Magnum Coins: 0\n\n' +
          '💰 Курс обмена:\n' +
          '├ 1 Star = 10 Magnum Coins\n' +
          '└ 100 Magnum Coins = 1 Star\n\n' +
          '💡 Заработайте Stars выполняя задания!',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'referrals':
        await ctx.answerCbQuery();
        const userId = ctx.from.id;
        const refLink = `https://t.me/your_bot_username?start=ref${userId}`;
        await ctx.editMessageText(
          '👥 Реферальная система:\n\n' +
          '📊 Ваши рефералы: 0\n' +
          '💰 Заработано с рефералов: 0 Stars\n\n' +
          '🔗 Ваша реферальная ссылка:\n' +
          `${refLink}\n\n` +
          '💡 За каждого приглашенного друга получаете 5 Stars!',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'tasks':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '🎯 Доступные задания:\n\n' +
          '✅ Ежедневный вход (1 Star)\n' +
          '├ Выполнено: 0/1\n' +
          '└ Награда: 1 Star\n\n' +
          '✅ Пригласить друга (5 Stars)\n' +
          '├ Выполнено: 0/∞\n' +
          '└ Награда: 5 Stars\n\n' +
          '✅ Использовать WebApp (2 Stars)\n' +
          '├ Выполнено: 0/1\n' +
          '└ Награда: 2 Stars\n\n' +
          '💡 Выполняйте задания для заработка Stars!',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'settings':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '⚙️ Настройки:\n\n' +
          '🔔 Уведомления: Включены\n' +
          '🌙 Тема: Авто\n' +
          '🌍 Язык: Русский\n' +
          '📱 Версия: 1.0.0\n\n' +
          '🔧 Дополнительные настройки:\n' +
          '├ Авто-обмен: Выключен\n' +
          '├ Уведомления о заданиях: Включены\n' +
          '└ Статистика: Публичная\n\n' +
          'Настройки пока не доступны для изменения.',
          inlineKeyboardWithBack()
        );
        break;
      
      case 'webapp':
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
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