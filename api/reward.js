const express = require('express');
const { updateUserBalance } = require('./shared/balanceStore');

const router = express.Router();

// POST /api/reward/:userId/ad-watch
router.post('/:userId/ad-watch', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount } = req.body;
    const numericUserId = parseInt(userId);
    
    console.log(`📺 POST /api/reward/:userId/ad-watch - запрос получен:`, { 
      userId: userId, 
      body: { type, amount },
      timestamp: new Date().toISOString() 
    });

    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный ID пользователя' 
      });
    }

    if (!type || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недостаточно параметров' 
      });
    }

    console.log(`🎁 Выдаем награду за просмотр рекламы пользователю ${userId}:`, { type, amount });
    
    const updatedBalance = await updateUserBalance(numericUserId, type, amount, 'ad_watch');
    
    if (updatedBalance) {
      console.log(`✅ Награда за рекламу выдана пользователю ${userId}:`, updatedBalance);
      res.json({ 
        success: true, 
        reward: { type, amount },
        ...updatedBalance 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка выдачи награды' 
      });
    }
  } catch (error) {
    console.error('❌ Ошибка выдачи награды за рекламу:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера' 
    });
  }
});

// POST /api/reward/:userId/case-reward
router.post('/:userId/case-reward', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, amount, item, rarity } = req.body;
    const numericUserId = parseInt(userId);
    
    console.log(`🎁 Выдаем награду кейса для пользователя ${userId}:`, { type, amount, item, rarity });

    if (isNaN(numericUserId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный ID пользователя' 
      });
    }

    if (!type || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недостаточно параметров' 
      });
    }

    const reason = `case_reward_${item || amount}`;
    const updatedBalance = await updateUserBalance(numericUserId, type, amount, reason);
    
    if (updatedBalance) {
      console.log(`✅ Награда кейса выдана пользователю ${userId}:`, updatedBalance);
      res.json({ 
        success: true, 
        reward: { type, amount, item, rarity },
        ...updatedBalance 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка выдачи награды' 
      });
    }
  } catch (error) {
    console.error('❌ Ошибка выдачи награды кейса:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера' 
    });
  }
});

module.exports = router;
