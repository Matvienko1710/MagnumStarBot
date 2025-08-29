const { inlineKeyboard, inlineKeyboardWithBack } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    switch (callbackData) {
      case 'profile':
        await ctx.answerCbQuery();
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        const userId = user.id;
        const userStars = 0; // Пока ставим 0, потом можно подключить БД
        const userCoins = 0; // Пока ставим 0, потом можно подключить БД
        const referrals = 0; // Пока ставим 0, потом можно подключить БД
        const earnedFromRefs = 0; // Пока ставим 0, потом можно подключить БД
        
        const profileMessage = `👤 Профиль пользователя:

👤 Основная информация
├ ID: ${userId}
├ Имя: ${userName}
├ Username: ${user.username || 'Не указан'}
└ Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}

💎 Баланс
├ ⭐ Stars: ${userStars}
└ 🪙 Magnum Coins: ${userCoins}

👥 Реферальная система
├ Рефералы: ${referrals}
├ Заработано: ${earnedFromRefs} Stars
└ Уровень: Новичок

📊 Статистика
├ Заданий выполнено: 0
├ Время в боте: 0 мин
└ Последний вход: Сегодня

🎯 Достижения
├ 🏆 Первые шаги (зарегистрировался)
└ 🔄 В процессе: Ежедневный вход (0/7 дней)`;
        
        await ctx.editMessageText(profileMessage, inlineKeyboardWithBack());
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