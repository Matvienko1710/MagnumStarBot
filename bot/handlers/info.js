const { inlineKeyboard } = require('../keyboards/inline');
const { isAdmin } = require('../utils/admin');

module.exports = (bot) => {
  // Обработка команды /info
  bot.command('info', async (ctx) => {
    const adminStatus = isAdmin(ctx.from.id);
    await ctx.reply(
      'ℹ️ Информация о боте:\n\n' +
      'Magnum Star Bot - платформа для заработка Stars и Magnum Coins.\n\n' +
      '🎯 Основные функции:\n' +
      '• 👤 Профиль пользователя\n' +
      (adminStatus ? '• 🌐 WebApp (только для админов)\n' : '') +
      (adminStatus ? '• 🔧 Админ панель\n' : '') +
      '\nИспользуйте кнопки ниже для навигации:',
      inlineKeyboard(adminStatus)
    );
  });

  // Обработка команды /menu
  bot.command('menu', async (ctx) => {
    const adminStatus = isAdmin(ctx.from.id);
    await ctx.reply('Выберите действие:', inlineKeyboard(adminStatus));
  });

  // Обработка текстовых сообщений
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    const adminStatus = isAdmin(ctx.from.id);
    
    switch (text) {
      case 'меню':
      case 'menu':
      case 'кнопки':
      case 'buttons':
        await ctx.reply('Выберите действие:', inlineKeyboard(adminStatus));
        break;
        
      case 'профиль':
      case 'profile':
        const user = ctx.from;
        const userName = user.first_name || 'пользователь';
        const userId = user.id;
        
        // Получаем данные из системы валюты
        const { getUserBalance, getUserStats } = require('../utils/currency');
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
        
        await ctx.reply(profileMessage, inlineKeyboard(adminStatus));
        break;
        
      case 'веб':
      case 'webapp':
      case 'web':
        if (!adminStatus) {
          await ctx.reply('❌ Доступ запрещен. Эта функция доступна только администраторам.');
          return;
        }
        
        await ctx.reply(
          '🌐 WebApp - дополнительный функционал:\n\n' +
          '📱 Расширенный интерфейс\n' +
          '📊 Детальная статистика\n' +
          '🎮 Дополнительные задания\n' +
          '💬 Чат с поддержкой\n\n' +
          'Открываем WebApp...',
          inlineKeyboard(adminStatus)
        );
        break;
        
      case 'админ':
      case 'admin':
      case 'панель':
      case 'panel':
        if (!adminStatus) {
          await ctx.reply('❌ Доступ запрещен. Админ панель доступна только администраторам.');
          return;
        }
        
        const { getAdminStats, getBotStats } = require('../utils/admin');
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
        
        await ctx.reply(adminMessage, inlineKeyboard(adminStatus));
        break;
        
      default:
        await ctx.reply(
          'Не понимаю команду. Напишите "меню" для показа кнопок или используйте команду /info',
          inlineKeyboard(adminStatus)
        );
    }
  });
};