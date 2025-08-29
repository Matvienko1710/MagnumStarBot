// Функция для генерации профиля пользователя
const generateUserProfile = (user) => {
  const userName = user.first_name || 'пользователь';
  const userId = user.id;
  
  // Здесь можно добавить логику для получения данных пользователя из БД
  const userStars = 0; // Пока ставим 0, потом можно подключить БД
  const userCoins = 0; // Пока ставим 0, потом можно подключить БД
  const referrals = 0; // Пока ставим 0, потом можно подключить БД
  const earnedFromRefs = 0; // Пока ставим 0, потом можно подключить БД
  
  return `👋 Привет, ${userName}! Рады видеть тебя в Magnum Stars!
Начни зарабатывать Звезды и MagnumCoin прямо сейчас.

👤 Профиль
├ ID: ${userId}
├ Имя: ${userName}

💎 Баланс
├ ⭐ Stars: ${userStars}
└ 🪙 Magnum Coins: ${userCoins}

👥 Реферальная система
├ Рефералы: ${referrals}
├ Заработано: ${earnedFromRefs}

🎯 Выберите действие:`;
};

module.exports = {
  generateUserProfile
};
