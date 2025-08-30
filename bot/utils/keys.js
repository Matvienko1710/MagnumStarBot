// Система управления ключами активации (промокодами)

const { updateStars, updateCoins } = require('./currency');
const { unlockTitle } = require('./titles');

// Временное хранилище данных (в реальном проекте заменить на БД)
const activationKeys = new Map();
const usedKeys = new Map();
const userKeyHistory = new Map();

// Генерация ключа из 12 символов
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Создание нового ключа активации
const createKey = (reward = { stars: 10, coins: 0 }, maxUses = 1, description = 'Стандартный ключ', titleReward = null) => {
  const key = generateKey();
  
  activationKeys.set(key, {
    reward: reward,
    titleReward: titleReward,
    maxUses: maxUses,
    currentUses: 0,
    description: description,
    createdAt: new Date(),
    isActive: true
  });
  
  return key;
};

// Проверка существования ключа
const keyExists = (key) => {
  return activationKeys.has(key.toUpperCase());
};

// Проверка возможности использования ключа
const canUseKey = (key, userId) => {
  const upperKey = key.toUpperCase();
  
  if (!keyExists(upperKey)) {
    return { canUse: false, reason: 'Ключ не найден' };
  }
  
  const keyData = activationKeys.get(upperKey);
  
  if (!keyData.isActive) {
    return { canUse: false, reason: 'Ключ деактивирован' };
  }
  
  if (keyData.currentUses >= keyData.maxUses) {
    return { canUse: false, reason: 'Ключ уже использован максимальное количество раз' };
  }
  
  // Проверяем, не использовал ли пользователь этот ключ
  if (!userKeyHistory.has(userId)) {
    userKeyHistory.set(userId, []);
  }
  
  const userHistory = userKeyHistory.get(userId);
  if (userHistory.includes(upperKey)) {
    return { canUse: false, reason: 'Вы уже использовали этот ключ' };
  }
  
  return { canUse: true, keyData: keyData };
};

// Активация ключа пользователем
const activateKey = (key, userId) => {
  const upperKey = key.toUpperCase();
  const check = canUseKey(upperKey, userId);
  
  if (!check.canUse) {
    throw new Error(check.reason);
  }
  
  const keyData = check.keyData;
  
  // Выдаем награду
  const results = {};
  
  if (keyData.reward.stars > 0) {
    results.stars = updateStars(userId, keyData.reward.stars, `key_activation_${upperKey}`);
  }
  
  if (keyData.reward.coins > 0) {
    results.coins = updateCoins(userId, keyData.reward.coins, `key_activation_${upperKey}`);
  }
  
  // Выдаем титул, если есть
  if (keyData.titleReward) {
    try {
      const unlockedTitle = unlockTitle(userId, keyData.titleReward);
      results.title = unlockedTitle;
    } catch (error) {
      // Если титул уже разблокирован, игнорируем ошибку
      console.log(`Title already unlocked for user ${userId}: ${error.message}`);
    }
  }
  
  // Обновляем статистику использования ключа
  keyData.currentUses += 1;
  
  // Добавляем в историю пользователя
  if (!userKeyHistory.has(userId)) {
    userKeyHistory.set(userId, []);
  }
  userKeyHistory.get(userId).push(upperKey);
  
  // Если ключ достиг лимита использований, деактивируем его
  if (keyData.currentUses >= keyData.maxUses) {
    keyData.isActive = false;
  }
  
  // Проверяем реферальную систему
  try {
    const { getReferralActivityReward } = require('./referral');
    const referralData = require('./referral').getUserReferralData(userId);
    
    if (referralData.referrerId) {
      // Даем награду рефереру за активацию ключа
      const reward = getReferralActivityReward(referralData.referrerId, userId, 'key_activation');
      if (reward) {
        console.log(`Реферальная награда: ${referralData.referrerId} получил ${reward.stars} ⭐ ${reward.coins} 🪙 за активацию ключа ${userId}`);
      }
    }
  } catch (error) {
    console.log('Ошибка при начислении реферальной награды:', error.message);
  }
  
  return {
    key: upperKey,
    reward: keyData.reward,
    titleReward: keyData.titleReward,
    results: results,
    description: keyData.description,
    remainingUses: keyData.maxUses - keyData.currentUses
  };
};

// Получение информации о ключе (для админов)
const getKeyInfo = (key) => {
  const upperKey = key.toUpperCase();
  
  if (!keyExists(upperKey)) {
    return null;
  }
  
  const keyData = activationKeys.get(upperKey);
  return {
    key: upperKey,
    ...keyData,
    remainingUses: keyData.maxUses - keyData.currentUses
  };
};

// Получение статистики ключей
const getKeysStats = () => {
  const keys = Array.from(activationKeys.entries());
  
  return {
    totalKeys: keys.length,
    activeKeys: keys.filter(([_, data]) => data.isActive).length,
    totalUses: keys.reduce((sum, [_, data]) => sum + data.currentUses, 0),
    keys: keys.map(([key, data]) => ({
      key: key,
      ...data,
      remainingUses: data.maxUses - data.currentUses
    }))
  };
};

// Получение истории использования ключей пользователем
const getUserKeyHistory = (userId) => {
  if (!userKeyHistory.has(userId)) {
    return [];
  }
  
  const userKeys = userKeyHistory.get(userId);
  return userKeys.map(key => {
    const keyData = activationKeys.get(key);
    return {
      key: key,
      usedAt: new Date(), // В реальном проекте нужно хранить время использования
      reward: keyData ? keyData.reward : { stars: 0, coins: 0 },
      description: keyData ? keyData.description : 'Неизвестный ключ'
    };
  });
};

// Создание нескольких тестовых ключей
const createTestKeys = () => {
  // Создаем несколько ключей для тестирования
  createKey({ stars: 50, coins: 100 }, 1, 'Тестовый ключ 1');
  createKey({ stars: 25, coins: 50 }, 5, 'Тестовый ключ 2');
  createKey({ stars: 100, coins: 0 }, 1, 'Премиум ключ');
  createKey({ stars: 0, coins: 200 }, 10, 'Ключ для Coins');
};

// Инициализация тестовых ключей при первом запуске
if (activationKeys.size === 0) {
  createTestKeys();
}

module.exports = {
  // Основные функции
  createKey,
  keyExists,
  canUseKey,
  activateKey,
  
  // Информация и статистика
  getKeyInfo,
  getKeysStats,
  getUserKeyHistory,
  
  // Утилиты
  generateKey,
  createTestKeys
};
