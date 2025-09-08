// Утилиты для проверки администраторов в веб-приложении

// Получение списка администраторов из переменной окружения
export const getAdminIds = () => {
  // В браузере получаем из window или из переменных окружения
  const adminIdsString = process.env.REACT_APP_ADMIN_IDS ||
                        window.ADMIN_IDS ||
                        window.Telegram?.WebApp?.initDataUnsafe?.adminIds ||
                        '';

  if (!adminIdsString) {
    return [];
  }

  // Разбираем строку с ID администраторов (разделенные запятыми)
  return adminIdsString
    .split(',')
    .map(id => id.trim())
    .filter(id => id && !isNaN(Number(id)))
    .map(id => Number(id));
};

// Проверка является ли пользователь администратором
export const isAdmin = (userId) => {
  if (!userId) {
    // Получаем userId из Telegram WebApp если не передан
    const webApp = window.Telegram?.WebApp;
    userId = webApp?.initDataUnsafe?.user?.id;
  }

  const adminIds = getAdminIds();
  const isUserAdmin = adminIds.includes(Number(userId));

  console.log(`🔍 Проверка админа для пользователя ${userId}:`);
  console.log(`📋 Список админов из ADMIN_IDS: [${adminIds.join(', ')}]`);
  console.log(`✅ Результат: ${isUserAdmin ? 'ДА' : 'НЕТ'}`);

  return isUserAdmin;
};

// Получение информации о текущем пользователе
export const getCurrentUser = () => {
  const webApp = window.Telegram?.WebApp;
  return webApp?.initDataUnsafe?.user || null;
};

// Проверка инициализации Telegram WebApp
export const isTelegramWebAppReady = () => {
  return !!window.Telegram?.WebApp?.initDataUnsafe?.user;
};
