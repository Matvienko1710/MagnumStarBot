// API для обработки награды за открытие кейса

// Пытаемся использовать функции бота, если доступны
let botFunctions = null;

try {
  // Импортируем функции бота
  const currency = require('../../bot/utils/currency');
  botFunctions = {
    getUserBalance: currency.getUserBalance,
    updateCoins: currency.updateCoins,
    updateStars: currency.updateStars
  };
  console.log('✅ Функции бота доступны для API награды');
} catch (error) {
  console.warn('⚠️ Функции бота недоступны для API награды, используем fallback:', error.message);
}

// Fallback функции
import { 
  getUserBalance as fallbackGetUserBalance, 
  addBalance, 
  deductBalance,
  canAfford 
} from '../../shared/balanceStore.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  const { userId } = req.query;
  const { type, amount, item, rarity } = req.body;

  if (!userId || !type || amount === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  const numericUserId = parseInt(userId);
  const numericAmount = parseInt(amount);

  if (isNaN(numericUserId) || isNaN(numericAmount)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid parameters format'
    });
  }

  try {
    console.log(`🎁 Обработка награды для пользователя ${userId}:`, {
      type,
      amount,
      item,
      rarity
    });

    let updatedBalance;
    const reason = `case_reward_${item}_${rarity}`;

    if (botFunctions) {
      // Используем функции бота
      try {
        if (type === 'coins') {
          await botFunctions.updateCoins(numericUserId, numericAmount, reason);
        } else if (type === 'stars') {
          await botFunctions.updateStars(numericUserId, numericAmount, reason);
        }
        
        // Получаем полный баланс после обновления
        updatedBalance = await botFunctions.getUserBalance(numericUserId);
        console.log('🎁 Награда добавлена через бота:', updatedBalance);
      } catch (error) {
        console.warn('⚠️ Ошибка добавления награды через бота, используем fallback:', error.message);
        updatedBalance = addBalance(numericUserId, type, numericAmount, reason);
      }
    } else {
      // Используем fallback хранилище
      updatedBalance = addBalance(numericUserId, type, numericAmount, reason);
    }

    const responseData = {
      stars: updatedBalance.stars || 0,
      coins: updatedBalance.coins || 0,
      totalEarned: updatedBalance.totalEarned || { stars: 0, coins: 0 }
    };

    const response = {
      success: true,
      message: 'Reward processed successfully',
      // Новый формат (прямо в корне)
      ...responseData,
      // Старый формат (в объекте balance для совместимости)
      balance: responseData,
      reward: {
        item,
        type,
        amount: numericAmount,
        rarity,
        timestamp: Date.now()
      }
    };

    console.log(`✅ Награда обработана для пользователя ${userId}:`, response);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Ошибка обработки награды:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process reward',
      message: error.message
    });
  }
}
