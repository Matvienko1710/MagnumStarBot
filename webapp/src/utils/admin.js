// Утилиты для проверки администраторов в веб-приложении

// Получение списка администраторов
export const getAdminIds = () => {
  // В браузере получаем из window или из переменных окружения
  // Используем ту же переменную, что и в боте: ADMIN_IDS
  const adminIdsString = process.env.REACT_APP_ADMIN_IDS ||
                        process.env.ADMIN_IDS ||
                        window.ADMIN_IDS ||
                        window.Telegram?.WebApp?.initDataUnsafe?.adminIds ||
                        '';

  console.log('🔍 DEBUG: Источники ADMIN_IDS проверены');

  if (!adminIdsString) {
    console.warn('⚠️ Переменная ADMIN_IDS не настроена, используем временный список');
    console.warn('📋 Временный админ ID: 6587897295');
    // Временное решение - добавляем известный ID администратора
    return [6587897295];
  }

  // Разбираем строку с ID администраторов (разделенные запятыми)
  const adminIds = adminIdsString
    .split(',')
    .map(id => id.trim())
    .filter(id => id && !isNaN(Number(id)))
    .map(id => Number(id));

  console.log('✅ Загружены ID администраторов:', adminIds);
  return adminIds;
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
  console.log(`📋 Список админов: [${adminIds.join(', ')}]`);
  console.log(`✅ Результат: ${isUserAdmin ? 'АДМИН ✅' : 'ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ ❌'}`);

  // Показываем информацию о текущем пользователе
  if (userId) {
    console.log(`👤 Текущий пользователь ID: ${userId}`);
    console.log(`📝 Для доступа к функциям добавьте этот ID в переменную ADMIN_IDS сервера`);
  }

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
