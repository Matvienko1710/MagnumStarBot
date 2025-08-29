const { getUserBalance, getUserStats } = require('./currency');
const { getTaskStats } = require('./tasks');

// Функция для генерации профиля пользователя
const generateUserProfile = (user) => {
  const userName = user.first_name || 'пользователь';
  const userId = user.id;
  
  // Получаем данные из системы валюты
  const balance = getUserBalance(userId);
  const currencyStats = getUserStats(userId);
  const taskStats = getTaskStats(userId);
  
  return `👋 Привет, ${userName}! Рады видеть тебя в Magnum Stars!
Начни зарабатывать Звезды и MagnumCoin прямо сейчас.

👤 Профиль
├ ID: ${userId}
├ Имя: ${userName}

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
└ 🔄 В процессе: Ежедневный вход (0/7 дней)

🎯 Выберите действие:`;
};

module.exports = {
  generateUserProfile
};
