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

// Получить текущий титул пользователя (функционал отключен)
const getUserCurrentTitle = async (userId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId });
  // Возвращаем титул по умолчанию
  return AVAILABLE_TITLES.NOVICE;
};

// Получить все разблокированные титулы пользователя (функционал отключен)
const getUserUnlockedTitles = async (userId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId });
  // Возвращаем только титул по умолчанию
  return [AVAILABLE_TITLES.NOVICE];
};

// Установить титул пользователю (функционал отключен)
const setUserTitle = async (userId, titleId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId, titleId });
  // Ничего не делаем, возвращаем успех
  return { success: true, message: 'Титул установлен (функционал отключен)' };
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

// Разблокировать титул пользователю (функционал отключен)
const unlockTitle = async (userId, titleId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId, titleId });
  // Возвращаем титул по умолчанию
  return AVAILABLE_TITLES.NOVICE;
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

// Проверить, разблокирован ли титул у пользователя (функционал отключен)
const isTitleUnlocked = async (userId, titleId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId, titleId });
  // Возвращаем true только для титула по умолчанию
  return titleId.toLowerCase() === 'novice';
};

// Получить историю титулов пользователя (функционал отключен)
const getUserTitleHistory = async (userId) => {
  logger.debug('⛔ Функционал титулов отключен', { userId });
  // Возвращаем пустую историю
  return [];
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
