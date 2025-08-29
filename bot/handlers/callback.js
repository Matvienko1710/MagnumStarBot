const { inlineKeyboard, inlineKeyboardWithBack } = require('../keyboards/inline');
const { generateUserProfile } = require('../utils/profile');
const { getUserBalance, getUserStats, getTransactionHistory } = require('../utils/currency');
const { isAdmin, getAdminStats, getBotStats } = require('../utils/admin');

module.exports = (bot) => {
  // Обработка колбэков от инлайн-кнопок
  bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const adminStatus = isAdmin(userId);
    
    switch (callbackData) {
      case 'profile':
        await ctx.answerCbQuery();
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        
        // Получаем данные из системы валюты
        const balance = getUserBalance(userId);
        const currencyStats = getUserStats(userId);
        
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
├ Всего транзакций: ${currencyStats.totalTransactions}
├ Всего заработано Stars: ${currencyStats.totalEarned.stars}
├ Всего заработано Coins: ${currencyStats.totalEarned.coins}
└ Последний вход: Сегодня`;
        
        await ctx.editMessageText(profileMessage, inlineKeyboardWithBack(adminStatus));
        break;
      
      case 'webapp':
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        await ctx.editMessageText(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
          inlineKeyboardWithBack(adminStatus)
        );
        break;
      
      case 'admin_panel':
        if (!adminStatus) {
          await ctx.answerCbQuery('Доступ запрещен');
          return;
        }
        
        await ctx.answerCbQuery();
        const adminStats = getAdminStats();
        const botStats = getBotStats();
        
        const adminMessage = `🔧 Админ панель:

👥 Администраторы
├ Всего админов: ${adminStats.totalAdmins}
├ ID админов: ${adminStats.adminIds.join(', ') || 'Не настроены'}
└ Ваш статус: Администратор

🤖 Информация о боте
├ Версия: ${adminStats.botInfo.version}
├ Время работы: ${Math.floor(adminStats.botInfo.uptime / 60)} мин
├ Платформа: ${adminStats.botInfo.platform}
└ Память: ${Math.round(adminStats.botInfo.memory.heapUsed / 1024 / 1024)} MB

📊 Статистика бота
├ Всего пользователей: ${botStats.totalUsers}
├ Активных пользователей: ${botStats.activeUsers}
├ Всего транзакций: ${botStats.totalTransactions}
└ Время сервера: ${new Date(botStats.serverTime).toLocaleString('ru-RU')}`;
        
        await ctx.editMessageText(adminMessage, inlineKeyboardWithBack(adminStatus));
        break;
      
      case 'back':
        await ctx.answerCbQuery();
        // Возвращаемся к предыдущему меню (в данном случае к главному)
        const welcomeMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(welcomeMessage, inlineKeyboard(adminStatus));
        break;
      
      case 'main_menu':
        await ctx.answerCbQuery();
        const mainMenuMessage = generateUserProfile(ctx.from);
        await ctx.editMessageText(mainMenuMessage, inlineKeyboard(adminStatus));
        break;
      
      default:
        await ctx.answerCbQuery('Неизвестная команда');
    }
  });
};