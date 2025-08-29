const { getUserBalance, getUserStats } = require('./currency');

// Функция для генерации профиля пользователя
const generateUserProfile = (user) => {
  const userName = user.first_name || 'пользователь';
  const userId = user.id;
  
  // Получаем данные из системы валюты
  const balance = getUserBalance(userId);
  const currencyStats = getUserStats(userId);
  
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
├ Всего транзакций: ${currencyStats.totalTransactions}
├ Всего заработано Stars: ${currencyStats.totalEarned.stars}
├ Всего заработано Coins: ${currencyStats.totalEarned.coins}
└ Последний вход: Сегодня

🎯 Выберите действие:`;
};

module.exports = {
  generateUserProfile
};
