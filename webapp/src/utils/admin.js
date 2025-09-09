// Утилиты для проверки администраторов в веб-приложении

// Получение списка администраторов
export const getAdminIds = () => {
  // В браузере получаем из window или из переменных окружения
  // Для React приложений используем REACT_APP_ADMIN_IDS
  const adminIdsString = process.env.REACT_APP_ADMIN_IDS ||
                        process.env.ADMIN_IDS ||
                        window.ADMIN_IDS ||
                        window.Telegram?.WebApp?.initDataUnsafe?.adminIds ||
                        '';

  console.log('🔍 Отладка админов:');
  console.log('📝 REACT_APP_ADMIN_IDS:', process.env.REACT_APP_ADMIN_IDS);
  console.log('📝 process.env.ADMIN_IDS:', process.env.ADMIN_IDS);
  console.log('📝 window.ADMIN_IDS:', window.ADMIN_IDS);
  console.log('📝 Telegram adminIds:', window.Telegram?.WebApp?.initDataUnsafe?.adminIds);
  console.log('📝 Итоговая строка adminIdsString:', adminIdsString);

  if (!adminIdsString) {
    console.warn('⚠️ Переменная ADMIN_IDS не настроена');
    console.warn('📝 Настройте REACT_APP_ADMIN_IDS в переменных окружения сервера');
    console.warn('📝 Пример: REACT_APP_ADMIN_IDS=123456789,987654321');
    return [];
  }

  // Разбираем строку с ID администраторов (разделенные запятыми)
  const adminIds = adminIdsString
    .split(',')
    .map(id => id.trim())
    .filter(id => id && !isNaN(Number(id)))
    .map(id => Number(id));

  console.log('✅ Список админов:', adminIds);
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
  
  console.log('🔍 Проверка админа:');
  console.log('👤 ID пользователя:', userId);
  console.log('👥 Список админов:', adminIds);
  console.log('✅ Результат проверки:', isUserAdmin ? 'АДМИН' : 'НЕ АДМИН');

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
