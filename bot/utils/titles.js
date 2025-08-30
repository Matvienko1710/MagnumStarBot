// Временное хранилище титулов пользователей (в реальном проекте заменить на БД)
const userTitles = new Map();

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
const initializeUserTitles = (userId) => {
  if (!userTitles.has(userId)) {
    userTitles.set(userId, {
      currentTitle: 'novice',
      unlockedTitles: ['novice'],
      titleHistory: []
    });
  }
  return userTitles.get(userId);
};

// Получить текущий титул пользователя
const getUserCurrentTitle = (userId) => {
  const userData = initializeUserTitles(userId);
  return AVAILABLE_TITLES[userData.currentTitle.toUpperCase()] || AVAILABLE_TITLES.NOVICE;
};

// Получить все разблокированные титулы пользователя
const getUserUnlockedTitles = (userId) => {
  const userData = initializeUserTitles(userId);
  return userData.unlockedTitles.map(titleId => 
    AVAILABLE_TITLES[titleId.toUpperCase()]
  ).filter(Boolean);
};

// Установить титул пользователю
const setUserTitle = (userId, titleId) => {
  const userData = initializeUserTitles(userId);
  const titleKey = titleId.toUpperCase();
  
  if (!AVAILABLE_TITLES[titleKey]) {
    throw new Error('Неверный титул');
  }
  
  if (!userData.unlockedTitles.includes(titleId)) {
    throw new Error('У вас нет доступа к этому титулу');
  }
  
  const oldTitle = userData.currentTitle;
  userData.currentTitle = titleId;
  
  // Добавляем в историю
  userData.titleHistory.push({
    titleId: titleId,
    timestamp: Date.now(),
    action: 'set'
  });
  
  return {
    oldTitle: AVAILABLE_TITLES[oldTitle.toUpperCase()],
    newTitle: AVAILABLE_TITLES[titleKey]
  };
};

// Разблокировать титул пользователю
const unlockTitle = (userId, titleId) => {
  const userData = initializeUserTitles(userId);
  const titleKey = titleId.toUpperCase();
  
  if (!AVAILABLE_TITLES[titleKey]) {
    throw new Error('Неверный титул');
  }
  
  if (userData.unlockedTitles.includes(titleId)) {
    throw new Error('Титул уже разблокирован');
  }
  
  userData.unlockedTitles.push(titleId);
  
  // Добавляем в историю
  userData.titleHistory.push({
    titleId: titleId,
    timestamp: Date.now(),
    action: 'unlock'
  });
  
  return AVAILABLE_TITLES[titleKey];
};

// Получить статистику титулов пользователя
const getUserTitlesStats = (userId) => {
  const userData = initializeUserTitles(userId);
  const currentTitle = getUserCurrentTitle(userId);
  const unlockedTitles = getUserUnlockedTitles(userId);
  
  return {
    currentTitle,
    unlockedTitles,
    totalUnlocked: userData.unlockedTitles.length,
    totalAvailable: Object.keys(AVAILABLE_TITLES).length,
    titleHistory: userData.titleHistory
  };
};

// Получить все доступные титулы
const getAllTitles = () => {
  return Object.values(AVAILABLE_TITLES);
};

// Получить конкретный титул по ID
const getTitleById = (titleId) => {
  const titleKey = titleId.toUpperCase();
  return AVAILABLE_TITLES[titleKey];
};

// Проверить, разблокирован ли титул у пользователя
const isTitleUnlocked = (userId, titleId) => {
  const userData = initializeUserTitles(userId);
  return userData.unlockedTitles.includes(titleId);
};

// Получить форматированное отображение титула
const getFormattedTitle = (title) => {
  return `${title.color} ${title.name}`;
};

module.exports = {
  getUserCurrentTitle,
  getUserUnlockedTitles,
  setUserTitle,
  unlockTitle,
  getUserTitlesStats,
  getAllTitles,
  getTitleById,
  isTitleUnlocked,
  getFormattedTitle,
  AVAILABLE_TITLES
};
