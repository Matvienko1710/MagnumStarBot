// API для обработки награды за открытие кейса
import { 
  getUserBalance, 
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

    const updatedBalance = addBalance(
      numericUserId,
      type,
      numericAmount,
      `case_reward_${item}_${rarity}`
    );

    const response = {
      success: true,
      message: 'Reward processed successfully',
      stars: updatedBalance.stars,
      coins: updatedBalance.coins,
      totalEarned: updatedBalance.totalEarned,
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
