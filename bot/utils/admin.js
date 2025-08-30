// Система управления администраторами

// Получение списка администраторов из переменной окружения
const getAdminIds = () => {
  const adminIdsString = process.env.ADMIN_IDS || '';
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
const isAdmin = (userId) => {
  const adminIds = getAdminIds();
  const isUserAdmin = adminIds.includes(Number(userId));
  
  console.log(`🔍 Проверка админа для пользователя ${userId}:`);
  console.log(`📋 Список админов из ADMIN_IDS: [${adminIds.join(', ')}]`);
  console.log(`✅ Результат: ${isUserAdmin ? 'ДА' : 'НЕТ'}`);
  
  return isUserAdmin;
};

// Получение статистики администратора
const getAdminStats = () => {
  const adminIds = getAdminIds();
  
  return {
    totalAdmins: adminIds.length,
    adminIds: adminIds,
    botInfo: {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform
    }
  };
};

// Функция для получения общей статистики бота
const getBotStats = () => {
  // Здесь можно добавить логику для получения статистики бота
  // Например, количество пользователей, активность и т.д.
  
  return {
    totalUsers: 0, // Пока ставим 0, потом можно подключить БД
    activeUsers: 0,
    totalTransactions: 0,
    botUptime: process.uptime(),
    serverTime: new Date().toISOString()
  };
};

module.exports = {
  getAdminIds,
  isAdmin,
  getAdminStats,
  getBotStats
};
