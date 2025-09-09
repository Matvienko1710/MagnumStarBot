// API для работы с балансом пользователей
import { 
  getUserBalance, 
  updateUserBalance, 
  canAfford, 
  deductBalance, 
  addBalance,
  getTransactionHistory 
} from './shared/balanceStore.js';

export default function handler(req, res) {
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
      const balance = getUserBalance(numericUserId);
      
      res.status(200).json({
        success: true,
        stars: balance.stars,
        coins: balance.coins,
        totalEarned: balance.totalEarned,
        lastUpdate: balance.lastUpdate
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
      
      const updatedBalance = updateUserBalance(numericUserId, type, numericAmount, reason);
      
      res.status(200).json({
        success: true,
        message: 'Balance updated successfully',
        stars: updatedBalance.stars,
        coins: updatedBalance.coins,
        totalEarned: updatedBalance.totalEarned,
        lastUpdate: updatedBalance.lastUpdate
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
