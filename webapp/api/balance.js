// API для работы с балансом пользователей

// Пытаемся использовать функции бота, если доступны
let botFunctions = null;

try {
  // Импортируем функции бота с правильным путем
  const currency = require('../../bot/utils/currency');
  botFunctions = {
    getUserBalance: currency.getUserBalance,
    updateCoins: currency.updateCoins,
    updateStars: currency.updateStars
  };
  console.log('✅ Функции бота доступны, используем их для API баланса');
} catch (error) {
  console.warn('⚠️ Функции бота недоступны, используем fallback хранилище:', error.message);
  console.warn('📍 Попробуем альтернативный путь...');
  
  try {
    // Альтернативный путь для случая, если API находится в другой папке
    const path = require('path');
    const botPath = path.resolve(__dirname, '../../bot/utils/currency.js');
    const currency = require(botPath);
    botFunctions = {
      getUserBalance: currency.getUserBalance,
      updateCoins: currency.updateCoins,
      updateStars: currency.updateStars
    };
    console.log('✅ Функции бота найдены по альтернативному пути');
  } catch (error2) {
    console.warn('⚠️ И альтернативный путь не сработал:', error2.message);
  }
}

// Fallback функции для случая, когда бот недоступен
const { 
  getUserBalance: fallbackGetUserBalance, 
  updateUserBalance: fallbackUpdateUserBalance, 
  canAfford, 
  deductBalance, 
  addBalance,
  getTransactionHistory 
} = require('./shared/balanceStore.js');

module.exports = function handler(req, res) {
  const { method, query, body } = req;
  const { userId } = query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid User ID format'
    });
  }

  try {
    if (method === 'GET') {
      // Получение баланса
      let balance;
      
      if (botFunctions) {
        // Используем функции бота
        try {
          balance = await botFunctions.getUserBalance(numericUserId);
          console.log('📊 Баланс получен от бота:', balance);
        } catch (error) {
          console.warn('⚠️ Ошибка получения баланса от бота, используем fallback:', error.message);
          balance = fallbackGetUserBalance(numericUserId);
        }
      } else {
        // Используем fallback хранилище
        balance = fallbackGetUserBalance(numericUserId);
      }
      
      const responseData = {
        stars: balance.stars || 0,
        coins: balance.coins || 0,
        totalEarned: balance.totalEarned || { stars: 0, coins: 0 },
        lastUpdate: balance.lastUpdate || Date.now()
      };

      res.status(200).json({
        success: true,
        // Новый формат (прямо в корне)
        ...responseData,
        // Старый формат (в объекте balance для совместимости)
        balance: responseData
      });
      
    } else if (method === 'POST') {
      // Обновление баланса
      const { type, amount, reason } = body;
      
      if (!type || amount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Type and amount are required'
        });
      }
      
      if (!['coins', 'stars'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be "coins" or "stars"'
        });
      }
      
      const numericAmount = parseInt(amount);
      if (isNaN(numericAmount)) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a number'
        });
      }
      
      let updatedBalance;
      
      if (botFunctions) {
        // Используем функции бота
        try {
          console.log('🔄 Обновляем баланс через бота:', { userId: numericUserId, type, amount: numericAmount, reason });
          
          if (type === 'coins') {
            updatedBalance = await botFunctions.updateCoins(numericUserId, numericAmount, reason);
          } else if (type === 'stars') {
            updatedBalance = await botFunctions.updateStars(numericUserId, numericAmount, reason);
          }
          
          // Получаем полный баланс после обновления
          updatedBalance = await botFunctions.getUserBalance(numericUserId);
          console.log('✅ Баланс обновлен через бота:', updatedBalance);
        } catch (error) {
          console.error('❌ Ошибка обновления баланса через бота:', error.message);
          console.warn('⚠️ Используем fallback хранилище');
          updatedBalance = fallbackUpdateUserBalance(numericUserId, type, numericAmount, reason);
        }
      } else {
        // Используем fallback хранилище
        console.log('🔄 Обновляем баланс через fallback:', { userId: numericUserId, type, amount: numericAmount, reason });
        updatedBalance = fallbackUpdateUserBalance(numericUserId, type, numericAmount, reason);
        console.log('✅ Баланс обновлен через fallback:', updatedBalance);
      }
      
      const responseData = {
        stars: updatedBalance.stars || 0,
        coins: updatedBalance.coins || 0,
        totalEarned: updatedBalance.totalEarned || { stars: 0, coins: 0 },
        lastUpdate: updatedBalance.lastUpdate || Date.now()
      };

      res.status(200).json({
        success: true,
        message: 'Balance updated successfully',
        // Новый формат (прямо в корне)
        ...responseData,
        // Старый формат (в объекте balance для совместимости)
        balance: responseData
      });
      
    } else {
      res.status(405).json({
        success: false,
        error: 'Method Not Allowed'
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка API баланса:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
