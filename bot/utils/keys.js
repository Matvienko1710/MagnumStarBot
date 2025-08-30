// Система управления ключами активации (промокодами)

const logger = require('./logger');

// Генерация уникального ключа из 12 цифр
function generateKey() {
    let key = '';
    for (let i = 0; i < 12; i++) {
        key += Math.floor(Math.random() * 10);
    }
    return key;
}

// Проверка формата ключа (12 цифр)
function validateKeyFormat(key) {
    return /^\d{12}$/.test(key);
}

// Создание нового ключа
function createKey(type, reward, maxUses = 1) {
    const key = generateKey();
    
    const keyData = {
        key: key,
        type: type, // 'stars', 'coins', 'title'
        reward: reward,
        maxUses: maxUses,
        currentUses: 0,
        createdAt: new Date(),
        isActive: true
    };
    
    // Если это ключ титула, добавляем titleId
    if (type === 'title') {
        keyData.titleId = reward.titleId;
        keyData.stars = reward.stars || 0;
        keyData.coins = reward.coins || 0;
    }
    
    logger.info('Создан новый ключ', { 
        key: key.substring(0, 6) + '...', 
        type, 
        reward: JSON.stringify(reward),
        maxUses 
    });
    
    return keyData;
}

// Активация ключа
function activateKey(key, userId) {
    // Здесь будет логика проверки ключа в базе данных
    // Пока что возвращаем заглушку
    
    logger.info('Попытка активации ключа', { 
        key: key.substring(0, 6) + '...', 
        userId 
    });
    
    // Имитируем успешную активацию
    return {
        success: true,
        type: 'stars',
        reward: {
            stars: 50,
            coins: 25
        },
        message: 'Ключ успешно активирован!'
    };
}

module.exports = {
    generateKey,
    validateKeyFormat,
    createKey,
    activateKey
};
