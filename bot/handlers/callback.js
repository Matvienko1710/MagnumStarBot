const { inlineKeyboard, inlineKeyboardWithBack } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { getUserBalance, getUserStats, getTransactionHistory } = require('../utils/currency');
const { getTaskStats, getAvailableTasks } = require('../utils/tasks');

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
        
        // Получаем данные из системы валюты
        const balance = getUserBalance(userId);
        const currencyStats = getUserStats(userId);
        const taskStats = getTaskStats(userId);
        
        const profileMessage = `👤 Профиль пользователя:

👤 Основная информация
├ ID: ${userId}
├ Имя: ${userName}
├ Username: ${user.username || 'Не указан'}
└ Дата регистрации: ${new Date().toLocaleDateString('ru-RU')}

💎 Баланс
├ ⭐ Stars: ${balance.stars}
└ 🪙 Magnum Coins: ${balance.coins}

👥 Реферальная система
├ Рефералы: 0
├ Заработано: 0 Stars
└ Уровень: Новичок

📊 Статистика
├ Заданий выполнено: ${taskStats.completedTasks}/${taskStats.totalTasks}
├ Доступно заданий: ${taskStats.availableTasks}
├ Всего транзакций: ${currencyStats.totalTransactions}
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
      
      case 'back':
        await ctx.answerCbQuery();
        // Возвращаемся к предыдущему меню (в данном случае к главному)
        const welcomeMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(welcomeMessage, inlineKeyboard());
        break;
      
      case 'main_menu':
        await ctx.answerCbQuery();
        const mainMenuMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(mainMenuMessage, inlineKeyboard());
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};