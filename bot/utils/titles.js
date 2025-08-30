// Система управления титулами пользователей
const dataManager = require('./dataManager');
const logger = require('./logger');

// Доступные титулы
const AVAILABLE_TITLES = {
  NOVICE: {
    id: 'novice',
    name: 'Новичок',
    description: 'Начинающий пользователь',
    color: '🟢',
    rarity: 'common',
    isDefault: true
  },
  OWNER: {
    id: 'owner',
    name: 'Владелец',
    description: 'Привилегированный пользователь',
    color: '🟡',
    rarity: 'rare',
    isDefault: false
  }
};

// Инициализация титулов пользователя
const initializeUserTitles = async (userId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.titles;
  } catch (error) {
    logger.error('Ошибка инициализации титулов пользователя', error, { userId });
    return {
      current: 'novice',
      unlocked: ['novice'],
      history: []
    };
  }
};

// Получить текущий титул пользователя
const getUserCurrentTitle = async (userId) => {
  try {
    const currentTitleId = await dataManager.getCurrentTitle(userId);
    return AVAILABLE_TITLES[currentTitleId.toUpperCase()] || AVAILABLE_TITLES.NOVICE;
  } catch (error) {
    logger.error('Ошибка получения текущего титула пользователя', error, { userId });
    return AVAILABLE_TITLES.NOVICE;
  }
};

// Получить все разблокированные титулы пользователя
const getUserUnlockedTitles = async (userId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.titles.unlocked.map(titleId => 
      AVAILABLE_TITLES[titleId.toUpperCase()]
    ).filter(Boolean);
  } catch (error) {
    logger.error('Ошибка получения разблокированных титулов', error, { userId });
    return [AVAILABLE_TITLES.NOVICE];
  }
};

// Установить титул пользователю
const setUserTitle = async (userId, titleId) => {
  try {
    const user = await dataManager.getUser(userId);
    const titleKey = titleId.toUpperCase();
    
    if (!AVAILABLE_TITLES[titleKey]) {
      throw new Error('Неверный титул');
    }
    
    if (!user.titles.unlocked.includes(titleId)) {
      throw new Error('У вас нет доступа к этому титулу');
    }
    
    const oldTitle = user.titles.current;
    
    // Обновляем текущий титул
    await dataManager.updateUser(userId, {
      'titles.current': titleId,
      'titles.history': [...user.titles.history, {
        titleId: titleId,
        timestamp: new Date(),
        action: 'set'
      }]
    });
    
    logger.info('Титул пользователя изменен', { userId, oldTitle, newTitle: titleId });
    
    return {
      oldTitle: AVAILABLE_TITLES[oldTitle.toUpperCase()],
      newTitle: AVAILABLE_TITLES[titleKey]
    };
    
  } catch (error) {
    logger.error('Ошибка установки титула пользователю', error, { userId, titleId });
    throw error;
  }
};

// Разблокировать титул пользователю
const unlockTitle = async (userId, titleId) => {
  try {
    const unlockedTitles = await dataManager.unlockTitle(userId, titleId);
    
    logger.info('Титул разблокирован пользователю', { userId, titleId, unlockedTitles });
    
    return AVAILABLE_TITLES[titleId.toUpperCase()];
    
  } catch (error) {
    logger.error('Ошибка разблокировки титула', error, { userId, titleId });
    throw error;
  }
};

// Получить информацию о титуле
const getTitleInfo = (titleId) => {
  const titleKey = titleId.toUpperCase();
  return AVAILABLE_TITLES[titleKey] || null;
};

// Получить все доступные титулы
const getAllAvailableTitles = () => {
  return Object.values(AVAILABLE_TITLES);
};

// Проверить, разблокирован ли титул у пользователя
const isTitleUnlocked = async (userId, titleId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.titles.unlocked.includes(titleId);
  } catch (error) {
    logger.error('Ошибка проверки разблокировки титула', error, { userId, titleId });
    return false;
  }
};

// Получить историю титулов пользователя
const getUserTitleHistory = async (userId) => {
  try {
    const user = await dataManager.getUser(userId);
    return user.titles.history;
  } catch (error) {
    logger.error('Ошибка получения истории титулов', error, { userId });
    return [];
  }
};

module.exports = {
  // Основные функции
  getUserCurrentTitle,
  getUserUnlockedTitles,
  setUserTitle,
  unlockTitle,
  
  // Информация о титулах
  getTitleInfo,
  getAllAvailableTitles,
  
  // Утилиты
  isTitleUnlocked,
  getUserTitleHistory,
  initializeUserTitles,
  
  // Константы
  AVAILABLE_TITLES
};
